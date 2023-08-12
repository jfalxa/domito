/** @template T @typedef {import("./reactive.js").Reactive<T>} Reactive */

import { Effect } from "./effect.js";
import { resolve } from "./reactive.js";
import { Supervisor } from "./supervisor.js";

export { $async, Async };

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @param {AsyncTask<T, A>} task
 * @param {{ arguments?: Reactive<A>, initialData?: T }} [init]
 * @returns {Async<T, A>}
 */
function $async(task, init) {
  return new Async(task, init);
}

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @extends {Effect<AsyncSnapshot<T>>}
 */
class Async extends Effect {
  /** @private @type {AsyncTask<T, A>} */ asyncTask;
  /** @private @type {Reactive<A> | undefined} */ arguments;

  /** @private @type {(() => void) | undefined} */ onLoad;
  /** @private @type {((data: T) => void) | undefined} */ onSuccess;
  /** @private @type {((error: Error) => void) | undefined} */ onError;

  /** @private @type {number} */ iteration;

  /**
   * @param  {AsyncTask<T, A>} asyncTask
   * @param {AsyncInit<T, A>} [init]
   */
  constructor(asyncTask, init = {}) {
    super(() => ({
      loading: "arguments" in init ?? true,
      error: undefined,
      data: init.initialData,
    }));

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
      // keep the current value while the async op is executed
      return this._value;
    };

    this.update();
  }

  get loading() {
    return this.value.loading;
  }

  get error() {
    return this.value.error;
  }

  get data() {
    return this.value.data;
  }

  isLoading = () => {
    return this.value.loading;
  };

  hasError = () => {
    return this.value.error !== undefined;
  };

  hasData = () => {
    return this.value.data !== undefined;
  };

  /**
   * @param {A} args
   * @returns {Promise<T | undefined>}
   */
  async run(...args) {
    const iteration = ++this.iteration;

    try {
      if (!this._value.loading) {
        this._value = { ...this._value, loading: true };
        this.onLoad?.();
        Supervisor.requestUpdate(this);
      }

      const data = await this.asyncTask?.(...args);

      if (iteration < this.iteration) return this._value.data;

      this._value = { loading: false, error: undefined, data };
      this.onSuccess?.(data);
    } catch (error) {
      if (iteration < this.iteration) return this._value.data;

      this._value = { loading: false, error: /** @type {Error} */ (error), data: undefined };
      this.onError?.(/** @type {Error} */ (error));
    }

    Supervisor.requestUpdate(this);
    return this._value.data;
  }
}

/**
 * @template T
 * @template {Tuple} [A=[]]
 * @typedef {{
 *  arguments?: Reactive<A>;
 *  initialData?: T;
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
