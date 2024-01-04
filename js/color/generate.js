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

import { round } from '../math/math.js'
import { pipe } from '../utils/fn.js'
import { contrast } from './contrast.js'
import { color_scale } from './scale.js'
import { to } from './chroma.js'

/**
 * generates a set of colors that satisfies a set of contrast ratios given a background color
 * @param {import('./color.js').Color} color 
 * @param {[r: number, g: number, b: number]} bg_rgb_arr 
 * @param {number} base_v 
 * @param {number[]} ratio_values 
 * @param {import('./contrast.js').ContrastAlgorithm} contrast_algorithm 
 * @param {number} [granularity=3000] 
 * @returns {import('chroma-js').Color[]}
 */
export function generate_colors(color, bg_rgb_arr, base_v, ratio_values, contrast_algorithm, granularity = 3000) {
  const scale = color_scale(granularity, color.resolved_key_colors, color.color_space, {
    shift: 1,
    smooth: color.smooth,
    as_fn: true,
  })

  /** @type {Map<number, number>} */
  const cache = new Map()
  /** @type {(i: number) => number} */
  function contrast_at(i) {
    if (cache.has(i)) { return cache.get(i) }
    // const rgb = to.rgb(chroma(scale(i)))
    const rgb = to.rgb(scale(i))
    const c = contrast(rgb, bg_rgb_arr, base_v, contrast_algorithm)
    cache.set(i, c)
    return c
  }

  const first = contrast_at(0)
  const last = contrast_at(granularity)
  const dir = first < last ? 1 : -1
  const eps = 0.01 // ? adobe magic

  /** @type {(ratio: number) => number} */
  function search(ratio) {
    // nudge up target ratio by tiny amount
    const x = ratio + 0.005 * Math.sign(ratio) // ? adobe magic

    let step = granularity / 2
    let dot = step
    let c = contrast_at(dot)

    let max_iters = 100
    while (Math.abs(c - x) > eps && max_iters) {
      max_iters -= 1
      step /= 2
      dot += (c < x ? 1 : -1) * step * dir
      c = contrast_at(dot)
    }

    return round(dot, 3)
  }

  return ratio_values.map(pipe(search, scale))
}