/** @template T @typedef {import("../reactive/reactive.js").Reactive<T>} Reactive */

import { resolve } from "../reactive/reactive.js";
import { Effect } from "../reactive/effect.js";
import { Scope } from "../reactive/scope.js";
import { Signal } from "../reactive/signal.js";
import { connected, disconnected } from "./lifecycle.js";

export { $map };

/**
 * @template T
 * @param {T[] | Reactive<T[]>} $items
 * @param {(item: T, $index: Signal<number>) => HTMLElement} callback
 * @returns {DocumentFragment}
 */
function $map($items, callback) {
  /** @type {Map<T, Scope>} */ const scopes = new Map();
  /** @type {Map<T, HTMLElement>} */ const children = new Map();
  /** @type {Map<T, Signal<number>>} */ const indexSignals = new Map();

  const fragment = document.createDocumentFragment();
  const comment = document.createComment("$map");

  fragment.append(comment);

  new Effect(() => {
    const value = resolve($items);

    const oldItems = scopes.keys();
    const newItems = new Set(value);

    // remove the old items that are not listed anymore
    for (const item of oldItems) {
      if (!newItems.has(item)) {
        indexSignals.get(item)?.dispose();
        indexSignals.delete(item);

        scopes.get(item)?.dispose();
        scopes.delete(item);

        const child = /** @type {HTMLElement} */ (children.get(item));
        child.remove();
        children.delete(item);
        disconnected(child);
      }
    }

    /** @type {ChildNode} */ let previousSibling = comment;

    // add the new items that weren't registered yet
    // and update the index of the already known ones
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const isNew = !scopes.has(item);

      let scope = scopes.get(item);
      let child = children.get(item);
      let $index = indexSignals.get(item);

      if ($index === undefined) {
        $index = new Signal(i);
        indexSignals.set(item, $index);
      } else {
        $index.value = i;
      }

      if (scope === undefined) {
        scope = Scope.bind(() => {
          child = callback(item, /** @type {Signal<number>} */ ($index));
          children.set(item, child);
        });

        scopes.set(item, scope);
      }

      child = /** @type {HTMLElement} */ (child);

      // only move the element if it's not at the right position
      if (child.previousSibling !== previousSibling) {
        previousSibling.after(child);
        if (isNew) connected(child);
      }

      previousSibling = child;
    }
  });

  return fragment;
}
