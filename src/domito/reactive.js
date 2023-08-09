export default $;
export { $, $signal, $effect, $scope, Signal, Effect, Scope };

/** @template T @typedef {Signal<T> | (() => T)} Dynamic */
/** @typedef {Set<Effect<any>>} Subscribers */
/** @typedef {Set<Signal<any>>} Dependencies */

/** @type {Scope |undefined } */
let SCOPE; // tracks currently active Scope

/** @type {Effect<any> | undefined } */
let EFFECT; // tracks currently active Effect

/**
 * @template T
 * @overload
 * @param {() => T} value
 * @returns {Effect<T>}
 */

/**
 * @template T
 * @overload
 * @param {T } value
 * @returns {Signal<T>}
 */

/**
 * @template T
 * @param {T | (() => T)} value
 * @returns {Signal<T> | Effect<T>}
 */
function $(value) {
  if (typeof value === "function") {
    return new Effect(/** @type {() => T} */ (value));
  } else {
    return new Signal(value);
  }
}

/**
 * @template T
 * @param {T} value
 * @returns {Signal<T>}
 */
function $signal(value) {
  return new Signal(value);
}

/**
 * @template T
 * @param {() => T} compute
 * @returns {Effect<T>}
 */
function $effect(compute) {
  return new Effect(compute);
}

/**
 * @param {() => void} task
 * @returns {Scope}
 */
function $scope(task) {
  const scope = new Scope();
  scope.wrap(task);
  return scope;
}

/**
 * @template T
 */
class Signal {
  static id = 0;

  /** @type {number} */ id;
  /** @type {Scope | undefined} */ outerScope;
  /** @type {Subscribers} */ subscribers;
  /** @type {T} */ _value;

  /**
   * @param {T} initialValue
   */
  constructor(initialValue) {
    this.id = Signal.id++;
    this._value = initialValue;
    this.subscribers = new Set();
    addMember(this);
  }

  get value() {
    addDependency(this);
    return this._value;
  }

  /**
   * @param {T} newValue
   */
  set value(newValue) {
    if (newValue !== this._value) {
      this._value = newValue;
      queueUpdate(this);
    }
  }

  /**
   * @param {(value: T) => void} mutation
   */
  mutate(mutation) {
    mutation(this._value);
    queueUpdate(this);
  }

  /**
   * @param {Effect<any>} effect
   */
  subscribe(effect) {
    this.subscribers.add(effect);
    effect.dependencies.add(this);
  }

  /**
   * @param {Effect<any>} effect
   */
  unsubscribe(effect) {
    this.subscribers.delete(effect);
    effect.dependencies.delete(this);
  }

  dispose() {
    QUEUE.delete(this);
    for (const effect of Array.from(this.subscribers)) effect.dispose();
    this.outerScope?.members.delete(this);
    this.outerScope = undefined;
  }
}

/**
 * @template T
 * @extends {Signal<T>}
 */
class Effect extends Signal {
  /** @type {Dependencies} */ dependencies;
  /** @type {(() => T) | undefined} */ compute;

  /**
   * @param {() => T} compute
   */
  constructor(compute) {
    super(/** @type {T} */ (undefined));

    this.compute = compute;
    this.dependencies = new Set();

    this.update(this);
  }

  get value() {
    addDependency(this);
    return this._value;
  }

  set value(_) {
    throw new Error("Effect values are read-only");
  }

  valueOf() {
    return this.value;
  }

  /**
   * @param {this | undefined} context
   */
  update(context = undefined) {
    if (!this.compute) return;
    const outerEffect = EFFECT;
    const outerScope = SCOPE;
    EFFECT = context;
    SCOPE = this.outerScope;
    this._value = this.compute();
    SCOPE = outerScope;
    EFFECT = outerEffect;
  }

  dispose() {
    super.dispose();
    for (const dependency of Array.from(this.dependencies)) dependency.unsubscribe(this);
  }
}

class Scope {
  static id = 0;

  /** @type {number} */ id;
  /** @type {Scope | undefined} */ outerScope;
  /** @type {Set<Scope>} */ innerScopes;
  /** @type {Set<Signal<any>>} */ members;

  constructor() {
    this.id = Scope.id++;
    this.members = new Set();
    this.outerScope = SCOPE;
    this.outerScope?.innerScopes.add(this);
    this.innerScopes = new Set();
  }

  /**
   * @template T
   * @param {() => T} task
   * @returns {T}
   */
  wrap(task) {
    SCOPE = this;
    const result = task();
    SCOPE = this.outerScope;
    return result;
  }

  dispose() {
    for (const scope of Array.from(this.innerScopes)) scope.dispose();
    for (const member of Array.from(this.members)) member.dispose();
    this.outerScope?.innerScopes.delete(this);
    this.outerScope = undefined;
  }

  debug() {
    let str = `- Scope #${this.id}:\n`;

    for (const member of this.members) {
      const val = JSON.stringify(member._value);
      str += `  - ${member instanceof Effect ? "Effect" : "Signal"} #${member.id}: ${val}\n`;
    }

    for (const scope of this.innerScopes) {
      const substr = scope.debug().trim();
      str += "  " + substr.split("\n").join("\n  ") + "\n";
    }

    return str;
  }
}

/**
 * @param {any} value
 * @returns {value is Dynamic<any>}
 */
export function isDynamic(value) {
  return typeof value === "function" || value instanceof Signal;
}

/**
 * @template T
 * @param {Dynamic<T>} $dynamic
 * @returns {T}
 */
export function resolve($dynamic) {
  return typeof $dynamic === "function" ? $dynamic() : $dynamic.value;
}

let QUEUING = false;

/** @type {Set<Signal<any>>} */
let QUEUE = new Set();

/**
 * @param {Signal<any>} signal
 */
export function queueUpdate(signal) {
  QUEUE.add(signal);

  // if we're already queuing in the current main task, stop here
  if (QUEUING) return;

  // run the effects after the current main task is finished
  // so we can queue all the signals that were changed together
  QUEUING = true;
  queueMicrotask(runEffects);
}

/**
 * @param {Signal<any>} signal
 */
export function addDependency(signal) {
  if (EFFECT && signal !== EFFECT) {
    signal.subscribe(EFFECT);
  }
}

/**
 * @param {Signal<any> | Effect<any>} signal
 */
export function addMember(signal) {
  signal.outerScope = SCOPE;
  SCOPE?.members.add(signal);
}

function runEffects() {
  for (const signal of QUEUE) {
    for (const effect of signal.subscribers) {
      effect.update();
      QUEUE.delete(effect);
      QUEUE.add(effect);
    }
  }

  QUEUE.clear();
  QUEUING = false;
}
