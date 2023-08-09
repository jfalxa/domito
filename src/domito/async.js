/** @template T @typedef {import("./reactive").Dynamic<T>} Dynamic */
import { Effect, queueUpdate } from "./reactive";

export default $async;
export { $async, Async };

/**
 * @template T
 * @typedef {{
 *  loading: boolean;
 *  data: T | undefined;
 *  error: Error | undefined
 * }} AsyncSnapshot
 */

/**
 * @template T
 * @template {any[]} A
 * @typedef {{
 *  auto: boolean
 *  initialData: T | undefined;
 *  onLoad?: () => void
 *  onSuccess?: (data: T) => void
 *  onError?: (error: Error) => void
 * }} AsyncOptions
 */

/** @template T @template {any[]} A @typedef {(...args: A) => Promise<T>} AsyncTask */
/** @template T @template {any[]} A @typedef {Partial<AsyncOptions<T, A>>} AsyncInit */

/**
 * @template T
 * @template {any[]} A
 * @param {AsyncTask<T, A>} task
 * @param {AsyncInit<T, A>} [init]
 */
function $async(task, init) {
  return new Async(task, init);
}

/**
 * @template T
 * @template {any[]} A
 * @extends {Effect<AsyncSnapshot<T>>}
 */
class Async extends Effect {
  /** @type {AsyncTask<T, A>} */ task;
  /** @type {AsyncOptions<T, A>} */ options;
  /** @type {number} */ iteration;

  /**
   * @param  {AsyncTask<T, A>} task
   * @param {AsyncInit<T, A>} [init]
   */
  constructor(task, init) {
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

    this.task = task;
    this.iteration = 0;

    if (!this.options.auto) {
      this.compute = undefined;
      return;
    }

    this.compute = () => {
      const fakeArgs = /** @type {A} */ (/** @type {unknown} */ ([]));
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
   * @param  {A} args
   */
  async run(...args) {
    const iteration = ++this.iteration;

    try {
      if (!this._value.loading) {
        this._value = { ...this._value, loading: true };
        this.options.onLoad?.();
        queueUpdate(this);
      }

      const data = await this.task?.(...args);

      if (iteration < this.iteration) return this._value;

      this._value = { loading: false, error: undefined, data };
      this.options.onSuccess?.(data);
    } catch (error) {
      if (iteration < this.iteration) return this._value;

      this._value = { loading: false, error: /** @type {Error} */ (error), data: undefined };
      this.options.onError?.(/** @type {Error} */ (error));
    }

    queueUpdate(this);
    return this._value;
  }
}
