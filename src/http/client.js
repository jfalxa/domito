/** @typedef {import("./fetch").Fetch} Fetch */
/** @template T @typedef {import("./fetch").FetchOptions<T>} FetchOptions */

import { fetch, FetchResult } from "./fetch";

export { createClient, Client };

/**
 * @param {string | URL} url
 * @param {FetchOptions<any>} [options]
 */
function createClient(url, options) {
  return new Client(url, options);
}

class Client {
  /** @type {URL} */ url;
  /** @readonly @type {FetchOptions<any>} */ options;

  /**
   * @param {number | string | URL} url
   * @param {FetchOptions<any>} [options]
   */
  constructor(url, options) {
    this.options = options ?? {};
    this.url = new URL(String(url));
  }

  /**
   * @param {number | string | URL} url
   * @param {FetchOptions<any>} [options]
   * @returns {Client}
   */
  route(url, options) {
    const routeOptions = { ...this.options, ...options };
    return new Client(new URL(String(url), this.url), routeOptions);
  }

  /** @type {ClientFetch} */
  get(url, options) {
    return this.fetch(url, { ...options, method: "GET" });
  }

  /** @type {ClientFetch} */
  post(url, options) {
    return this.fetch(url, { ...options, method: "POST" });
  }

  /** @type {ClientFetch} */
  put(url, options) {
    return this.fetch(url, { ...options, method: "PUT" });
  }

  /** @type {ClientFetch} */
  patch(url, options) {
    return this.fetch(url, { ...options, method: "PATCH" });
  }

  /** @type {ClientFetch} */
  delete(url, options) {
    return this.fetch(url, { ...options, method: "DELETE" });
  }

  /** @type {ClientFetch} */
  fetch(url, options) {
    let fetchURL, fetchOptions;

    if (typeof url === "number" || typeof url === "string" || url instanceof URL) {
      fetchURL = new URL(String(url), this.url);
      fetchOptions = { ...this.options, ...options };
    } else {
      fetchURL = this.url;
      fetchOptions = { ...this.options, ...url };
    }

    return fetch(fetchURL, fetchOptions);
  }
}

/**
 * @typedef {<T = void>(urlOrOptions?: number | string | URL | FetchOptions<T>, options?: FetchOptions<T>) => Promise<FetchResult<T>>} ClientFetch
 */
