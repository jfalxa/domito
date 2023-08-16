import { connected } from "./lifecycle.js";

export { render };

/**
 * Run the callback to create a DOM element, append it to the root and run lifecycle callbacks.
 *
 * @param {HTMLElement} root
 * @param {() => HTMLElement | DocumentFragment} create
 */
function render(root, create) {
  const element = create();
  root.append(element);
  connected(element);
}
