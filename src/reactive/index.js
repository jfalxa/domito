/** @typedef {import("./async.js").Tuple} Tuple */
/** @template T @typedef {import("./effect.js").Task<T>} Task */
/** @template T @typedef {import("./reactive.js").Reactive<T>} Reactive */
/** @template T @template {Tuple} A @typedef {import("./async.js").AsyncTask<T, A>} AsyncTask */

import { Effect } from "./effect.js";
import { Signal } from "./signal.js";

export { $ };
export { Supervisor } from "./supervisor.js";
export { $signal, Signal } from "./signal.js";
export { $effect, Effect } from "./effect.js";
export { $async, Async } from "./async.js";
export { $scope, Scope } from "./scope.js";
export { isReactive, resolve } from "./reactive.js";

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
 * A shorthand function to quickly create signals and effects.
 * If you pass it a function, it will build a new effect and use this function as effect task.
 * Otherwise, the value will be used to initialize a reactive signal.
 *
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
