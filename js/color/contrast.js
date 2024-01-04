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

import { APCAcontrast as apca_contrast, sRGBtoY as srgb_to_y } from 'apca-w3'

import { min, round } from '../math/math.js'
import { assert } from '../utils/assert.js'
import { numeric, range } from '../utils/iter.js'
import { to } from './chroma.js'


/**
 * @typedef {'wcag2' | 'wcag3'} ContrastAlgorithm
 */

export const CONTRAST_ALGORITHMS = new Set(['wcag2', 'wcag3'])

/** @type{(base_v: number) => boolean} */
const is_darkmode = base_v => base_v < 0.5 

/**
 * srgb luminance algorithm, as defined by wcag 2.x
 * 
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 * 
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {number}
 */
function wcag2_relative_luminance(r, g, b) {
  const [r_, g_, b_] = [r, g, b]
    .map(n =>
      n <= 0.03928
        ? n / 12.92
        : ((n + 0.055) / 1.055) ** 2.4
    )
  return 0.2126 * r_ + 0.7152 * g_ + 0.0722 * b_
}

const normalize = n => n / 255

/**
 * 
 * @param {[r255: number, g255: number, b255: number]} color 
 * @param {[r255: number, g255: number, b255: number]} base 
 * @param {boolean} dark_mode 
 */
function wcag2_contrast(color, base, dark_mode) {
  const [cr, cg, cb] = color.map(normalize)
  const [br, bg, bb] = base.map(normalize)

  const [yc, yb] = [wcag2_relative_luminance(cr, cg, cb), wcag2_relative_luminance(br, bg, bb)]

  const is_light_on_dark = yc >= yb

  const contrast_ratio = (light, dark) => (light + 0.05) / (dark + 0.05)

  // trivial case
  if (yb === yc) { return 1 }

  return dark_mode
    // dark mode
    ? is_light_on_dark
      ? contrast_ratio(yc, yb)
      : -1 * contrast_ratio(yb, yc)
    // light mode
    : is_light_on_dark
      ? -1 * contrast_ratio(yc, yb)
      : contrast_ratio(yb, yc)
}

/**
 * 
 * @param {[r255: number, g255: number, b255: number]} color 
 * @param {[r255: number, g255: number, b255: number]} base 
 * @param {boolean} dark_mode 
 */
function wcag3_contrast(color, base, dark_mode) {
  return (dark_mode ? -1 : 1) * apca_contrast(srgb_to_y(color), srgb_to_y(base))
}

/**
 * 
 * @param {[r: number, g: number, b: number]} color 
 * @param {[r: number, g: number, b: number]} base 
 * @param {number | undefined} base_v 
 * @param {ContrastAlgorithm} [algorithm='wcag3'] 
 */
export function contrast(color, base, base_v, algorithm = 'wcag3') {
   // If base is an array and base_v undefined
  if (base_v === undefined) {
    const base_lightness = to.hsluv(chroma.rgb(...base))[2]
    base_v = round(base_lightness / 100, 2)
  }
  
  switch (algorithm) {
    case 'wcag2': { return wcag2_contrast(color, base, is_darkmode(base_v)) }
    case 'wcag3': { return wcag3_contrast(color, base, is_darkmode(base_v)) }
    default:
      throw new Error(`unrecognized contrast algorithm ${algorithm}. supported algorithms: "wcag2", "wcag3"`)
  }
}

export function multiply_contrast_ratio(ratio, multiplier) {
  // normalize contrast ratios before multiplying by making 1 = 0.
  // this ensures consistent application of increase/decrease in contrast ratios.
  // then add 1 back to number for contextual ratio value.
  const r =
    ratio > 1 ? (ratio - 1) * multiplier + 1
    : ratio < -1 ? (ratio + 1) * multiplier - 1
    // adobe ? shouldnt this be ratio * multiplier
    : 1
  return round(r, 2)
}

/**
 * provides "names" for a set of ratios.
 * negative ratios are distributed between 0 and 100,
 * positive ratios are evenly distributed by increments of 100.
 * the actual ratio value does not matter.
 * 
 * @example
 * ```
 * [-1.5, -1, -0.25, 0, 1.5, 4], wcag2 -> [25, 50, 75, 100, 200, 300]
 * [-1.5, -1, -0.25, 0, 1.5, 4], wcag3 -> [20, 40, 60, 80 , 100, 200]
 * ``` 
 * 
 * @param {number[]} ratios 
 * @param {ContrastAlgorithm} algorithm 
 * @returns 
 */
export function ratio_names(ratios, algorithm) {
  assert(ratios, `ratios are undefined`)

  ratios = ratios.sort(numeric)

  const min = min_positive_ratio(ratios, algorithm)
  const min_i = ratios.indexOf(min)

  const n_neg = min_i
  const n_pos = ratios.length - n_neg

  const d = 1 / (n_neg + 1)
  const m = d * 100

  // [1, 2, ..., 100, 200, ...]
  const n_arr =
    // name the negative values
    range(n_neg).map(i => round(m * (i + 1)))
    // name the positive values
    .concat(range(n_pos).map(i => (i + 1) * 100))
    .sort(numeric)
    .map(String)

  return n_arr
}

/** @type {Record<ContrastAlgorithm, number>} */
const MIN_RATIO = {
  wcag2: 0,
  wcag3: 1,
}

/**
 * given a contrast algorithm,
 * returns a function that determines whether or not a given ratio is "positive"
 *  wrt that contrast algorithm
 * @param {ContrastAlgorithm} algorithm 
 * @returns {(r: number) => boolean}
 */
export function is_positive_ratio(algorithm) {
  const m = MIN_RATIO[algorithm]
  return r => r >= m
}

/**
 * finds the smallest "positive" ratio in a list of ratios,
 *  as defined by what constitutes a positive ratio for the contrast algorithm used
 * @param {number[]} ratios 
 * @param {ContrastAlgorithm} algorithm 
 * @returns {number}
 */
export function min_positive_ratio(ratios, algorithm) {
  assert(ratios, `ratios array is undefined`)
  assert(Array.isArray(ratios), `ratios is not an array`)
  const f = is_positive_ratio(algorithm)
  return min(ratios.filter(f))
}