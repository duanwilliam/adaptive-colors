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

import { pipe } from '../utils/fn.js'
import { map, push, sort_numeric_by, take, uniq_by } from '../utils/iter.js'
import { to, chroma } from './chroma.js'
import { fmt_color } from './fmt.js'
import { color_scale } from './scale.js'

/**
 * generates a scale of background color values as `output_format`-formatted css strings 
 * 
 * @param {import('./color.js').Color} color 
 * @param {import('./space.js').ColorSpace} output_format
 * @returns {string[]}
 */
export function create_background_color_scale(color, output_format) {
  // This would create a 100 color value array based on all parameters,
  // which can be used for sliding lightness as a background color

  // create massive scale
  const bg_color_scale = color_scale(1000, color.key_colors, color.color_space, {
    shift: 1,
    smooth: color.smooth,
    // Inject original keycolors to ensure they are present in the background options
  }).concat(color.key_colors)

  const bg_color_arr = pipe(
    // schwartzian transform -
    // Convert to HSLuv and keep track of original indices
    map((c, i) => ({ value: Math.round(to.hsluv(chroma(c))[2]), i })),
    uniq_by('value'),
    sort_numeric_by((/**@type {{ value: Number, i: number }} */o) => o.value),
    map(o => bg_color_scale[o.i]),
    // Manually cap the background array at 100 colors, 
    take(100),
    // then add white back to the end since it sometimes gets removed.
    push('#ffffff'),
  )(bg_color_scale)

  const final_bg_color_scale = bg_color_arr.map(color => fmt_color(color, output_format))
  return final_bg_color_scale
}