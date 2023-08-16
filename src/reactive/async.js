/** @template T @typedef {import("./reactive.js").Reactive<T>} Reactive */

import { Effect } from "./effect.js";
import { resolve } from "./reactive.js";
import { Signal } from "./signal.js";
import { Supervisor } from "./supervisor.js";

export { $async, Async };

/**
 * Create an effect that runs an async operation, and track its evolution by updating reactive signals.
 *
 * @template T
 * @template {Tuple} [A=[]]
 * @param {AsyncTask<T, A>} asyncTask
 * @param {AsyncInit<T, A>} [init]
 * @returns {Async<T, A>}
 */
function $async(asyncTask, init) {
  return new Async(asyncTask, init);
}

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @extends {Effect<T | null>}
 */
class Async extends Effect {
  /** @private @type {AsyncTask<T, A>} */ asyncTask;
  /** @private @type {Reactive<A> | undefined} */ arguments;

  /** @private @type {(() => void) | undefined} */ onLoad;
  /** @private @type {((data: T) => void) | undefined} */ onSuccess;
  /** @private @type {((error: Error) => void) | undefined} */ onError;

  /** @private @type {number} */ iteration;

  /** @private @type {Signal<boolean>} */ $loading;
  /** @private @type {Signal<Error | null>} */ $error;

  /**
   * @param  {AsyncTask<T, A>} asyncTask
   * @param {AsyncInit<T, A>} [init]
   */
  constructor(asyncTask, init = {}) {
    super(() => init.initialValue ?? null);

    this.$loading = new Signal("arguments" in init);
    this.$error = new Signal(null);

    // because this effect is async we can't detect $loading usage automatically
    // so we add $loading as a subscriber manually
    this.subscribe(this.$loading);

    this.asyncTask = asyncTask;
    this.arguments = init.arguments;
    this.onLoad = init.onLoad;
    this.onError = init.onError;
    this.onSuccess = init.onSuccess;
    this.iteration = 0;

    // if the arguments option is not provided, prevent the Effect from reacting to changes in its deps
    if (!this.arguments) {
      this.task = undefined;
      return;
    }

    // override the task to make it run the async operation
    this.task = () => {
      // bind the effect to its reactive arguments
      const args = resolve(this.arguments);
      // run the async operation
      if (args) this.run(...args);
      // tag the signal's' subscribers for update
      this.deprecate();
      // keep the current value while the async op is executed
      return this._value;
    };

    this.update();
  }

  /**
   * Indicates wether the async task is in progress
   */
  get loading() {
    return this.$loading.value;
  }

  /**
   * If an error happened during the async task, it will be available here.
   * If there was no error, the value will be null.
   */
  get error() {
    return this.$error.value;
  }

  /**
   * A function that returns the current loading state
   *
   * @returns {boolean}
   */
  isLoading = () => {
    return this.$loading.value;
  };

  /**
   * A function that tells wether the async effect had an error
   *
   * @returns {boolean}
   */
  hasError = () => {
    return this.$error.value !== undefined;
  };

  /**
   * A function that tells wether the async effect has a resolved value
   *
   * @returns {boolean}
   */
  hasValue = () => {
    return this.value !== undefined;
  };

  /**
   * Run the async effect task and track its evolution by updating the appropriate signals.
   *
   * @param {A} args
   * @returns {Promise<T | null>}
   */
  async run(...args) {
    // get the current iteration of the async operation
    // so we can determine priority when there are race conditions
    const iteration = ++this.iteration;

    try {
      if (!this.$loading.peek()) {
        this.$loading.mutate(() => true);
        this.onLoad?.();
      }

      const data = await this.asyncTask?.(...args);

      // prevent updating the value if the async operation is stale
      if (iteration < this.iteration) return this._value;

      this._value = data;
      this.$loading.mutate(() => false);
      this.$error.mutate(() => null);

      this.onSuccess?.(data);
    } catch (error) {
      // prevent updating the error if the async operation is stale
      if (iteration < this.iteration) return this._value;

      this._value = null;
      this.$loading.mutate(() => false);
      this.$error.mutate(() => /** @type {Error} */ (error));

      this.onError?.(/** @type {Error} */ (error));
    }

    // if the async operation completed, request an update
    Supervisor.requestUpdate(this);
    return this._value;
  }
}

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @typedef {{
 *  arguments?: Reactive<A>;
 *  initialValue?: T;
 *  onLoad?: () => void;
 *  onSuccess?: (data: T) => void;
 *  onError?: (error: Error) => void;
 * }} AsyncInit
 */

/**
 * @template T
 * @typedef {{
 *  loading: boolean;
 *  data: T | undefined;
 *  error: Error | undefined;
 * }} AsyncSnapshot
 */

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @typedef {(...args: A) => Promise<T>} AsyncTask */

/**
 * @typedef {[any?, ...any]} Tuple
 */
