/**
 * @typedef {[x: number, y: number]} Point
 */

/**
 * euclidean distance between two points
 * @param {Point} a 
 * @param {Point} b 
 * @returns 
 */
export function dist([x0, y0], [x1, y1]){
  return Math.hypot(x1 - x0, y1 - y0)
}

/**
 * linear interpolation between two points
 * @param {Point} p0 
 * @param {Point} p1 
 * @param {number} t 
 * @returns 
 */
export function lerp([x0, y0], [x1, y1], t) {
  return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)]
}

/**
 * negates a point
 * @param {Point} point 
 * @returns {Point}
 */
export function neg([x, y]) {
  return [-x, -y]
}

/**
 * adds points
 * @param  {...Point} ps 
 * @returns {Point}
 */
export function add(...ps) {
  return ps.reduce(([ax, ay], [cx, cy]) => [ax + cx, ay + cy], [0, 0])
}

/**
 * multiplies point by n
 * @param {number} n 
 * @param {Point} point 
 * @returns {Point}
 */
export function mul(n, [x, y]) {
  return [n * x, n * y]
}

/**
 * divides point by n
 * @param {Point} point
 * @param {number} n 
 * @returns {Point}
 */
export function div([x, y], n) {
  return [x / n, y / n]
}