import { Hct, argbFromRgb, rgbaFromArgb } from '@material/material-color-utilities'

import { pipe, unpack } from '../../utils/fn.js'

/** @type {(hct: [h: number, c: number, t: number]) => [r: number, g: number, b: number]} */
export const hct_to_rgb = pipe(
  unpack(Hct.from),
  hct => hct.toInt(),
  rgbaFromArgb,
  ({r,g,b}) => [r, g, b],
)

/** @type {(rgb: [r: number, g: number, b: number]) => [h: number, c: number, t: number]} */
export const rgb_to_hct = pipe(
  unpack(argbFromRgb),
  Hct.fromInt,
  hct => [hct.hue, hct.chroma, hct.tone],
)