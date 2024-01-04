/*
Copyright 2019 Adobe. All rights reserved.
Modifications copyright 2024 adaptive-colors contributors.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { range, repeat } from '../utils/iter.js'
import { dist, neg, add, mul, div } from './point.js'

/**
 * @typedef {[
 *  p0: import('./point.js').Point,
 *  p1: import('./point.js').Point,
 *  p2: import('./point.js').Point,
 *  p3: import('./point.js').Point,
 * ]} CubicBezier
 */

/**
 * converts a catmull spline into a sequence of cubic bezier curves
 * 
 * @param {import('./point.js').Point[]} cps -- catmull curve's control points
 * @returns {CubicBezier[]}
 */
export function catmull_to_bezier(cps) {
  const n = cps.length
  const ns1 = n - 1, ns2 = n - 2
  return range(ns1)
    .map(i => {
      const v1 = cps[Math.max(i - 1, 0)] 
      const v2 = cps[i]
      const v3 = i < ns1 ? cps[i + 1] : add(v2, v2, neg(v1))
      const v4 = i < ns2 ? cps[i + 2] : add(v3, v3, neg(v2))

      const p0 = v2
      const p1 = div(add(neg(v1), mul(6, v2), v3), 6)
      const p2 = div(add(neg(v4), mul(6, v3), v2), 6)
      const p3 = v3
      return [p0, p1, p2, p3]
    })
}

/**
 * approximates the length of a cubic bezier
 * 
 * @param {CubicBezier} curve 
 * @param {number} [steps=10] 
 * @returns 
 */
export function approximate_bezier_len(curve, steps = 10) {
  let [x, y] = curve[0]
  let len = 0
  for (let i = 1; i < steps; ++i) {
    const p = point_at(curve, i / steps)
    len += dist([x, y], p)
    ;[x, y] = p
  }
  len += dist([x, y], curve[3])
  return len;
}

/**
 * @param {CubicBezier} curve 
 */
export function prepare_curve(curve) {
  // we take advantage of the fact that we know the curve is strictly increasing along x (?):
  //  we construct the curve from zip(domains, color_points) and domains is sorted.
  // as such in turn we know that p{t_i+1}.x > p{t_i}.x
  
  // dunno where adobe got this magic number from
  const len = Math.floor(approximate_bezier_len(curve) * .75)

  /** @type {(number | null)[]} */
  const lookup = repeat(len + 1)(null)
  let prev_ind = 0
  for (let i = 0; i <= len; ++i) {
    const t = i / len
    const [x, y] = point_at(curve, t)
    const ind = Math.round(x)
    // we'll aggregate all y values for x that rounds to ind, and average that in the end.
    // adobe just overrides (lookup[ind] = y), which is mostly fine (they're usually pretty close together anyway),
    // but heck why not try to average it out a bit 
    // multiple points may round to the same x.
    // overriding here is fine because they're usually pretty close together anyway
    lookup[ind] = y
    if (ind - prev_ind > 1) {
      const s = lookup[prev_ind]
      const f = lookup[ind]
      for (let j = prev_ind + 1; j < ind; ++j) {
        lookup[j] = s + ((f - s) / (ind - prev_ind)) * (j - prev_ind)
      }
    }
    prev_ind = ind
  }
  // some x values may have null.
  // in this case, adobe iterates through to find the first non-null value
  //  (which is done in `smoothScale`, which calls this).
  // we'll just do that right now, replacing `null` with the first non-null value after it
  for (let i=lookup.length - 1; i; --i) {
    if (lookup[i-1] === null && lookup[i] !== null) { lookup[i-1] = lookup[i] }
  }
  /** @type {(x: number) => number | null} */
  return (x) => lookup[Math.round(x)] ?? null
};

/**
 * finds the point along a cubic bezier curve at time t
 * 
 * @param {CubicBezier} curve 
 * @param {number} t 
 * @returns {import('./point.js').Point}
 */
function point_at(curve, t) {
  const [p0, p1, p2, p3] = curve

  const t_2 = t * t
  const t_3 = t_2 * t
  const t1 = 1 - t
  const t1_2 = t1 * t1
  const t1_3 = t1_2 * t1

  return add(mul(t1_3, p0), mul(3 * t1_2 * t, p1), mul(3 * t1 * t_2, p2), mul(t_3, p3))
}