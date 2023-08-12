/** @template T @typedef {import("../reactive/reactive.js").Reactive<T>} Reactive */

import { resolve } from "../reactive/reactive.js";
import { Effect } from "../reactive/effect.js";

export { $text };

/**
 * @param {Reactive<any>} content
 * @returns {Text}
 */
function $text(content) {
  const text = new Text();

  new Effect(() => {
    const resolved = resolve(content);

    if (resolved === null || resolved === undefined) {
      text.textContent = "";
    } else {
      text.textContent = String(resolved);
    }
  });

  return text;
}
