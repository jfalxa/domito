/** @typedef {import("./reactive.js").ReactiveNodes} ReactiveNodes */

import { Scope } from "./scope.js";
import { Supervisor } from "./supervisor.js";

export { $signal, Signal };

/**
 * Create a reactive value that can be tracked in order to create automatic reactions to its changes.
 *
 * @template T
 * @param {T} value
 * @returns {Signal<T>}
 */
function $signal(value) {
  return new Signal(value);
}

/**
 * @template T
 */
class Signal {
  static id = 0;

  /** @protected @type {T} */ _value;

  /** @type {number} */ id;
  /** @type {number} */ depth;
  /** @type {Scope | undefined} */ scope;

  /** @type {boolean} */ willUpdate;
  /** @type {boolean} */ disposed;

  /** @type {ReactiveNodes} */ dependencies;
  /** @type {ReactiveNodes} */ subscribers;

  /**
   * @param {T} initialValue
   */
  constructor(initialValue) {
    this.id = Signal.id++;
    this.depth = 0;
    this._value = initialValue;
    this.willUpdate = false;
    this.disposed = false;
    this.dependencies = new Set();
    this.subscribers = new Set();
    Supervisor.register(this);
  }

  /**
   * The current value of the signal. Using it inside an effect will bind the effect to this signal.
   */
  get value() {
    Supervisor.registerDependency(this);
    return this._value;
  }

  set value(newValue) {
    Supervisor.registerSubscriber(this);
    if (newValue !== this._value) {
      this._value = newValue;
      Supervisor.requestUpdate(this);
    }
  }

  /**
   * Read the value of the signal without subscribing to it.
   *
   * @returns {T}
   */
  peek() {
    return this._value;
  }

  /**
   * Mutate the current value of the signal through a mutation function.
   *
   * The function takes the current value as parameter so you can mutate it if you want.
   * If the function returns a value and this value is different than the previous one, the signal value will be changed and an update will be requested.
   * If the function doesn't have a return or returns undefined, also request an update. That way, directly mutating the value will trigger updates as well.
   *
   * @param {(value: T) => T | void} mutation
   */
  mutate(mutation) {
    const result = mutation(this._value);

    const isVoid = result === undefined;
    const hasChange = result !== this._value;

    if (!isVoid && hasChange) this._value = result;
    if (isVoid || hasChange) Supervisor.requestUpdate(this);
  }

  /**
   * Mark this signal and its subscribers as deprecated so we know they should be updated.
   */
  deprecate() {
    if (this.disposed) return;

    for (const subscriber of this.subscribers) {
      if (!subscriber.disposed) subscriber.willUpdate = true;
    }
  }

  /**
   * Add a new subscriber to this signal. Everytime this signal will be changed, its subscribers will react.
   *
   * @param {Signal<any>} subscriber
   */
  subscribe(subscriber) {
    this.subscribers.add(subscriber);
    subscriber.dependencies.add(this);

    if (hasCycle(this)) throw new Error("Cycle detected");
    subscriber.move(this.depth + 1);
  }

  /**
   * Clean up the signal and remove it from the dependency graph
   */
  dispose() {
    for (const dependency of this.dependencies) dependency.subscribers.delete(this);
    for (const subscriber of this.subscribers) subscriber.dispose();
    this.dependencies.clear();
    this.scope?.members.delete(this);
    this.scope = undefined;
    this.disposed = true;
  }

  /**
   * @private
   * @param {number} depth
   */
  move(depth) {
    if (depth <= this.depth) return;
    this.depth = depth;
    for (const subscriber of this.subscribers) subscriber.move(this.depth + 1);
  }
}

/**
 * @param {Signal<any>} signal
 * @param {ReactiveNodes} [visited]
 * @param {ReactiveNodes} [visiting]
 * @returns {boolean}
 */
function hasCycle(signal, visited = new Set(), visiting = new Set()) {
  if (visiting.has(signal)) return true;
  if (visited.has(signal)) return false;

  visiting.add(signal);

  for (const subscriber of signal.subscribers) {
    if (hasCycle(subscriber, visited, visiting)) {
      return true;
    }
  }

  visiting.delete(signal);
  visited.add(signal);

  return false;
}
