import { Cam16, argbFromRgb, rgbaFromArgb } from '@material/material-color-utilities'

import { pipe, unpack } from '../../utils/fn.js'

/** @type {(jch: [j: number, c: number, h: number]) => [r: number, g: number, b: number]} */
export const cam16jch_to_rgb = pipe(
  unpack(Cam16.fromJch),
  cam16 => cam16.toInt(),
  rgbaFromArgb,
  ({r,g,b}) => [r, g, b],
)

/** @type {(rgb: [r: number, g: number, b: number]) => [j: number, c: number, h: number]} */
export const rgb_to_cam16jch = pipe(
  unpack(argbFromRgb),
  Cam16.fromInt,
  cam16 => [cam16.j, cam16.chroma, cam16.hue],
)