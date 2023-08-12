/** @typedef {import("./reactive.js").ReactiveNodes} ReactiveNodes */

import { Scope } from "./scope.js";
import { Supervisor } from "./supervisor.js";

export { $signal, Signal };

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
 */
class Signal {
  static id = 0;

  /** @protected @type {T} */ _value;

  /** @type {number} */ id;
  /** @type {number} */ depth;
  /** @type {Scope | undefined} */ scope;

  /** @type {ReactiveNodes} */ dependencies;
  /** @type {ReactiveNodes} */ subscribers;

  /**
   * @param {T} initialValue
   */
  constructor(initialValue) {
    this.id = Signal.id++;
    this.depth = 0;
    this._value = initialValue;
    this.dependencies = new Set();
    this.subscribers = new Set();
    Supervisor.register(this);
  }

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

  peek() {
    return this._value;
  }

  /**
   * @param {(value: T) => void} mutation
   */
  mutate(mutation) {
    mutation(this._value);
    Supervisor.requestUpdate(this);
  }

  /**
   * @param {Signal<any>} subscriber
   */
  subscribe(subscriber) {
    this.subscribers.add(subscriber);
    subscriber.dependencies.add(this);
    subscriber.move(this.depth + 1);
  }

  /**
   * @param {number} depth
   */
  move(depth) {
    if (depth <= this.depth) return;
    this.depth = depth;
    for (const subscriber of this.subscribers) subscriber.move(this.depth + 1);
  }

  dispose() {
    for (const dependency of this.dependencies) dependency.subscribers.delete(this);
    for (const subscriber of this.subscribers) subscriber.dispose();
    this.dependencies.clear();
    this.scope?.members.delete(this);
    this.scope = undefined;
  }
}
