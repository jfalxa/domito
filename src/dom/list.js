/** @template T @typedef {import("../reactive/reactive.js").Reactive<T>} Reactive */

import { resolve } from "../reactive/reactive.js";
import { Effect } from "../reactive/effect.js";
import { Scope } from "../reactive/scope.js";
import { Signal } from "../reactive/signal.js";
import { connected, disconnected } from "./lifecycle.js";

export { $list };

/**
 * Takes a reactive list and renders an element for each position in this list.
 * The created DOM elements will be indexed by their corresponding position in the list.
 * As the value at each index can change, the $item parameter of the render function will be a signal.
 *
 * @template T
 * @param {Reactive<T[]>} $items
 * @param {($item: Signal<T>, index: number) => HTMLElement} render
 * @returns {DocumentFragment}
 */
function $list($items, render) {
  /** @type {Scope[]} */ const scopes = [];
  /** @type {HTMLElement[]} */ const children = [];
  /** @type {Signal<T>[]} */ const itemSignals = [];

  const fragment = document.createDocumentFragment();
  const comment = document.createComment("$index");

  fragment.append(comment);

  new Effect(() => {
    const value = resolve($items);

    const oldLength = children.length;
    const newLength = value.length;

    // add the new items that weren't registered yet
    for (let i = oldLength; i < newLength; i++) {
      scopes[i] = new Scope(() => {
        itemSignals[i] = itemSignals[i] ?? new Effect(() => value[i]);
        children[i] = render(itemSignals[i], i);
      });

      comment.before(children[i]);
      connected(children[i]);
    }

    // remove the old items that are not listed anymore
    for (let i = newLength; i < oldLength; i++) {
      scopes[i].dispose();
      itemSignals[i].dispose();
      children[i].remove();
      disconnected(children[i]);
    }

    scopes.length = newLength;
    itemSignals.length = newLength;
    children.length = newLength;
  });

  return fragment;
}
