/** @template T @typedef {import("../reactive/reactive.js").Reactive<T>} Reactive */

import { resolve } from "../reactive/reactive.js";
import { Effect } from "../reactive/effect.js";

export { $text };

/**
 * Create a Text node and bind its textContent to a reactive value.
 *
 * @param {Reactive<any>} content
 * @returns {Text}
 */
function $text(content) {
  const text = new Text();

  new Effect(() => {
    const value = resolve(content);

    if (value === null || value === undefined) {
      text.textContent = "";
    } else {
      text.textContent = String(value);
    }
  });

  return text;
}
