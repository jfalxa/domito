import { connected } from "./lifecycle.js";

export { render };

/**
 * @param {HTMLElement} root
 * @param {() => HTMLElement | DocumentFragment} create
 */
function render(root, create) {
  const element = create();
  root.append(element);
  connected(element);
}
