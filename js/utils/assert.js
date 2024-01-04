/**
 * assert a condition is truthy,
 * throwing an error with a given message otherwise
 * 
 * @param {boolean | any} cond 
 * @param {string} message 
 */
export function assert(cond, message) {
  if (!cond) { throw new Error(message) }
}