export { element };

/**
 * @template {HTMLElement} E
 * @overload
 * @param {E} tag
 * @param {((element: E) => void)} [init]
 * @returns {T}
 */

/**
 * @template {keyof HTMLElementTagNameMap} T
 * @overload
 * @param {T} tag
 * @param {ElementInit<HTMLElementTagNameMap[T]>} [init]
 * @returns {HTMLElementTagNameMap[T]}
 */

/**
 * @overload
 * @param {string} tag
 * @param {ElementInit<HTMLElement>} [init]
 * @returns {HTMLElement}
 */

/**
 * Create a DOM element or grab an existing one and apply some changes to it.
 *
 * @param {string | HTMLElement} tag The element's tag, or an exisiting element
 * @param {ElementInit<HTMLElement>} [init] A string for text content, or a function to update the created DOM element
 * @returns {HTMLElement}
 */
function element(tag, init) {
  const context = tag instanceof HTMLElement ? tag : document.createElement(tag);
  const outerContext = element.context;

  element.context = context;
  if (typeof init === "function") init(context);
  if (typeof init === "string") context.append(init);
  element.context = outerContext;

  return context;
}

/** @type {HTMLElement | undefined} */
element.context = undefined; // tracks the currently created element

/**
 * @template {HTMLElement} [E=HTMLElement]
 * @typedef {string | ((element: E) => void)} ElementInit
 */
