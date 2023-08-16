import { Signal } from "./signal.js";

/**
 * Check if a value is a reactive statement
 *
 * @param {any} value
 * @returns {value is Reactive<any>}
 */
export function isReactive(value) {
  return typeof value === "function" || value instanceof Signal;
}

/**
 * Extract the value from a potentially reactive statement
 *
 * @template T
 * @param {T | Reactive<T>} $reactive
 * @returns {T}
 */
export function resolve($reactive) {
  if (!isReactive($reactive)) return $reactive;
  else if (typeof $reactive === "function") return $reactive();
  else return $reactive.value;
}

/**
 * @template T
 * @typedef {Signal<T> | (() => T)} Reactive
 */

/**
 * @typedef {Set<Signal<any>>} ReactiveNodes
 */
