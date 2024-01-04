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

import { COLOR_SPACES } from './space.js'
import { filter, map, min_by, numeric, repeat, split_first, zip, unzip, range, take } from '../utils/iter.js'
import { is_nan, is_not_nan, map_nan_to_zero } from '../math/math.js'
import { id, pipe } from '../utils/fn.js'
import { catmull_to_bezier, prepare_curve } from '../math/curve.js'
import { chroma, from, to } from './chroma.js'

/**
 * @typedef {'linear' | 'polynomial' | 'parabola'} LightnessDistribution
 */

/**
 * @type {Record<LightnessDistribution, (x: number) => number>}
 */
const LIGHTNESS_DISTRIBUTIONS = {
  "linear": id,
  "parabola": x => Math.sqrt(x),
  // where are these magic numbers from?
  "polynomial": x => Math.sqrt(Math.sqrt((Math.pow(x, 2.25) + Math.pow(x, 4)) / 2)),
}

/**
 * @template {boolean} [AsFn=false]
 * @param {number} granularity 
 * @param {string[]} key_colors 
 * @param {import('./space.js').ColorSpace} color_space 
 * @param {{
 *  shift?: number,
 *  full_scale?: boolean,
 *  smooth?: boolean,
 *  distribute_lightness?: LightnessDistribution,
 *  sort_color?: boolean,
 *  as_fn?: AsFn
 * }} [opts] 
 * @returns {AsFn extends false ? string[] : (d: number) => import('chroma-js').Color}
 */
export function color_scale(granularity, key_colors, color_space, {
  shift = 1,
  full_scale = true,
  smooth = false,
  distribute_lightness = 'linear',
  sort_color = true,
  as_fn = false,
} = {}) {
  const space = COLOR_SPACES[color_space]

  // dunno what the purpose of this is,
  // and every time color_scale is called `shift` is 1 anyway so it doesnt do anything in practice. but idk
  const power_scale = make_pow_scale(shift, [1, granularity], [1, granularity])
  
  const domains = pipe(
    xs => get_domains(...xs),
    map(x => Math.max(0, power_scale(x))),
    map(LIGHTNESS_DISTRIBUTIONS[distribute_lightness]),
  )([granularity, key_colors, full_scale])
  
  const resolved_key_colors = pipe(
    sort_color
      ? sort_colors_by_lightness
      : id,
    full_scale
      ? xs => [
          // thought they were supposed to be color _keys_ so dunno what this is about w/ white/black for (ok)lch but idk adobe
          space === 'lch' ? from.lch(...to.lch(chroma('#fff')))
            : space === 'oklch' ? from.oklch(...to.oklch(chroma('#fff')))
            : '#ffffff',
          ...sort_colors_by_lightness(xs),
          space === 'lch' ? from.lch(...to.lch(chroma('#000')))
            : space === 'oklch' ? from.oklch(...to.oklch(chroma('#000')))
            : '#000000',
        ]
      : id,
  )(key_colors)
  
  /** @type {((d: number) => import('chroma-js').Color) | import('chroma-js').Scale<import('chroma-js').Color>} */
  const scale = pipe(
    smooth
      ? pipe(
          map(pipe(
            d => to[space](chroma(String(d))),
            // special case for HCL if C is NaN we should treat it as 0
            space === 'hcl' ? ([h, c, l]) => [h, map_nan_to_zero(c), l] : id,
            // JCh has some “random” hue for grey colors.
            // Replacing it to NaN, so we can apply the same method of dealing with them.
            space === 'jch' ? x => (Number.isNaN(chroma(x).hcl()[0]) ? x.with(2, Number.NaN) : x) : id,
          )),
          xs => smooth_scale(xs, domains, space),
        )
      : xs => chroma
        .scale(xs.map(color => color instanceof chroma.Color ? color : String(color)))
        .domain(domains)
        .mode(space),
  )(resolved_key_colors)

  if (as_fn) { return scale }
  
  const arr = smooth
    ? range(granularity).map(d => scale(d).hex())
    // if it wasn't smooth, scale should be a chroma Scale which has a `colors()` method
    : /**@type{import('chroma-js').Scale<import('chroma-js').Color>}*/(scale).colors(granularity)
  
  return arr
}

/**
 * 
 * @param {number} granularity 
 * @param {string[]} key_colors 
 * @param {boolean} full_scale 
 * @returns 
 */
