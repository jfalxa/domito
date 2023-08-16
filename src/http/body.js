export { toFormData, toSearchParams, toJSON };

/**
 * Convert a JSON object to a FormData instance
 *
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
 * Convert a JSON object to a URLSearchParam instance
 *
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
 * Convert a FormData or URLSearchParams instance to a JSON object.
 *
 * You can optionally specify a simple schema to choose how to parse the initial data.
 * It should be a flat object using the initial data keys as its own keys,
 * and specifying functions as values in order to parse the initial data values.
 *
 * Example:
 *
 * ```
 * const formData = new FormData()
 * formData.append("count", "12")
 * formData.append("checked", "true")
 *
 * const json = toJSON(formData, {
 *  count: Number,
 *  checked: (value) => value === "true"
 * })
 *
 * // json == { count: 12, checked: true }
 * ```
 *
 * You can also specify that a certain key has many values by wrapping the parser in an array in the schema:
 *
 * ```
 * const formData = new FormData()
 * formData.append("multiple", "first")
 * formData.append("multiple", "last")
 *
 * const json = toJSON(formData, { multiple: [String] })
 * // json == { multiple: ["first", "last"] }
 * ```
 *
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
