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

/**
 * @typedef {keyof typeof COLOR_SPACES} ColorSpace
 */

/** @typedef {(typeof COLOR_SPACES)[ColorSpace]} InternalColorSpace */

/**
 * maps color spaces to their corresponding methods on `chroma`
 */
export const COLOR_SPACES = /**@type{const}*/({
  "cam02":  'jab',
  "cam02p": 'jch',
  "hex":    'hex',
  "rgb":    'rgb',
  "hsl":    'hsl',
  "hsluv":  'hsluv',
  "lab":    'lab',
  "lch":    'lch',
  "oklab":  'oklab',
  "oklch":  'oklch',
})


/**
 * @type {<O, const Ks extends string[]>(o: O, ks: Ks) => Pick<O, Ks[number]>}
 */
function pick(o, ks) {
  return ks.reduce((a, c) => {
    a[c] = o[c]
    return a
  }, {})
}

/**
 * @typedef {Extract<ColorSpace,
 *  | 'cam02'
 *  | 'lab'
 *  | 'hsl'
 *  | 'hsluv'
 *  | 'rgb'
 * >} InterpolationColorSpace
 */

export const INTERPOLATION_COLOR_SPACES = pick(COLOR_SPACES, [
  'cam02',
  'cam02p',
  'rgb',
  'hsl',
  'hsluv',
  'lab',
  'lch',
  'oklab',
  'oklch',
])
