import { Cam16, argbFromRgb, rgbaFromArgb } from '@material/material-color-utilities'

import { pipe, unpack } from '../../utils/fn.js'

/** @type {(jab: [j: number, a: number, b: number]) => [r: number, g: number, b: number]} */
export const cam16jab_to_rgb = pipe(
  unpack(Cam16.fromUcs),
  cam16 => cam16.toInt(),
  rgbaFromArgb,
  ({r,g,b}) => [r, g, b],
)

/** @type {(rgb: [r: number, g: number, b: number]) => [j: number, a: number, b: number]} */
export const rgb_to_cam16jab = pipe(
  unpack(argbFromRgb),
  Cam16.fromInt,
  cam16 => [cam16.jstar, cam16.astar, cam16.bstar],
)
