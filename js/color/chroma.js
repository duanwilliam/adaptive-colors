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
 * @overview shim for chroma-js, adding methods to convert color spaces not supported by chroma-js
 * into chroma-js colors, and likewise convert chroma-js colors into said unsupported color space values.
 * 
 * additionally provides the `chroma` chroma-js instance to use for the library.
 * this is mostly to avoid multiple chroma-js instances being imported if/when the library is bundled.
 */

import chroma from 'chroma-js'
export { chroma }

import { Hsluv } from 'hsluv'
import { illuminant, workspace, xyz as _xyz } from 'ciebase'
import ciecam02 from 'ciecam02'

import { pipe } from '../utils/fn.js'
import { map, take } from '../utils/iter.js'

const cam = ciecam02.cam({
  whitePoint: illuminant.D65,
  adaptingLuminance: 40,
  backgroundLuminance: 20,
  surroundType: 'average',
  discounting: false,
}, ciecam02.cfs('JCh'))

const xyz = _xyz(workspace.sRGB, illuminant.D65)

/** @type {(jch: [j: number, c: number, h: number]) => [r: number, g: number, b: number]} */
const jch_to_rgb = pipe(
  ([J, C, h]) => cam.toXyz({ J, C, h }),
  xyz.toRgb,
)

/** @type {(rgb: [r: number, g: number, b: number]) => [j: number, c: number, h: number]} */
const rgb_to_jch = pipe(
  xyz.fromRgb,
  cam.fromXyz,
  ({ J, C, h }) => [J, C, h]
)

const coefs = { k_l: 1, c1: 0.007, c2: 0.0228 }
const pi = Math.PI
const CIECAM02_la = (64 / pi) / 5
const CIECAM02_k = 1 / ((5 * CIECAM02_la) + 1)
const CIECAM02_fl = (0.2 * (CIECAM02_k ** 4) * (5 * CIECAM02_la)) + 0.1 * ((1 - (CIECAM02_k ** 4)) ** 2) * ((5 * CIECAM02_la) ** (1 / 3))

/** @type {(jch: [j: number, c: number, h: number]) => [j: number, a: number, b: number]} */
function jch_to_jab([J, C, h]) {
  const M = C * (CIECAM02_fl ** 0.25)
  let j = ((1 + 100 * coefs.c1) * J) / (1 + coefs.c1 * J)
  j /= coefs.k_l
  const M_prime = (1 / coefs.c2) * Math.log(1.0 + coefs.c2 * M)
  const a = M_prime * Math.cos(h * (pi / 180))
  const b = M_prime * Math.sin(h * (pi / 180))
  return [j, a, b]
}

/** @type {(jab: [j: number, a: number, b: number]) => [j: number, c: number, h: number]} */
function jab_to_jch([j, a, b]) {
  const new_M_prime = Math.sqrt(a * a + b * b)
  const new_M = (Math.exp(new_M_prime * coefs.c2) - 1) / coefs.c2
  const h = ((180 / pi) * Math.atan2(b, a) + 360) % 360
  const C = new_M / (CIECAM02_fl ** 0.25)
  const J = j / (1 + coefs.c1 * (100 - j))
  return [J, C, h]
}

/** @type {(jab: [j: number, a: number, b: number]) => [r: number, g: number, b: number]} */
const jab_to_rgb = pipe(
  jab_to_jch,
  jch_to_rgb,
)

/** @type {(rgb: [r: number, g: number, b: number]) => [j: number, a: number, b: number]} */
const rgb_to_jab = pipe(
  rgb_to_jch,
  jch_to_jab,
)

const conv = new Hsluv()

/** @type {(rgb: [r: number, g: number, b: number]) => [h: number, s: number, l: number]} */
function rgb_to_hsluv([r, g, b]) {
  conv.rgb_r = r
  conv.rgb_g = g
  conv.rgb_b = b
  conv.rgbToHsluv()
  return [conv.hsluv_h, conv.hsluv_s, conv.hsluv_l]
}

/** @type {(hsluv: [h: number, s: number, l: number]) => [r: number, g: number, b: number]} */
function hsluv_to_rgb([h, s, l]) {
  conv.hsluv_h = h
  conv.hsluv_s = s
  conv.hsluv_l = l
  conv.hsluvToRgb()
  return [conv.rgb_r, conv.rgb_g, conv.rgb_b]
} 

/** @type {(color: import('chroma-js').Color) => [j: number, c: number, h: number]} */
function to_jch(color) {
  return pipe(
    take(3),
    map(c => c / 255),
    rgb_to_jch,
  )(color._rgb)
}

/** @type {(...args: [j: number, c: number, h: number]) => import('chroma-js').Color} */
function from_jch(...args) {
  return pipe(
    jch_to_rgb,
    xs => chroma.gl(...xs),
  )(args)
}

/** @type {(color: import('chroma-js').Color) => [j: number, a: number, b: number]} */
function to_jab(color) {
  return pipe(
    take(3),
    map(c => c / 255),
    rgb_to_jab,
  )(color._rgb)
}

/** @type {(...args: [j: number, a: number, b: number]) => import('chroma-js').Color} */
function from_jab(...args) {
  return pipe(
    jab_to_rgb,
    xs => chroma.gl(...xs),
  )(args)
}

/** @type {(color: import('chroma-js').Color) => [h: number, s: number, l: number]} */
function to_hsluv(color) {
  return pipe(
    take(3),
    map(c => c / 255),
    rgb_to_hsluv,
  )(color._rgb)
}

/** @type {(...args: [h: number, s: number, l: number]) => import('chroma-js').Color} */
function from_hsluv(...args) {
  return pipe(
    hsluv_to_rgb,
    xs => chroma.gl(...xs),
  )(args)
}

/** @satisfies {Record<import('./space.js').InternalColorSpace, (...args: Parameters<import('chroma-js').ChromaStatic>) => color: import('chroma-js').Color} */
export const from = {
  hex:    chroma.hex,
  rgb:    chroma.rgb,
  hsl:    chroma.hsl,
  lab:    chroma.lab,
  lch:    chroma.lch,
  oklab:  chroma.oklab,
  oklch:  chroma.oklch,
  hsluv:  from_hsluv,
  jab:    from_jab,
  jch:    from_jch,
}

/** @satisfies {Record<import('./space.js').InternalColorSpace, (color: import('chroma-js').Color) => any} */
export const to = {
  hex:    c => c.hex(),
  rgb:    c => c.rgb(),
  hsl:    c => c.hsl(),
  lab:    c => c.lab(),
  lch:    c => c.lch(),
  oklab:  c => c.oklab(),
  oklch:  c => c.oklch(),
  hsluv:  to_hsluv,
  jab:    to_jab,
  jch:    to_jch,
}

export const chroma_color = {
  from,
  to,
}