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

import { round } from './math/math.js'
import { assert } from './utils/assert.js'
import { pipe } from './utils/fn.js'
import { CONTRAST_ALGORITHMS, multiply_contrast_ratio, ratio_names } from './color/contrast.js'
import { fmt_color } from './color/fmt.js'
import { generate_colors } from './color/generate.js'
import { Color } from './color/color.js'
import { create_background_color_scale } from './color/background.js'
import { map, unzip, zip } from './utils/iter.js'
import { COLOR_SPACES } from './color/space.js'
import { chroma, to } from './color/chroma.js'

const whitespace_re = /s+/g

export class Theme {
  /** @type {import('./color/color.js').Color[]} */
  #colors
  /** @type {import('./color/color.js').Color} */
  #background_color
  /** @type {number} */
  #lightness
  /** @type {number} */
  #contrast
  /** @type {number | null} */
  #saturation = null
  /** @type {import('./color/contrast.js').ContrastAlgorithm} */
  #algorithm
  /** @type {import('./color/space.js').ColorSpace} */
  #output_format

  /** @type {string[]} */
  #_background_color_scale = null
  /** @type {string} */
  #_background_color_value = null
  /**
   * @type {null | {
   *  colors: [OutputBackgroundColor, ...OutputColor[]]
   *  color_pairs: Record<string, string>
   *  color_values: string[]
   * }}
   */
  #_output = null

  /**
   * 
   * @param {{
   *  colors: import('./color/color.js').Color[]
   *  background_color: import('./color/color.js').Color | string
   *  lightness?: number
   *  contrast?: number
   *  saturation?: number
   *  algorithm?: import('./color/contrast.js').ContrastAlgorithm
   *  output_format?: import('./color/space.js').ColorSpace
   * }} opts 
   */
  constructor(opts) {
    const { colors, background_color, lightness = 100, contrast = 1, saturation, algorithm = 'wcag3', output_format = 'rgb' } = opts
    assert(colors, `no colors defined`)
    assert(Array.isArray(colors), `colors should be an array of Color instance`)
    colors.forEach(color => {
      assert(color instanceof Color, `colors contains elements not Color instances`)
      assert(color.ratios, `color ${color.name}'s ratios are not defined`)
    })
    assert(background_color, `no background color defined`)
    assert(CONTRAST_ALGORITHMS.has(algorithm), `contrast algorithm "${algorithm}" not supported`)
    assert(COLOR_SPACES.hasOwnProperty(opts.output_format), `output format "${opts.output_format}" not supported`)
    
    this.#set_colors(colors)
    this.#set_lightness(lightness)
    this.#set_contrast(contrast)
    if (opts.hasOwnProperty('saturation')) { this.with_saturation(saturation) }
    this.#set_algorithm(algorithm)
    this.#set_output_format(output_format)
    this.with_background_color(background_color)
  }

