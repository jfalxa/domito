import { Signal } from "./signal.js";
import { Supervisor } from "./supervisor.js";

export { $effect, Effect };

/**
 * Create an effect that will rerun its task every time the reactive values used inside change.
 * If the task returns a value different than undefined, it also becomes a reactive signal.
 *
 * @template T
 * @param {() => T} task
 * @returns {Effect<T>}
 */
function $effect(task) {
  return new Effect(task);
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

    this.update();

    // clean up any update requests added by the effect
    // as we don't want reactivity during the constructor phase
    Supervisor.queue.clear();
  }

  get value() {
    return super.value;
  }

  set value(_) {
    throw new Error("Effect values are read-only");
  }

  /**
   * Run the effect task in the appropriate context
   */
  update() {
    if (!this.task) return;
    if (this.disposed) return;

    Supervisor.run(this, () => {
      const result = this.task?.(this._value);

      const isVoid = result === undefined;
      const hasChange = result !== this._value;

      if (!isVoid && hasChange) this._value = result;
      if (isVoid || hasChange) this.deprecate();
    });
  }
}

/**
 * @template T
 * @typedef {(value: T | undefined) => T | undefined} Task
 */
