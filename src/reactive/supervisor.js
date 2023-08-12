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
    if (Supervisor.context && dependency !== Supervisor.context) {
      dependency.subscribe(Supervisor.context);
    }
  }

  /**
   * @param {Signal<any>} subscriber
   */
  static registerSubscriber(subscriber) {
    if (Supervisor.context && subscriber !== Supervisor.context) {
      Supervisor.context.subscribe(subscriber);
    }
  }
}