  get colors() { return this.#colors }
  get background_color() { return this.#background_color }
  get lightness() { return this.#lightness }
  get contrast() { return this.#contrast }
  get saturation() { return this.#saturation }
  get algorithm() { return this.#algorithm }
  get output_format() { return this.#output_format }
  get background_color_value() { return this.#get_background_color_value() }

  /** @param {import('./color/color.js').Color[]} colors */
  with_colors(colors) { this.#set_colors(colors); return this }

  /** @param {import('./color/color.js').Color | string} background_color */
  with_background_color(background_color) {
    // If it's a string, convert to Color object and assign lightness.  
    if (typeof background_color === 'string') {
      this.#set_background_color(new Color({ name: 'background', colorKeys: [background_color], output: 'rgb' }))
      this.#set_lightness(round(to.hsluv(chroma(background_color))[2]))
    } else {
      this.#set_background_color(background_color.clone())
    }
    this.#_invalidate_background_color_scale()
    return this
  }

  /** @param {number} lightness */
  with_lightness(lightness) { this.#set_lightness(lightness); return this }

  /** @param {number} contrast */
  with_contrast(contrast) { this.#set_contrast(contrast); return this }

  /** @param {number} saturation */
  with_saturation(saturation) {
    if (saturation !== this.#saturation) {
      this.#saturation = saturation
      this.#set_colors(map(color => color.with_saturation(saturation)))
    }
    return this
  }

  /** @param {import('./color/contrast.js').ContrastAlgorithm} algorithm */
  with_algorithm(algorithm) { this.#set_algorithm(algorithm); return this }

  /** @param {import('./color/space.js').ColorSpace} fmt */
  with_output_format(fmt) { this.#set_output_format(fmt); return this }

  /**
   * get the color palette given the current theme configuration,
   * in the specified color space (or the theme's specified color space, if not defined).
   * 
   * @param {import('./color/space.js').ColorSpace} [output_format]
   * 
   * @returns {{
   *  colors: [OutputBackgroundColor, ...OutputColor[]]
   *  color_pairs: Record<string, string>
   *  color_values: string[]
   * }}
   */
  palette(output_format) {
    if (this.#_output !== null) { return this.#_output }
    const bg_rgb_arr = chroma(this.#get_background_color_value()).rgb()
    const base_v = this.#lightness / 100
    const formatted_bg_color_value = fmt_color(this.#get_background_color_value(), this.#output_format)
  
    const [palette_colors, unflatted_palette_color_pairs, unflattened_palette_color_values] =
      unzip(this.#colors.map(color => {
        const name = color.name.replace(whitespace_re, '')
  
        /**@type {[string[], number[]]} */
        const [swatch_names, ratio_values] = pipe(
          ratios => Array.isArray(ratios)
            ? [ratio_names(ratios, this.#algorithm).map(r => `${name}${r}`), ratios]
            : unzip(Object.entries(ratios)),
          // modify target ratio based on contrast multiplier
          ([_, ratios]) => [_, ratios.map(ratio => multiply_contrast_ratio(+ratio, this.#contrast))],
        )(color.ratios)
  
        const contrast_colors = generate_colors(color, bg_rgb_arr, base_v, ratio_values, this.#algorithm)
          .map((clr) => fmt_color(clr, output_format ?? this.#output_format))
  
        const color_objs = zip([contrast_colors, ratio_values, swatch_names])
          .map(([value, ratio, name]) => ({ name, contrast: ratio, value }))
  
        const output_color = { name: color.name, values: color_objs }
        const output_color_pairs = color_objs.map(o => /**@type {[string, string]} */( [o.name, o.value] ))
        const output_color_values = color_objs.map(o => o.value)
        return /**@type {const} */( [output_color, output_color_pairs, output_color_values] )
      }))
    
    const base_obj = { background: formatted_bg_color_value }
    /** @type {[OutputBackgroundColor, ...OutputColor[]]} */
    const output_colors = [base_obj, ...palette_colors]
    /** @type {Record<string, string>} */
    const output_color_pairs = { ...base_obj, ...Object.fromEntries(unflatted_palette_color_pairs.flat()) }
    const output_color_values = unflattened_palette_color_values.flat()

    this.#_output = { colors: output_colors, color_pairs: output_color_pairs, color_values: output_color_values }
    return this.#_output
  }

  to_object() {
    return {
      colors: this.colors,
      background_color: this.background_color,
      lightness: this.lightness,
      contrast: this.contrast,
      saturation: this.saturation,
      algorithm: this.algorithm,
      output_format: this.output_format,
      background_color_value: this.background_color_value,
    }
  }

  /** @returns {string[]} */
  #get_background_color_scale() {
    if (this.#_background_color_scale !== null) { return this.#_background_color_scale }
    this.#set_background_color_scale(create_background_color_scale(this.#background_color, 'rgb'))
    return this.#_background_color_scale
  }
  /** @returns {string} */
  #get_background_color_value() {
    if (this.#_background_color_value !== null) { return this.#_background_color_value }
    this.#set_background_color_value(this.#get_background_color_scale()[this.#lightness])
    return this.#_background_color_value
  }

  /** @param {import('./color/color.js').Color[] | ((prev: import('./color/color.js').Color[]) => import('./color/color.js').Color[])} colors */
  #set_colors(colors) {
    this.#colors = typeof colors === 'function' ? colors(this.#colors) : colors
    this.#_invalidate_output()
  }
  /** @param {import('./color/color.js').Color} bg_color */
  #set_background_color(bg_color) {
    this.#background_color = bg_color
    this.#_invalidate_background_color_scale()
  }
  /** @param {number} lightness */
  #set_lightness(lightness) {
    this.#lightness = lightness
    this.#_invalidate_background_color_value()
  }
  /** @param {number} contrast */
  #set_contrast(contrast) {
    this.#contrast = contrast
    this.#_invalidate_output()
  }
  /** @param {import('./color/contrast.js').ContrastAlgorithm} algorithm */
  #set_algorithm(algorithm) {
    this.#algorithm = algorithm
    this.#_invalidate_output()
  }
  /** @param {import('./color/space.js').ColorSpace} fmt */
  #set_output_format(fmt) {
    this.#output_format = fmt
    this.#_invalidate_output()
  }
  /** @param {string[]} scale */
  #set_background_color_scale(scale) {
    this.#_background_color_scale = scale
    this.#_invalidate_background_color_value()
  }
  /** @param {string} val */
  #set_background_color_value(val) {
    this.#_background_color_value = val
    this.#_invalidate_output()
  }

  #_invalidate_background_color_scale() {
    this.#_background_color_scale = null
    this.#_invalidate_background_color_value()
  }
  #_invalidate_background_color_value() {
    this.#_background_color_value = null
    this.#_invalidate_output()
  }
  #_invalidate_output() {
    this.#_output = null
  }
}

/**
 * @typedef {{
*  name: string
*  values: {
*    name: string
*    contrast: number
*    value: string
*  }[]
* }} OutputColor
*/

/**
* @typedef {{ background: string }} OutputBackgroundColor
*/