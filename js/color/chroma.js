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
 * it also ensures the `chroma` used has the monkey patch applied.
 */

import chroma from 'chroma-js'

import { pack, pipe, unpack } from '../utils/fn.js'
import { map, take } from '../utils/iter.js'

import { hsluv_to_rgb, rgb_to_hsluv } from './spaces/hsluv.js'
import { jab_to_rgb, rgb_to_jab } from './spaces/jab.js'
import { jch_to_rgb, rgb_to_jch } from './spaces/jch.js'

const get_rgb_from_chroma_color = color => color._rgb

/** @type {(color: import('chroma-js').Color) => [j: number, c: number, h: number]} */
const to_jch = pipe(
  get_rgb_from_chroma_color,
  take(3),
  map(c => c / 255),
  rgb_to_jch,
)

/** @type {(...args: [j: number, c: number, h: number]) => import('chroma-js').Color} */
const from_jch = pack(pipe(
  jch_to_rgb,
  unpack(chroma.gl),
))

/** @type {(color: import('chroma-js').Color) => [j: number, a: number, b: number]} */
const to_jab = pipe(
  get_rgb_from_chroma_color,
  take(3),
  map(c => c / 255),
  rgb_to_jab,
)

/** @type {(...args: [j: number, a: number, b: number]) => import('chroma-js').Color} */
const from_jab = pack(pipe(
  jab_to_rgb,
  unpack(chroma.gl),
))

/** @type {(color: import('chroma-js').Color) => [h: number, s: number, l: number]} */
const to_hsluv = pipe(
  get_rgb_from_chroma_color,
  take(3),
  map(c => c / 255),
  rgb_to_hsluv,
)

/** @type {(...args: [h: number, s: number, l: number]) => import('chroma-js').Color} */
const from_hsluv = pack(pipe(
  hsluv_to_rgb,
  unpack(chroma.gl),
))

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

/**
 * monkey patch chroma to support interpolating by jch/jab/hsluv.
 * code courtesy of Adobe
 */
const extendChroma = (chroma) => {
  // JCH
  chroma.Color.prototype.jch = function () { return to.jch(this) };
  chroma.jch = from.jch;

  // JAB
  chroma.Color.prototype.jab = function () { return to.jab(this) };
  chroma.jab = from.jab;

  // HSLuv
  chroma.Color.prototype.hsluv = function () { return to.hsluv(this) };
  chroma.hsluv = from.hsluv;

  const oldInterpol = chroma.interpolate;
  const rgb_to = {
    jch: rgb_to_jch,
    jab: rgb_to_jab,
    hsluv: rgb_to_hsluv,
  };
  const lerpH = (a, b, t) => {
    const m = 360;
    const d = Math.abs(a - b);
    if (d > m / 2) {
      if (a > b) {
        b += m;
      } else {
        a += m;
      }
    }
    return ((1 - t) * a + t * b) % m;
  };

  chroma.interpolate = (col1, col2, f = 0.5, mode = 'lrgb') => {
    if (rgb_to.hasOwnProperty(mode)) {
      if (typeof col1 !== 'object') {
        col1 = new chroma.Color(col1);
      }
      if (typeof col2 !== 'object') {
        col2 = new chroma.Color(col2);
      }
      const xyz1 = rgb_to[mode](col1.gl());
      const xyz2 = rgb_to[mode](col2.gl());
      const grey1 = Number.isNaN(col1.hsl()[0]);
      const grey2 = Number.isNaN(col2.hsl()[0]);
      let X;
      let Y;
      let Z;
      switch (mode) {
        case 'hsluv':
          if (xyz1[1] < 1e-10) {
            xyz1[0] = xyz2[0];
          }
          if (xyz1[1] === 0) { // black or white
            xyz1[1] = xyz2[1];
          }
          if (xyz2[1] < 1e-10) {
            xyz2[0] = xyz1[0];
          }
          if (xyz2[1] === 0) { // black or white
            xyz2[1] = xyz1[1];
          }
          X = lerpH(xyz1[0], xyz2[0], f);
          Y = xyz1[1] + (xyz2[1] - xyz1[1]) * f;
          Z = xyz1[2] + (xyz2[2] - xyz1[2]) * f;
          break;
        case 'jch':
          if (grey1) {
            xyz1[2] = xyz2[2];
          }
          if (grey2) {
            xyz2[2] = xyz1[2];
          }
          X = xyz1[0] + (xyz2[0] - xyz1[0]) * f;
          Y = xyz1[1] + (xyz2[1] - xyz1[1]) * f;
          Z = lerpH(xyz1[2], xyz2[2], f);
          break;
        default:
          X = xyz1[0] + (xyz2[0] - xyz1[0]) * f;
          Y = xyz1[1] + (xyz2[1] - xyz1[1]) * f;
          Z = xyz1[2] + (xyz2[2] - xyz1[2]) * f;
      }
      return chroma[mode](X, Y, Z).alpha(col1.alpha() + f * (col2.alpha() - col1.alpha()));
    }
    return oldInterpol(col1, col2, f, mode);
  };
};
extendChroma(chroma)
export { chroma }
