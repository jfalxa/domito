/** @template T @typedef {import("./reactive.js").Reactive<T>} Reactive */

import { Effect } from "./effect.js";
import { resolve } from "./reactive.js";
import { Signal } from "./signal.js";
import { Supervisor } from "./supervisor.js";

export { $async, Async, invalidate };

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @param {AsyncTask<T, A>} task
 * @param {AsyncInit<T, A>} [init]
 * @returns {Async<T, A>}
 */
function $async(task, init) {
  return new Async(task, init);
}

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @extends {Effect<T | null>}
 */
class Async extends Effect {
  /** @private @type {AsyncTask<T, A>} */ asyncTask;
  /** @private @type {Reactive<A> | undefined} */ arguments;

  /** @private @type {string[]} */ tags;
  /** @private @type {string[]} */ invalidates;

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
    super(() => init.initialData ?? null);

    this.$loading = new Signal("arguments" in init);
    this.$error = new Signal(null);

    // because this effect is async we can't detect $loading usage automatically
    // so we add $loading as a subscriber manually
    this.subscribe(this.$loading);

    this.asyncTask = asyncTask;
    this.arguments = init.arguments;
    this.tags = init.tags ?? [];
    this.invalidates = init.invalidates ?? [];
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
      // keep the current value while the async op is executed
      return this._value;
    };

    // bind update to this so we can use it as an event listener
    this.update = this.update.bind(this);

    // setup invalidation listeners
    for (const key of this.tags) {
      window.addEventListener(`invalidate:${key}`, this.update);
    }

    this.update();
  }

  get loading() {
    return this.$loading.value;
  }

  get error() {
    return this.$error.value;
  }

  isLoading = () => {
    return this.$loading.value;
  };

  hasError = () => {
    return this.$error.value !== undefined;
  };

  hasValue = () => {
    return this.value !== undefined;
  };

  /**
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

      invalidate(...this.invalidates);

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

  dispose() {
    super.dispose();

    for (const key of this.tags) {
      window.removeEventListener(`invalidate:${key}`, this.update);
    }
  }
}

/**
 * @param  {string[]} keys
 */
function invalidate(...keys) {
  for (const key of keys) {
    window.dispatchEvent(new Event(`invalidate:${key}`));
  }
}

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @typedef {{
 *  arguments?: Reactive<A>;
 *  initialData?: T;
 *  tags?: string[];
 *  invalidates?: string[];
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
