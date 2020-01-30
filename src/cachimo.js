const cache = new Map();
const timeouts = new Map();

/**
 * Returns value from cache by given `key`.
 *
 * @param {string | number | boolean} key
 *
 * @returns {any} value from cache
 */
function get(key) {
  return cache.get(key);
}

/**
 * Removes element from cache by given `key`.
 *
 * @param {string | number | boolean} key
 *
 * @returns {boolean} true if element has been removed, false otherwise
 */
function remove(key) {
  return cache.delete(key);
}

/**
 * Checks if whether an element with given `key` exist.
 *
 * @param {string | number | boolean} key
 *
 * @returns {boolean} true if element exist, false otherwise
 */
function has(key) {
  return cache.has(key);
}

/**
 * Returns the number of elements in cache.
 *
 * @returns {number} number of elements in cache
 */
function size() {
  return cache.size;
}

/**
 * Returns all keys stored in cache.
 *
 * @returns {Array<string | number | boolean>} all keys
 */
function keys() {
  return [...cache.keys()];
}

/**
 * Returns all values stored in cache.
 *
 * @returns {Array<any>} all values
 */
function values() {
  return [...cache.values()];
}

/**
 * Returns all entries (keys and values) stored in cache.
 *
 * @returns {Array<[string | number | boolean, any]>} all entries (keys and values)
 */
function entries() {
  return [...cache.entries()];
}

/**
 * Removes all elements stored in cache and clears all timeouts.
 *
 * @returns {number} how much elements was removed from cache
 */
function clear() {
  timeouts.forEach((callback, timeout) => {
    clearTimeout(timeout);

    // reject Promise or execute callback which returns Error
    callback();
  });

  const length = size();
  cache.clear();
  return length;
}

/**
 * Check if value has type undefined
 * @param {any} value
 * @returns {boolean}
 */
function isUndefined(value) {
  return typeof value === 'undefined';
}

/**
 * Stores an element in-memory with specified key and value.
 *
 * If only `key` and `value` is provided it returns boolean.
 * true: if element was stored and key doesn't exist.
 * false: if key does exist.
 *
 * If additionally only `timeout` is provided it returns Promise.
 * Element will be deleted after given `timeout` and Promise will be resolved.
 * Otherwise it will be rejected if element does not exist.
 *
 * If additionally `timeout` and `callback` is provided it executes given `callback` after given `timeout`.
 *
 * @param {string | number | boolean} key can be only: `string` | `number` | `boolean`
 * @param {any} value can be any type
 * @param {number} timeout after how much time in milliseconds element will be deleted
 * @param {(err: Error, key: string | number | boolean, value: any, timeout: number)} callback will be executed after given `timeout`
 *
 * @returns {boolean | Promise<{ key: string | number | boolean, value: any, timeout: number }>} boolean or Promise
 */
function put(key, value, timeout, callback) {
  // key type is incorrect
  if ( !['string', 'number', 'boolean'].includes(typeof key) ) {
    throw new TypeError(`key can be only: string | number | boolean instead of ${typeof key}`);
  }

  // check if key is not NaN
  if (typeof key === 'number' && isNaN(key)) {
    throw new TypeError('key can be only: string | number | boolean instead of NaN');
  }

  // timeout type is incorrect and/or timeout is not positive number
  if ( !(isUndefined(timeout) || Number.isFinite(timeout)) || timeout <= 0 ) {
    throw new TypeError('timeout should be positive number');
  }

  // callback type is incorrect
  if ( !isUndefined(callback) && typeof callback !== 'function') {
    throw new TypeError(`callback should be function instead of ${typeof callback}`);
  }

  // key does exist
  if (has(key)) {
    return false;
  }

  cache.set(key, value);

  // return Promise
  if ( !isUndefined(timeout) && isUndefined(callback)) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        if (cache.delete(key)) {
          resolve({ key, value, timeout });
        } else {
          reject(new Error(`${key} does not exist`));
        }
      }, timeout);
      timeouts.set(t, () => reject(new Error(`${key} timeout was cleared`)));
    });
  }

  // execute callback
  if ( !isUndefined(timeout) && !isUndefined(callback)) {
    const t = setTimeout(() => {
      if (cache.delete(key)) {
        callback(null, key, value, timeout);
      } else {
        callback(new Error(`${key} does not exist`));
      }
    }, timeout);
    timeouts.set(t, () => callback(new Error(`${key} timeout was cleared`)));
  }

  return true;
}

module.exports = { get, remove, has, size, keys, values, entries, clear, put };
