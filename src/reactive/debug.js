import { Async } from "./async.js";
import { Effect } from "./effect.js";
import { Scope } from "./scope.js";
import { Signal } from "./signal.js";

export { debug, scopeToString, signalToString };

/**
 * @param {Signal<any> | Scope} source
 * @returns {void}
 */
function debug(source) {
  let str = "";

  if (source instanceof Scope) {
    str = scopeToString(source);
  } else if (source instanceof Signal) {
    str = signalToString(source);
  }

  const styledCount = Math.max(0, str.split("%c").length - 1);
  const styles = Array(styledCount)
    .fill("")
    .map((_, i) => (i % 2 === 0 ? "font-weight: bold;" : ""));

  console.log(str, ...styles);
}

/**
 * @param {Signal<any>} signal
 * @returns {string}
 */
function signalToString(signal) {
  const value = JSON.stringify(signal.peek());
  const type = signal instanceof Async ? "Async" : signal instanceof Effect ? "Effect" : "Signal";

  let str = `- %c${type} #${signal.id}%c (${signal.depth}) = ${value}\n`;

  if (signal.dependencies.size > 0) {
    str += `  * Dependencies: `;
    str += compactSignals(signal.dependencies);
    str += "\n";
  }

  if (signal.subscribers.size > 0) {
    str += `  * Subscribers: `;
    str += compactSignals(signal.subscribers);
  }

  return str;
}

/**
 * @param {Scope} scope
 * @returns {string}
 */
function scopeToString(scope) {
  let str = `- %cScope #${scope.id}%c (${scope.depth})\n`;

  for (const member of scope.members) {
    str += indent(signalToString(member));
  }

  for (const innerScope of scope.innerScopes) {
    const substr = scopeToString(innerScope).trim();
    str += indent(substr);
  }

  return str;
}

/**
 * @param {Set<Signal<any>>} signals
 * @returns {string}
 */
function compactSignals(signals) {
  return Array.from(signals)
    .map((s) => `${s instanceof Async ? "A" : s instanceof Effect ? "E" : "S"}${s.id}`)
    .join(", ");
}

/**
 * @param {string} multiline
 */
function indent(multiline) {
  return "  " + multiline.trim().split("\n").join("\n  ") + "\n";
}
