/** @template T @typedef {import("./reactive").Dynamic<T>} Dynamic */
import { $text } from "./dom";
import { isDynamic } from "./reactive";

export default html;
export { html };

/**
 * @param {TemplateStringsArray} strings
 * @param  {...(string | number | boolean | null | undefined | Node | Dynamic<any>)} interpolated
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
      } else if (isDynamic(interpolatedVal)) {
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
