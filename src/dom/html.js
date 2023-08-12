/** @template T @typedef {import("../reactive/reactive.js").Reactive<T>} Reactive */

import { $text } from "./text.js";
import { isReactive } from "../reactive/reactive.js";

export { html };

/**
 * @param {TemplateStringsArray} strings
 * @param  {...(string | number | boolean | null | undefined | Node | Reactive<any>)} interpolated
 * @returns {DocumentFragment}
 */
function html(strings, ...interpolated) {
  const template = document.createElement("template");

  template.innerHTML = strings.reduce((html, part, i) => {
    /** @type {string} */ let interpolatedPart = "";

    const interpolatedVal = interpolated[i];

    if (interpolatedVal !== undefined && interpolatedVal !== null) {
      if (interpolatedVal instanceof Node) {
        interpolatedPart = `<div data-temporary-placeholder-for="${i}"></div>`;
      } else if (isReactive(interpolatedVal)) {
        interpolated[i] = $text(interpolatedVal);
        interpolatedPart = `<div data-temporary-placeholder-for="${i}"></div>`;
      } else {
        interpolatedPart = String(interpolatedVal);
      }
    }

    return html + part + interpolatedPart;
  }, "");

  /** @type {NodeListOf<HTMLDivElement>} */
  const placeholders = template.content.querySelectorAll("[data-temporary-placeholder-for]");

  for (const placeholder of placeholders) {
    const attribute = /** @type {string} */ (placeholder.dataset.temporaryPlaceholderFor);
    const index = parseInt(attribute, 10);
    const element = /** @type {Node} */ (interpolated[index]);
    placeholder.replaceWith(element);
  }

  return template.content;
}
