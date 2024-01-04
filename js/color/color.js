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
import { assert } from '../utils/assert.js'
import { chroma, from, to } from './chroma.js'
import { pipe } from '../utils/fn.js'

export class Color {
  /** @type {string} */
  #name
  /** @type {string[]} */
  #key_colors
  /**
   * this is the key colors, adjusted by saturation.
   * afaik its only use is for the color scale - maybe it can be removed altogether
   * and its logic put into the color scale?
   * 
   * update: probably need it because background color scale needs it.
   * unless make background color its own class but that feels scuffed.
   * @type {string[]}
   */
  #resolved_key_colors
  /** @type {import('./space.js').ColorSpace} */
  #color_space
  /** @type {number[] | Record<string, number>} */
  #ratios
  /** @type {boolean} */
  #smooth
  /** @type {number} */
  #saturation

  /**
   * 
   * @param {{
   *  name: string
   *  key_colors: string[]
   *  color_space: import('./space.js').ColorSpace
   *  ratios: number[] | Record<string, number>
   *  smooth?: boolean
   *  saturation?: number
   * }} opts 
   */
  constructor({ name, key_colors, color_space, ratios, smooth = false, saturation = 100 }) {
    assert(name, `Color not provided a name`)
    assert(key_colors, `Key colors not defined`)
    key_colors.forEach(ck => assert(chroma.valid(ck), `Invalid color key "${ck}"`))
    assert(COLOR_SPACES.hasOwnProperty(color_space), `Color space ${color_space} not supported`)
    assert(ratios && typeof ratios === 'object', `Ratios not defined`)
  
    this.with_name(name)
    this.with_key_colors(key_colors)
    this.with_color_space(color_space)
    this.with_ratios(ratios)
    this.with_smooth(smooth)
    this.with_saturation(saturation)
  }

  clone() {
    return new Color(structuredClone({
      name: this.#name,
      key_colors: this.#key_colors,
      resolved_key_colors: this.#resolved_key_colors,
      color_space: this.#color_space,
      ratios: this.#ratios,
      smooth: this.#smooth,
      saturation: this.#saturation,
    }))
  }

  get name() { return this.#name }
  get key_colors() { return this.#key_colors }
  get resolved_key_colors() { return this.#resolved_key_colors }
  get color_space() { return this.#color_space }
  get ratios() { return this.#ratios }
  get saturation() { return this.#saturation }
  get smooth() { return this.#smooth }

  /** @param {string} name  */
  with_name(name) { this.#name = name; return this }

  /** @param {string[]} key_colors  */
  with_key_colors(key_colors) {
    this.#key_colors = key_colors
    this.#resolved_key_colors = saturate(this.#key_colors, this.#saturation)
    return this
  }

  /** @param {import('./space.js').ColorSpace} color_space  */
  with_color_space(color_space) { this.#color_space = color_space; return this }

  /** @param {number[] | Record<string, number>} ratios  */
  with_ratios(ratios) { this.#ratios = ratios; return this }

  /** @param {boolean} smooth  */
  with_smooth(smooth) { this.#smooth = !!smooth; return this }

  /** @param {number} saturation  */
  with_saturation(saturation = 100) {
    this.#saturation = saturation
    this.#resolved_key_colors = saturate(this.#key_colors, this.#saturation)
    return this
  }  

  to_object() {
    return {
      name: this.#name,
      key_colors: this.#key_colors,
      color_space: this.#color_space,
      ratios: this.#ratios,
      smooth: this.#smooth,
      saturation: this.#saturation,
    }
  }

}

/**
 * 
 * @param {string[]} key_colors 
 * @param {number} saturation 
 * @returns {string[]}
 */
function saturate(key_colors, saturation) {
  return key_colors.map(key => {
    const cur_hsluv = to.hsluv(chroma(`${key}`))
    const new_hsluv = [cur_hsluv[0], cur_hsluv[1] * (saturation / 100), cur_hsluv[2]]
    return pipe(
      hsluv => from.hsluv(...hsluv),
      to.hex,
    )(new_hsluv)
  })
}