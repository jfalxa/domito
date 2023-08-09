/** @template T @typedef {import("./reactive").Dynamic<T>} Dynamic */
import $, { $scope, Scope, Signal, resolve } from "./reactive";

export { render, element };
export { $text, $when, $index, $map };
export { onConnected, onDisconnected, connected, disconnected };

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
  const outerElement = element.context;

  element.context = context;
  if (typeof init === "function") init(context);
  if (typeof init === "string") context.append(init);
  element.context = outerElement;

  return context;
}

/** @type {HTMLElement | undefined} */
element.context = undefined; // tracks the currently created element

/**
 * @param {HTMLElement} root
 * @param {() => HTMLElement | DocumentFragment} create
 */
function render(root, create) {
  const element = create();
  root.append(element);
  connected(element);
}

/**
 * @param {Dynamic<any>} content
 * @returns {Text}
 */
function $text(content) {
  const text = new Text();
  $(() => (text.textContent = String(resolve(content))));
  return text;
}

/**
 * @template T
 * @param {Signal<T> | (() => T)} $condition
 * @param {() => HTMLElement} callback
 * @returns {DocumentFragment}
 */
function $when($condition, callback) {
  /** @type {Scope | undefined} */ let scope;
  /** @type {HTMLElement | undefined} */ let element;

  const fragment = document.createDocumentFragment();
  const comment = document.createComment("$when");

  fragment.append(comment);

  $(() => {
    const value = resolve($condition);

    if (value) {
      if (!element) {
        scope = $scope(() => {
          element = callback();
          comment.after(element);
          connected(element);
        });
      }
    } else {
      if (element) {
        disconnected(element);
        element.remove();
        element = undefined;
      }

      if (scope) {
        scope.dispose();
        scope = undefined;
      }
    }
  });

  return fragment;
}

/**
 * @template T
 * @param {Dynamic<T[]>} $items
 * @param {($item: Signal<T>, index: number) => HTMLElement} callback
 * @returns {DocumentFragment}
 */
function $index($items, callback) {
  /** @type {Signal<T>[]} */ const signals = [];
  /** @type {HTMLElement[]} */ const children = [];
  /** @type {Scope[]} */ const scopes = [];

  const fragment = document.createDocumentFragment();
  const comment = document.createComment("$index");

  fragment.append(comment);

  $(() => {
    const value = resolve($items);

    const oldLength = children.length;
    const newLength = value.length;

    // add the new items that weren't registered yet
    for (let i = oldLength; i < newLength; i++) {
      scopes[i] = $scope(() => {
        signals[i] = signals[i] ?? $(() => value[i]);
        children[i] = callback(signals[i], i);
      });

      comment.before(children[i]);
      connected(children[i]);
    }

    // remove the old items that are not listed anymore
    for (let i = newLength; i < oldLength; i++) {
      scopes[i].dispose();
      signals[i].dispose();
      children[i].remove();
      disconnected(children[i]);
    }

    scopes.length = newLength;
    signals.length = newLength;
    children.length = newLength;
  });

  return fragment;
}

/**
 * @template T
 * @param {Dynamic<T[]>} $items
 * @param {(item: T, $index: Signal<number>) => HTMLElement} callback
 * @returns {DocumentFragment}
 */
function $map($items, callback) {
  /** @type {Map<T, Scope>} */ const scopes = new Map();
  /** @type {Map<T, Signal<number>>} */ const signals = new Map();
  /** @type {Map<T, HTMLElement>} */ const children = new Map();

  const fragment = document.createDocumentFragment();
  const comment = document.createComment("$map");

  fragment.append(comment);

  $(() => {
    const value = resolve($items);

    const oldItems = scopes.keys();
    const newItems = new Set(value);

    // remove the old items that are not listed anymore
    for (const item of oldItems) {
      if (!newItems.has(item)) {
        signals.get(item)?.dispose();
        signals.delete(item);

        scopes.get(item)?.dispose();
        scopes.delete(item);

        const child = /** @type {HTMLElement} */ (children.get(item));
        child.remove();
        children.delete(item);
        disconnected(child);
      }
    }

    /** @type {ChildNode} */ let previousSibling = comment;

    // add the new items that weren't registered yet
    // and update the index of the already known ones
    for (let i = 0; i < value.length; i++) {
      const item = value[i];

      let scope = scopes.get(item);
      let child = children.get(item);
      let $index = signals.get(item);

      const isNew = scope === undefined;

      if ($index === undefined) {
        $index = $(i);
        signals.set(item, $index);
      } else {
        $index.value = i;
      }

      if (scope === undefined) {
        scope = $scope(() => {
          child = callback(item, /** @type {Signal<number>} */ ($index));
          children.set(item, child);
        });

        scopes.set(item, scope);
      }

      child = /** @type {HTMLElement} */ (child);

      // only move the element if it's not at the right position
      if (child.previousSibling !== previousSibling) {
        previousSibling.after(child);
        if (isNew) connected(child);
      }

      previousSibling = child;
    }
  });

  return fragment;
}

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

/**
 * @template {HTMLElement} E
 * @typedef {string | ((element: E) => void)} ElementInit
 */
