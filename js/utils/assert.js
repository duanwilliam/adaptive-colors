/**
 * 
 * @param {boolean | any} cond 
 * @param {string} message 
 */
export function assert(cond, message) {
  if (!cond) {
    throw new Error(message)
  }
}