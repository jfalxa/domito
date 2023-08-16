export { fetch, FetchResult, FetchError };

/**
 * Send a request to the given URL and define its behavior through options
 *
 * @type {Fetch}
 */
async function fetch(url, options) {
  const fetchURL = new URL(String(url));

  if (options?.searchParams) {
    if (options.initSearchParams) {
      fetchURL.search = options.initSearchParams(options.initSearchParams).toString();
    } else {
      fetchURL.search = new URLSearchParams(options.searchParams).toString();
    }
  }

  let body;
  if (options?.body) {
    if (options.initBody) {
      body = options.initBody(options.body);
    } else {
      body = body;
    }
  }

  let request = new Request(fetchURL, { ...options, body });
  if (options?.initRequest) {
    request = options.initRequest(request);
  }

  options?.onLoad?.(request);

  const response = await window.fetch(request);

  let completed;
  if (options?.readResponse) {
    completed = await options.readResponse(response);
  }

  if (!response.ok) {
    const error = new FetchError(completed, request, response);
    options?.onError?.(error);
    throw error;
  }

  let data;
  if (options?.transformData) {
    data = options.transformData(completed);
  } else {
    data = completed;
  }

  options?.onSuccess?.(data);

  return new FetchResult(data, request, response);
}

/**
 * @template T
 */
class FetchResult {
  /** @type {Request} */ request;
  /** @type {Response} */ response;

  /**
   * @param {T} data
   * @param {Request} request
   * @param {Response} response
   */
  constructor(data, request, response) {
    this.data = data;
    this.request = request;
    this.response = response;
  }
}

/**
 * @template T
 */
class FetchError extends Error {
  /** @type {Request} */ request;
  /** @type {Response} */ response;

  /**
   * @param {T} data
   * @param {Request} request
   * @param {Response} response
   */
  constructor(data, request, response) {
    super(response.statusText);
    this.data = data;
    this.request = request;
    this.response = response;
  }
}

/**
 * @template T
 * @typedef Options
 * @property {any} [searchParams] A list of search params to add to the url
 * @property {BodyInit | Array<any> | Record<string, any>} [body] The content of the body of the request
 * @property {(request: Request) => void} [onLoad] A callback executed when the request starts
 * @property {(error: Error) => void} [onError] A callback executed when the request fails
 * @property {(data: T) => void} [onSuccess] A callback executed when the request succeeds
 * @property {(searchParams: any) => URLSearchParams} [initSearchParams] A function to convert the `searchParams` value to a URLSearchParams
 * @property {(body: any) => BodyInit} [initBody] A function to convert the `body` value to a BodyInit that you can send in a request
 * @property {(request: Request) => Request} [initRequest] A function to modify the Request object that will be sent to the server
 * @property {(response: Response) => Promise<any>} [readResponse] A function to tell how to fully download and parse the Response
 * @property {(data: any) => Promise<T>} [transformData] A function to transform the body downloaded from the server
 */

/**
 * @template T
 * @typedef {Omit<RequestInit, "body"> & Options<T>} FetchOptions
 */

/**
 * @typedef {<T = void>(path: number | string | URL, options?: FetchOptions<T>) => Promise<FetchResult<T>>} Fetch
 */
