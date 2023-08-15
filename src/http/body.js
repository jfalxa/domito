export { toFormData, toSearchParams, toJSON };

/**
 * @param {Record<string, any>} json
 * @returns {FormData}
 */
function toFormData(json) {
  const data = new FormData();
  for (const key in json) {
    const value = json[key];
    if (typeof value[Symbol.iterator] === "function") {
      for (const item of value) data.append(key, item);
    } else {
      data.append(key, value);
    }
  }
  return data;
}

/**
 * @param {Record<string, any>} json
 * @returns {URLSearchParams}
 */
function toSearchParams(json) {
  const data = new URLSearchParams();
  for (const key in json) {
    const value = json[key];
    if (typeof value[Symbol.iterator] === "function") {
      for (const item of value) data.append(key, item);
    } else {
      data.append(key, value);
    }
  }
  return data;
}

/**
 * @param {FormData | URLSearchParams} data
 * @param {Schema} [schema]
 * @returns {Record<string, any>}
 */
function toJSON(data, schema = {}) {
  const json = /** @type {Record<string, any>} */ ({});
  for (const key of data.keys()) {
    if (key in schema) {
      const parse = schema[key];
      if (Array.isArray(parse)) {
        json[key] = data.getAll(key).map(parse[0]);
      } else {
        const value = data.get(key);
        json[key] = value === null || value === undefined ? value : parse(value);
      }
    } else {
      json[key] = data.get(key);
    }
  }
  return json;
}

/**
 * @typedef {{ [key: string]: Type | [Type] }} Schema
 */

/**
 * @typedef {(value: FormDataEntryValue) => any} Type
 */
