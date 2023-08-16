export { getCookies, setCookie };

/**
 * Parse the list of cookies available and put them inside a Map
 *
 * @returns {Map<string, string>}
 */
function getCookies() {
  const cookies = /** @type {Map<string, string>} */ (new Map());
  const cookieData = document.cookie.split("; ");
  for (const cookie of cookieData) {
    const [name, value] = cookie.split("=");
    cookies.set(name.trim(), value.trim());
  }
  return cookies;
}

/**
 * Create a new cookie or update an existing one.
 *
 * @param {string} name
 * @param {string} value
 * @param {CookieInit} [init]
 */
function setCookie(name, value, init) {
  // Construct the cookie string using the provided data
  let cookie = `${name}=${encodeURIComponent(value)}`;

  if (init?.domain) {
    cookie += `;domain=${init.domain}`;
  }

  if (init?.path) {
    cookie += `;path=${init.path}`;
  }

  if (init?.expires) {
    cookie += `;expires=${init.expires.toUTCString()}`;
  }

  if (init?.maxAge) {
    cookie += `;max-age=${init.maxAge}`;
  }

  if (init?.sameSite) {
    cookie += `;samesite=${init.sameSite}`;
  }

  if (init?.partitioned) {
    cookie += `;partitioned`;
  }

  if (init?.sameSite) {
    cookie += `;samesite`;
  }

  if (init?.secure) {
    cookie += `;secure`;
  }

  document.cookie = cookie;
}

/**
 * @typedef {{
 * domain: string;
 * path: string;
 * expires: Date;
 * maxAge: number;
 * partitioned: boolean;
 * sameSite: "lax" | "strict" | "none";
 * secure: boolean;
 * }} CookieInit
 */
