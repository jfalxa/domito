/** @typedef {import("./reactive.js").ReactiveNodes} ReactiveNodes */

import { Effect } from "./effect.js";
import { Scope } from "./scope.js";
import { Signal } from "./signal.js";

export { Supervisor };

class Supervisor {
  /** @type {Effect<any> | undefined} */ static context; // tracks currently active Effect
  /** @type {Scope | undefined} */ static scope; // tracks currently active Scope

  /** @type {boolean} */ static updating = false;
  /** @type {ReactiveNodes} */ static queue = new Set();

  /**
   * @param {Signal<any>} signal
   */
  static requestUpdate(signal) {
    Supervisor.queue.add(signal);

    // if an update was already requested in the current main task, stop here
    if (Supervisor.updating) return;

    // run the effects after the current main task is finished
    // so we can queue all the signals that were changed together
    Supervisor.updating = true;
    queueMicrotask(Supervisor.update);
  }

  static update() {
    const subscribers = /** @type {ReactiveNodes} */ (new Set());

    for (const signal of Supervisor.queue) {
      for (const subscriber of signal.subscribers) {
        Supervisor.queue.add(subscriber);
        subscribers.add(subscriber);
      }
    }

    // sort subscribers by depth so they only get their depdendencies' latest values for this update cycle
    const orderedSubscribers = Array.from(subscribers) //
      .sort((a, b) => a.depth - b.depth);

    for (const subscriber of orderedSubscribers) {
      if (subscriber instanceof Effect && subscriber.dependencies.size > 0) {
        subscriber.update();
      }
    }

    Supervisor.queue.clear();
    Supervisor.updating = false;
  }

  /**
   * @param {Signal<any>} signal
   */
  static register(signal) {
    if (!Supervisor.scope) return;

    signal.scope = Supervisor.scope;
    Supervisor.scope.members.add(signal);
  }

  /**
   * @param {Signal<any>} dependency
   */
  static registerDependency(dependency) {
    if (!Supervisor.context) return;
    if (dependency === Supervisor.context) return;

    dependency.subscribe(Supervisor.context);
    Supervisor.detectCycle();
  }

  /**
   * @param {Signal<any>} subscriber
   */
  static registerSubscriber(subscriber) {
    if (!Supervisor.context) return;
    if (subscriber === Supervisor.context) return;
    if (Supervisor.context.dependencies.has(subscriber)) return;

    Supervisor.context.subscribe(subscriber);
    Supervisor.detectCycle();
  }

  static detectCycle() {
    if (Supervisor.context && hasCycle(Supervisor.context)) {
      throw new Error("Cycle detected");
    }
  }
}

/**
 * @param {Signal<any>} signal
 * @param {ReactiveNodes} [visited]
 * @param {ReactiveNodes} [visiting]
 * @returns {boolean}
 */
function hasCycle(signal, visited = new Set(), visiting = new Set()) {
  if (!signal) return false;
  if (visiting.has(signal)) return true;
  if (visited.has(signal)) return false;

  visiting.add(signal);

  for (const subscriber of signal.subscribers) {
    if (hasCycle(subscriber, visited, visiting)) {
      return true;
    }
  }

  visiting.delete(signal);
  visited.add(signal);

  return false;
}
