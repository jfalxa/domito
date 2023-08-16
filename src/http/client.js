/** @typedef {import("./fetch").Fetch} Fetch */
/** @template T @typedef {import("./fetch").FetchOptions<T>} FetchOptions */

import { fetch, FetchResult } from "./fetch";

export { createClient, Client };

/**
 * Create a client to communicate with a server at the given URL.
 * Specifying options will create shared behaviors for all the requests made with this client.
 *
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
   * Create a new client for a specific path inside the current client.
   * Reuse the current client's options as defaults and optionnaly provide new ones.
   * Newly provided options will overwrite base options.
   *
   * @param {number | string | URL} url
   * @param {FetchOptions<any>} [options]
   * @returns {Client}
   */
  route(url, options) {
    const routeOptions = { ...this.options, ...options };
    return new Client(new URL(String(url), this.url), routeOptions);
  }

  /**
   * Send a GET request to the server, using the client base configuration and locally specified options.
   * If you do not provide an url, the client's base url will be used.
   *
   * @type {ClientFetch}
   */
  get(url, options) {
    return this.fetch(url, { ...options, method: "GET" });
  }

  /**
   * Send a POST request to the server, using the client base configuration and locally specified options.
   * If you do not provide an url, the client's base url will be used.
   *
   * @type {ClientFetch}
   */
  post(url, options) {
    return this.fetch(url, { ...options, method: "POST" });
  }

  /**
   * Send a PUT request to the server, using the client base configuration and locally specified options.
   * If you do not provide an url, the client's base url will be used.
   *
   * @type {ClientFetch}
   */
  put(url, options) {
    return this.fetch(url, { ...options, method: "PUT" });
  }

  /**
   * Send a PATCH request to the server, using the client base configuration and locally specified options.
   * If you do not provide an url, the client's base url will be used.
   *
   * @type {ClientFetch}
   */
  patch(url, options) {
    return this.fetch(url, { ...options, method: "PATCH" });
  }

  /**
   * Send a DELETE request to the server, using the client base configuration and locally specified options.
   * If you do not provide an url, the client's base url will be used.
   *
   * @type {ClientFetch}
   */
  delete(url, options) {
    return this.fetch(url, { ...options, method: "DELETE" });
  }

  /**
   * Send a request to the server, using the client base configuration and locally specified options.
   * If you do not provide an url, the client's base url will be used.
   *
   * @type {ClientFetch}
   */
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
 * Send a request to the server, using the client base configuration and locally specified options.
 * @typedef {<T = void>(urlOrOptions?: number | string | URL | FetchOptions<T>, options?: FetchOptions<T>) => Promise<FetchResult<T>>} ClientFetch
 */
