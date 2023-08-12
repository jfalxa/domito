import { element } from "./element.js";

export { connected, disconnected };
export { onConnected, onDisconnected };

/**
 * @param {() => void} callback
 */
function onConnected(callback) {
  element.context?.addEventListener("connected", callback, { once: true });
}
/**
 * @param {() => void} callback
 */
function onDisconnected(callback) {
  element.context?.addEventListener("disconnected", callback, { once: true });
}
/**
 * @param {Node} node
 */
function connected(node) {
  for (const child of node.childNodes) connected(child);
  node.dispatchEvent(new Event("connected"));
}
/**
 * @param {ChildNode} node
 */
function disconnected(node) {
  for (const child of node.childNodes) disconnected(child);
  node.dispatchEvent(new Event("disconnected"));
}
