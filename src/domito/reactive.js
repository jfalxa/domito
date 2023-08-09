export default $;
export { $, $signal, $effect, $scope };
export { Signal, Effect, Scope, Scheduler };

/**
 * @template T
 * @overload
 * @param {Task<T>} value
 * @returns {Effect<T>}
 */

/**
 * @template T
 * @overload
 * @param {T} value
 * @returns {Signal<T>}
 */

/**
 * @template T
 * @param {T | Task<T>} value
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
  scope.run(task);
  return scope;
}

/**
 * @template T
 */
class Signal {
  static id = 0;

  /** @type {number} */ id;
  /** @type {Scope | undefined} */ scope;

  /** @type {ReactiveNodes} */ dependencies;
  /** @type {ReactiveNodes} */ subscribers;
  /** @type {T} */ _value;

  /**
   * @param {T} initialValue
   */
  constructor(initialValue) {
    this.id = Effect.id++;
    this._value = initialValue;
    this.dependencies = new Set();
    this.subscribers = new Set();
    Scope.addMember(this);
  }

  /**
   * @returns {T}
   */
  get value() {
    Effect.addDependency(this);
    return this._value;
  }

  /**
   * @param {T} newValue
   */
  set value(newValue) {
    Effect.addSubscriber(this);
    if (newValue !== this._value) {
      this._value = newValue;
      Scheduler.requestUpdate(this);
    }
  }

  get depth() {
    let depth = this.scope?.depth ?? -1;
    for (const dependency of this.dependencies) {
      depth = Math.max(depth, dependency.depth);
    }
    return depth + 1;
  }

  /**
   * @param {(value: T) => void} mutation
   */
  mutate(mutation) {
    mutation(this._value);
    Scheduler.requestUpdate(this);
  }

  dispose() {
    for (const dependency of this.dependencies) dependency.subscribers.delete(this);
    this.dependencies.clear();

    for (const subscriber of this.subscribers) subscriber.dependencies.delete(this);
    this.subscribers.clear();

    this.scope?.members.delete(this);
    this.scope = undefined;
  }
}

/**
 * @template T
 * @extends {Signal<T>}
 */
class Effect extends Signal {
  /** @type {Effect<any> | undefined} */
  static context; // tracks currently active Effect

  /** @type {Task<T> | undefined} */ task;

  /**
   * @param {Task<T>} task
   */
  constructor(task) {
    super(/** @type {T} */ (undefined));
    this.task = task;
    this.update(this);
  }

  /**
   * @param {Signal<any>} dependency
   */
  static addDependency(dependency) {
    if (Effect.context && dependency !== Effect.context) {
      Effect.context.dependencies.add(dependency);
      dependency.subscribers.add(Effect.context);
    }
  }

  /**
   * @param {Signal<any>} subscriber
   */
  static addSubscriber(subscriber) {
    if (Effect.context && subscriber !== Effect.context) {
      Effect.context.subscribers.add(subscriber);
    }
  }

  /**
   * @returns {T}
   */
  get value() {
    Effect.addDependency(this);
    return this._value;
  }

  set value(_) {
    throw new Error("Effect values are read-only");
  }

  /**
   * @param {this | undefined} context
   */
  update(context = undefined) {
    if (!this.task) return;

    const outerEffect = Effect.context;
    const outerScope = Scope.context;

    Effect.context = context;
    Scope.context = this.scope;

    const result = this.task(this._value);
    if (result !== undefined) this._value = result;

    Scope.context = outerScope;
    Effect.context = outerEffect;
  }
}

class Scope {
  /** @type {Scope | undefined} */
  static context; // tracks currently active Scope

  static id = 0;

  /** @type {number} */ id;
  /** @type {number} */ depth;

  /** @type {Scope | undefined} */ outerScope;
  /** @type {Set<Scope>} */ innerScopes;
  /** @type {ReactiveNodes} */ members;

  constructor() {
    this.id = Scope.id++;
    this.members = new Set();
    this.outerScope = Scope.context;
    this.outerScope?.innerScopes.add(this);
    this.innerScopes = new Set();
    this.depth = this.outerScope ? this.outerScope.depth + 1 : 0;
  }

  /**
   * @param {Signal<any> | Effect<any>} signal
   */
  static addMember(signal) {
    if (Scope.context) {
      signal.scope = Scope.context;
      Scope.context.members.add(signal);
    }
  }

  /**
   * @template T
   * @param {() => T} task
   * @returns {T}
   */
  run(task) {
    Scope.context = this;
    const result = task();
    Scope.context = this.outerScope;
    return result;
  }

  dispose() {
    for (const scope of Array.from(this.innerScopes)) scope.dispose();
    for (const member of Array.from(this.members)) member.dispose();
    this.outerScope?.innerScopes.delete(this);
    this.outerScope = undefined;
  }
}

class Scheduler {
  /** @type {boolean} */ static updating = false;
  /** @type {ReactiveNodes} */ static queue = new Set();

  /**
   * @param {Signal<any>} signal
   */
  static requestUpdate(signal) {
    Scheduler.queue.add(signal);

    // if an update was already requested in the current main task, stop here
    if (Scheduler.updating) return;

    // run the effects after the current main task is finished
    // so we can queue all the signals that were changed together
    Scheduler.updating = true;
    queueMicrotask(Scheduler.update);
  }

  static update() {
    const subscribers = /** @type {ReactiveNodes} */ (new Set());

    for (const signal of Scheduler.queue) {
      for (const subscriber of signal.subscribers) {
        Scheduler.queue.add(subscriber);
        subscribers.add(subscriber);
      }
    }

    const orderedSubscribers = Array.from(subscribers) //
      .sort((a, b) => a.depth - b.depth);

    for (const subscriber of orderedSubscribers) {
      if (subscriber instanceof Effect && subscriber.dependencies.size > 0) {
        subscriber.update();
      }
    }

    Scheduler.queue.clear();
    Scheduler.updating = false;
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

/** @typedef {Set<Signal<any>>} ReactiveNodes */

/**
 * @template T
 * @typedef {Signal<T> | (() => T)} Dynamic
 */

/**
 * @template T
 * @typedef {(value: T | undefined) => T | undefined} Task
 */
