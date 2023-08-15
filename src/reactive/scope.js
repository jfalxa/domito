/** @typedef {import("./reactive.js").ReactiveNodes} ReactiveNodes */

import { Supervisor } from "./supervisor.js";

export { $scope, Scope };

/**
 * @param {() => void} task
 * @returns {Scope}
 */
function $scope(task) {
  return new Scope(task);
}

class Scope {
  static id = 0;

  /** @type {number} */ id;
  /** @type {number} */ depth;

  /** @type {Scope | undefined} */ outerScope;
  /** @type {Set<Scope>} */ innerScopes;
  /** @type {ReactiveNodes} */ members;

  /**
   * @param {() => any} [initialTask]
   */
  constructor(initialTask) {
    this.id = Scope.id++;
    this.outerScope = Supervisor.scope;
    this.outerScope?.innerScopes.add(this);
    this.innerScopes = new Set();
    this.members = new Set();
    this.depth = this.outerScope ? this.outerScope.depth + 1 : 0;
    if (initialTask) this.run(initialTask);
  }

  /**
   * @template T
   * @param {() => T} task
   * @returns {T}
   */
  run(task) {
    Supervisor.scope = this;
    const result = task();
    Supervisor.scope = this.outerScope;
    return result;
  }

  dispose() {
    for (const scope of this.innerScopes) scope.dispose();
    for (const member of this.members) member.dispose();
    this.outerScope?.innerScopes.delete(this);
    this.outerScope = undefined;
  }
}
