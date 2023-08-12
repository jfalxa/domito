export { element };

/**
 * @template {keyof HTMLElementTagNameMap} T
 * @overload
 * @param {T} tag
 * @param {ElementInit<HTMLElementTagNameMap[T]>} [init]
 * @returns {HTMLElementTagNameMap[T]}
 */

/**
 * @template {HTMLElement} T
 * @overload
 * @param {T} tag
 * @param {((element: T) => void)} [init]
 * @returns {T}
 */

/**
 * @overload
 * @param {string} tag
 * @param {ElementInit<HTMLElement>} [init]
 * @returns {HTMLElement}
 */

/**
 * @param {string | HTMLElement} tag
 * @param {ElementInit<HTMLElement>} [init]
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
