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

    // run the effects right after the current main task is finished
    // so we can queue all the signals that were changed together
    Supervisor.updating = true;
    queueMicrotask(Supervisor.update);
  }

  static update() {
    const subscribers = /** @type {ReactiveNodes} */ (new Set());

    // deprecate the queued signals to prepare their subscribers for update
    for (const signal of Supervisor.queue) {
      signal.deprecate();
    }

    // queue all the signals and effects connected to the initial ones
    for (const signal of Supervisor.queue) {
      for (const subscriber of signal.subscribers) {
        Supervisor.queue.add(subscriber);
        subscribers.add(subscriber);
      }
    }

    // sort nodes by depth so they only get their depdendencies' latest values for this update cycle
    const orderedSubscribers = Array.from(Supervisor.queue).sort((a, b) => a.depth - b.depth);

    // run the update for all the related nodes
    for (const subscriber of orderedSubscribers) {
      // skip subscribers that do not need to update
      if (!subscriber.willUpdate) continue;

      // run an effect's update or directly deprecate a signal
      if (subscriber instanceof Effect) {
        subscriber.update();
      } else if (subscriber instanceof Signal) {
        subscriber.deprecate();
      }

      // tag the subscriber as updated
      subscriber.willUpdate = false;
    }

    // clear the queue and mark the update as done
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

  /**
   * @param {Effect<any>} context
   * @param {() => void} task
   */
  static run(context, task) {
    let error;

    const outerContext = Supervisor.context;
    const outerScope = Supervisor.scope;

    Supervisor.context = context;
    Supervisor.scope = context.scope;

    try {
      task();
    } catch (taskError) {
      error = taskError;
    }

    Supervisor.context = outerContext;
    Supervisor.scope = outerScope;

    if (error) throw error;
  }
}
