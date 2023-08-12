/** @template T @typedef {import("../reactive/reactive.js").Reactive<T>} Reactive */

import { resolve } from "../reactive/reactive.js";
import { Effect } from "../reactive/effect.js";
import { Scope } from "../reactive/scope.js";
import { connected, disconnected } from "./lifecycle.js";

export { $when };

/**
 * @template T
 * @param {Reactive<T>} $condition
 * @param {() => HTMLElement} callback
 * @returns {DocumentFragment}
 */
function $when($condition, callback) {
  /** @type {Scope | undefined} */ let scope;
  /** @type {HTMLElement | undefined} */ let element;

  const fragment = document.createDocumentFragment();
  const comment = document.createComment("$when");

  fragment.append(comment);

  new Effect(() => {
    const value = resolve($condition);

    if (value) {
      if (!scope && !element) {
        scope = Scope.bind(() => {
          element = callback();
          comment.after(element);
          connected(element);
        });
      }
    } else {
      if (scope && element) {
        scope.dispose();
        element.remove();
        disconnected(element);
        scope = undefined;
        element = undefined;
      }
    }
  });

  return fragment;
}
