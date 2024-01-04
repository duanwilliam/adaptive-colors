/**
 * 
 * @param {number} n -- number to round
 * @param {number} d -- # of decimal places to round to 
 * @returns 
 */
export function round(n, d = 0) {
  const e = 10 ** d
  return Math.round(n * e) / e
}

/** @type {(n: number) => boolean} */
export const is_nan = n => Number.isNaN(n)

/** @type {(n: number) => boolean} */
export const is_not_nan = n => !is_nan(n)

/** @type {(n: number) => number} */
export const map_nan_to_zero = n => is_nan(n) ? 0 : n

export const sum = (...xs) => xs.reduce((a, c) => a + c, 0)

/**
 * finds the average of a list of numbers.
 * if list is empty, returns null (not nan)
 * 
 * @param {number[]} l 
 * @returns {number | null}
 */
export const average = l => l.length ? l.reduce((a, b) => a + b) : null

/** @type {(l: number[]) => number} */
export const max = l => Math.max(...l)
/** @type {(l: number[]) => number} */
export const min = l => Math.min(...l)

/** @type {(n: number) => (x: number) => boolean} */
export const gt = n => x => x > n
/** @type {(n: number) => (x: number) => boolean} */
export const ge = n => x => x >= n
/** @type {(n: number) => (x: number) => boolean} */
export const lt = n => x => x < n
/** @type {(n: number) => (x: number) => boolean} */
export const le = n => x => x <= n

/**
 * checks if x is between l and h, inclusive
 * 
 * @param {number} l 
 * @param {number} x 
 * @param {number} h 
 * @returns {boolean}
 */
export function between(l, x, h) {
  return l <= x && x <= h
} 