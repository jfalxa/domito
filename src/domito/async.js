/** @template T @typedef {import("./reactive").Dynamic<T>} Dynamic */
import { Effect, Scheduler } from "./reactive";

export default $async;
export { $async, Async };

/**
 * @template {AsyncTask<any[], any>} T
 * @param {T} task
 * @param {AsyncInit<T>} [init]
 */
function $async(task, init) {
  return new Async(task, init);
}

/**
 * @template {AsyncTask<any[], any>} T
 * @extends {Effect<AsyncSnapshot<AsyncResult<T>>>}
 */
class Async extends Effect {
  /** @type {T} */ asyncTask;
  /** @type {AsyncOptions<T>} */ options;
  /** @type {number} */ iteration;

  /**
   * @param  {T} asyncTask
   * @param {AsyncInit<T>} [init]
   */
  constructor(asyncTask, init) {
    super(() => ({
      loading: init?.auto ?? true,
      error: undefined,
      data: init?.initialData,
    }));

    this.options = {
      auto: init?.auto ?? true,
      initialData: init?.initialData,
      onLoad: init?.onLoad,
      onError: init?.onError,
      onSuccess: init?.onSuccess,
    };

    this.asyncTask = asyncTask;
    this.iteration = 0;

    // if the auto option is disabled, prevent the Effect from reacting to changes in its deps
    if (!this.options.auto) {
      this.task = undefined;
      return;
    }

    this.task = () => {
      const fakeArgs = /** @type {Parameters<T>} */ (/** @type {unknown} */ ([]));
      this.run(...fakeArgs);
      return this._value;
    };

    this.update(this);
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
    return this.loading;
  };

  hasError = () => {
    return this.error !== undefined;
  };

  hasData = () => {
    return this.value.data !== undefined;
  };

  /**
   * @param  {Parameters<T>} args
   * @returns {Promise<AsyncResult<T> | undefined>}
   */
  async run(...args) {
    const iteration = ++this.iteration;

    try {
      if (!this._value.loading) {
        this._value = { ...this._value, loading: true };
        this.options.onLoad?.();
        Scheduler.requestUpdate(this);
      }

      const data = await this.asyncTask?.(...args);

      if (iteration < this.iteration) return this._value.data;

      this._value = { loading: false, error: undefined, data };
      this.options.onSuccess?.(data);
    } catch (error) {
      if (iteration < this.iteration) return this._value.data;

      this._value = { loading: false, error: /** @type {Error} */ (error), data: undefined };
      this.options.onError?.(/** @type {Error} */ (error));
    }

    Scheduler.requestUpdate(this);
    return this._value.data;
  }
}

/**
 * @template {AsyncTask<any[], any>} T
 * @typedef {Partial<AsyncOptions<T>>} AsyncInit
 */

/**
 * @template {AsyncTask<any[], any>} T
 * @typedef {ReturnType<T> extends Promise<infer U> ? U : never} AsyncResult
 */

/**
 * @template {any[]} A
 * @template T
 * @typedef {(...args: A) => Promise<T>} AsyncTask */

/**
 * @template T
 * @typedef {{
 *  loading: boolean;
 *  data: T | undefined;
 *  error: Error | undefined
 * }} AsyncSnapshot
 */

/**
 * @template {AsyncTask<any[], any>} T
 * @typedef {{
 *  auto: boolean
 *  initialData: AsyncResult<T> | undefined;
 *  onLoad?: () => void
 *  onSuccess?: (data: AsyncResult<T>) => void
 *  onError?: (error: Error) => void
 * }} AsyncOptions
 */