function get_domains(granularity, key_colors, full_scale) {
  if (full_scale) {
    return [
      0, 
      ...key_colors
        .map(key => granularity * (1 - (to.jch(chroma(key))[0] / 100)))
        .sort(numeric)
        .concat(granularity),
      ]
  } else {
    const lums = key_colors.map(key => to.jch(chroma(key))[0] / 100)
    const [min, max] = [Math.min(...lums), Math.max(...lums)]
    const d = max - min

    return lums
      .map(lum =>
        (lum === 0 || is_nan((lum - min) / d))
          ? 0
          : granularity - (lum - min) / d * granularity
      ).sort(numeric)
  }
}

/**
 * 
 * @param {number} k 
 * @param {[number, number]} d 
 * @param {[number, number]} r 
 * @returns {(x: number) => number}
 */
function make_pow_scale(k = 1, d = [0, 1], r = [0, 1]) {
  const m = (r[1] - r[0]) / (d[1] ** k - d[0] ** k);
  const c = r[0] - m * d[0] ** k;
  return (x) => m * x ** k + c;
}

/**
 * 
 * @param {string[]} color_strs 
 * @returns {string[]}
 */
function sort_colors_by_lightness(color_strs) {
  // schwartzian transform
  return color_strs
    // convert to hsluv and keep track of original rgb color
    .map((c, i) => [to.jch(chroma(String(c))), i])
    // sort by lightness
    .sort((a, b) => b[0][0] - a[0][0])
    // retrieve original rgb color
    .map(([_, i]) => color_strs[i])
}

/**
 * color spaces with a hue component
 */
const HUE_COLOR_SPACES = new Set(
  'hcl',
  'hsl',
  'hsluv',
  'hsv',
  'jch',
)

/**
 * 
 * @param {[c0: number, c1: number, c2: number][]} colors 
 * @param {number[]} domains 
 * @param {import('./space.js').InternalColorSpace} space 
 */
function smooth_scale(colors, domains, space) {
  // first, convert [c0, c1, c2][] to [c0: [...], c1: [...], c2: [...]]
  /** @type {[c0: number[], c1: number[], c2: number[]]} */
  let color_scalars = pipe(
    map(take(3)),
    unzip,
  )(colors)
  
  color_scalars = map(pipe(
    // if space is hcl, convert all nans to zero
    space === 'hcl' ? map(map_nan_to_zero) : id,

    // then for each component...

    // set any leading nans to the first non-nan value in that sequence
    xs => {
      const i = xs.findIndex(is_not_nan)
      if (~i) { return repeat(i)(xs[i]).concat(xs.slice(i)) }
      // all greys case (everything was nan)
                              // hue is not important except for JCh
      return repeat(xs.length)(to.jch(chroma('#ccc'))[2])
    },
    // and likewise set any trailing nans to the last non-nan value
    xs => {
      const j = xs.findLastIndex(is_not_nan)
      // at this point there should be at least one non-nan value so dont need check for it - prior map() handled that
      return xs.slice(0, j + 1).concat(repeat(xs.length - 1 - j)(xs[j]))
    },
  ))(color_scalars)

  /** @type {[import('../math/point.js').Point[], import('../math/point.js').Point[], import('../math/point.js').Point[]]} */
  let color_points = color_scalars.map(pipe(
    // turn into points
    xs => zip([domains, xs]),
    // filter out any remaining nans
    filter(([_, point]) => is_not_nan(point)),
  ))
  
  // force hue to go on shortest route
  // (i dont really understand what this is doing but ty adobe)
  if (HUE_COLOR_SPACES.has(space)) {
    color_points = map(pipe(
      unzip,
      ([domains, hues]) => {
        const [x, xs] = split_first(hues)
        const new_hues = xs.reduce(([acc, addon], point, i) => {
          const prev = hues[i - 1]
          const p = point + addon
          const dir = min_by(x => Math.abs(prev - (p + x * 360)))([-1, 0, 1])
          acc.push(point)
          return [acc, addon + dir * 360]
        }, [[x], 0])
        return [domains, new_hues]
      },
      zip,
    ))(color_points)
  }

  /** @type {[import('../math/point.js').Point[], import('../math/point.js').Point[], import('../math/point.js').Point[]]} */
  const per_component_points = color_scalars.map(points => zip([domains, points]))

  /** @type {[((x: number) => number | null)[], ((x: number) => number | null)[], ((x: number) => number | null)[]]} */
  const curve = per_component_points.map(pipe(catmull_to_bezier, map(prepare_curve)))

  /**
   * @type{(d: number) => import('chroma-js').Color}
   */
  return d => {
    const ch = curve.map(fs => {
      for (const f of fs) {
        const r = f(d)
        if (r !== null) { return r }
      }
      return null
    })
    if (space === 'jch' && typeof ch[1] === 'number') {
      ch[1] = Math.max(0, ch[1])
    }
    return from[space](...ch)
  }
}