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
  "hex":    'hex',
  "rgb":    'rgb',
  "hsl":    'hsl',
  "hsv":    'hsv',
  "hsluv":  'hsluv',
  "lab":    'lab',
  "lch":    'lch',
  "oklab":  'oklab',
  "oklch":  'oklch',
  "cam02":  'cam02jab',
  "cam02p": 'cam02jch',
  "cam16":  'cam16jab',
  "cam16p": 'cam16jch',
  'hct':    'hct',
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
 * @typedef {keyof typeof INTERPOLATION_COLOR_SPACES} InterpolationColorSpace
 */

export const INTERPOLATION_COLOR_SPACES = pick(COLOR_SPACES, [
  'rgb',
  'hsl',
  'hsv',
  'hsluv',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'cam02',
  'cam02p',
  'cam16',
  'cam16p',
  'hct',
])

/**
 * @typedef {keyof typeof OUTPUT_COLOR_SPACES} OutputColorSpace
 * @typedef {typeof OUTPUT_COLOR_SPACES[OutputColorSpace]} InternalOutputColorSpace
 */

export const OUTPUT_COLOR_SPACES = pick(COLOR_SPACES, [
  'hex',
  'rgb',
  'hsl',
  'lab',
  'lch',
  'oklab',
  'oklch',
])