export { fetch, FetchResult, FetchError };

/** @type {Fetch} */
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
 * @typedef {Omit<RequestInit, "body"> & {
 *  searchParams?: any;
 *  body?: BodyInit | Array<any> | Record<string, any>;
 *  duplex?: "full" | "half";
 *  onLoad?: (request: Request) => void;
 *  onError?: (error: Error) => void;
 *  onSuccess?: (data: T) => void;
 *  initSearchParams?: (searchParams: any) => URLSearchParams
 *  initBody?: (body: any) => BodyInit
 *  initRequest?: (request: Request) => Request;
 *  readResponse?: (response: Response) => Promise<any>;
 *  transformData?: (data: any) => Promise<T>
 * }} FetchOptions
 */

/**
 * @typedef {<T = void>(path: number | string | URL, options?: FetchOptions<T>) => Promise<FetchResult<T>>} Fetch
 */
