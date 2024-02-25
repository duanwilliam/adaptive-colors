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

import { denormalize_rgb } from '../utils/color.js'
import { pack, pipe, unpack } from '../utils/fn.js'
import { take } from '../utils/iter.js'

import { hsluv_to_rgb, rgb_to_hsluv } from './spaces/hsluv.js'
import { cam02jab_to_rgb, rgb_to_cam02jab } from './spaces/cam02_jab.js'
import { cam02jch_to_rgb, rgb_to_cam02jch } from './spaces/cam02_jch.js'
import { cam16jab_to_rgb, rgb_to_cam16jab } from './spaces/cam16_jab.js'
import { cam16jch_to_rgb, rgb_to_cam16jch } from './spaces/cam16_jch.js'
import { hct_to_rgb, rgb_to_hct } from './spaces/hct.js'

const take3 = take(3)
const get_rgb_from_chroma_color = color => take3(color._rgb)

// hsluv, cam02jab, and cam02jch operate with normalized rgb values (i.e. in [0, 1]).
// but in this interface we want to work with rgb al

/**
 * given a function that takes some form of rgb values and converts it to another space,
 * produces a function that, given a chroma color, 
 * @returns 
 */
const _to_space = rgb_to_space => pipe(
  get_rgb_from_chroma_color,
  rgb_to_space,
)
const _from_space = space_to_rgb => pack(pipe(
  space_to_rgb,
  unpack(chroma.rgb),
))

/** @type {(color: import('chroma-js').Color) => [j: number, c: number, h: number]} */
const to_cam02jch = _to_space(rgb_to_cam02jch)

/** @type {(...args: [j: number, c: number, h: number]) => import('chroma-js').Color} */
const from_cam02jch = _from_space(cam02jch_to_rgb)

/** @type {(color: import('chroma-js').Color) => [j: number, a: number, b: number]} */
const to_cam02jab = _to_space(rgb_to_cam02jab)

/** @type {(...args: [j: number, a: number, b: number]) => import('chroma-js').Color} */
const from_cam02jab = _from_space(cam02jab_to_rgb)

/** @type {(color: import('chroma-js').Color) => [h: number, s: number, l: number]} */
const to_hsluv = _to_space(rgb_to_hsluv)

/** @type {(...args: [h: number, s: number, l: number]) => import('chroma-js').Color} */
const from_hsluv = _from_space(hsluv_to_rgb)

/** @type {(color: import('chroma-js').Color) => [j: number, c: number, h: number]} */
const to_cam16jch = _to_space(rgb_to_cam16jch)

/** @type {(...args: [j: number, c: number, h: number]) => import('chroma-js').Color} */
const from_cam16jch = _from_space(cam16jch_to_rgb)

/** @type {(color: import('chroma-js').Color) => [j: number, a: number, b: number]} */
const to_cam16jab = _to_space(rgb_to_cam16jab)

/** @type {(...args: [j: number, a: number, b: number]) => import('chroma-js').Color} */
const from_cam16jab = _from_space(cam16jab_to_rgb)

/** @type {(color: import('chroma-js').Color) => [h: number, c: number, t: number]} */
const to_hct = _to_space(rgb_to_hct)

/** @type {(...args: [h: number, c: number, t: number]) => import('chroma-js').Color} */
const from_hct = _from_space(hct_to_rgb)

/** @satisfies {Record<import('./space.js').InternalColorSpace, (...args: Parameters<import('chroma-js').ChromaStatic>) => color: import('chroma-js').Color} */
export const from = {
  hex:      chroma.hex,
  rgb:      chroma.rgb,
  hsl:      chroma.hsl,
  hsv:      chroma.hsv,
  lab:      chroma.lab,
  lch:      chroma.lch,
  oklab:    chroma.oklab,
  oklch:    chroma.oklch,
  hsluv:    from_hsluv,
  cam02jab: from_cam02jab,
  cam02jch: from_cam02jch,
  cam16jab: from_cam16jab,
  cam16jch: from_cam16jch,
  hct:      from_hct,
}

/** @satisfies {Record<import('./space.js').InternalColorSpace, (color: import('chroma-js').Color) => any} */
export const to = {
  hex:      c => c.hex(),
  rgb:      c => c.rgb(),
  hsl:      c => c.hsl(),
  hsv:      c => c.hsv(),
  lab:      c => c.lab(),
  lch:      c => c.lch(),
  oklab:    c => c.oklab(),
  oklch:    c => c.oklch(),
  hsluv:    to_hsluv,
  cam02jab: to_cam02jab,
  cam02jch: to_cam02jch,
  cam16jab: to_cam16jab,
  cam16jch: to_cam16jch,
  hct:      to_hct,
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
  // CAM02 JCH
  chroma.Color.prototype.cam02jch = function () { return to.cam02jch(this) };
  chroma.cam02jch = from.cam02jch;

  // CAM02 JAB
  chroma.Color.prototype.cam02jab = function () { return to.cam02jab(this) };
  chroma.cam02jab = from.cam02jab;

  // HSLuv
  chroma.Color.prototype.hsluv = function () { return to.hsluv(this) };
  chroma.hsluv = from.hsluv;

  // CAM16 JCH
  chroma.Color.prototype.cam16jch = function () { return to.cam16jch(this) };
  chroma.cam16jch = from.cam16jch;

  // CAM16 JAB
  chroma.Color.prototype.cam16jab = function () { return to.cam16jab(this) };
  chroma.cam16jab = from.cam16jab;

  // HCT
  chroma.Color.prototype.hct = function () { return to.hct(this) };
  chroma.hct = from.hct;

  const oldInterpol = chroma.interpolate;
  const rgb_to = {
    cam02jch: rgb_to_cam02jch,
    cam02jab: rgb_to_cam02jab,
    hsluv: rgb_to_hsluv,
    cam16jch: rgb_to_cam16jch,
    cam16jab: rgb_to_cam16jab,
    hct: rgb_to_hct,
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
      const xyz1 = rgb_to[mode](denormalize_rgb(col1.gl()));
      const xyz2 = rgb_to[mode](denormalize_rgb(col2.gl()));
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
        case 'cam02jch':
        case 'cam16jch':
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
