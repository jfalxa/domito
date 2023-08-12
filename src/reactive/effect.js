import { Signal } from "./signal.js";
import { Supervisor } from "./supervisor.js";

export { $effect, Effect };

/**
 * @template T
 * @param {() => T} compute
 * @returns {Effect<T>}
 */
function $effect(compute) {
  return new Effect(compute);
}

/**
 * @template T
 * @extends {Signal<T>}
 */
class Effect extends Signal {
  /** @type {Task<T> | undefined} */ task;

  /**
   * @param {Task<T>} task
   */
  constructor(task) {
    super(/** @type {T} */ (undefined));
    this.task = task;
    this.update(this);
  }

  get value() {
    return super.value;
  }

  set value(_) {
    throw new Error("Effect values are read-only");
  }

  /**
   * @param {this | undefined} context
   * @returns {void}
   */
  update(context = undefined) {
    if (!this.task) return;

    const outerContext = Supervisor.context;
    const outerScope = Supervisor.scope;

    Supervisor.context = context;
    Supervisor.scope = this.scope;

    const result = this.task?.(this._value);
    if (result !== undefined) this._value = result;

    Supervisor.context = context ? outerContext : undefined;
    Supervisor.scope = outerScope;
  }
}

/**
 * @template T
 * @typedef {(value: T | undefined) => T | undefined} Task
 */
