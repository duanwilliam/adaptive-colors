import { illuminant, workspace, xyz as _xyz } from 'ciebase'
import ciecam02 from 'ciecam02'

import { pipe } from '../../utils/fn.js'
import { denormalize_rgb, normalize_rgb } from '../../utils/color.js'

const cam = ciecam02.cam({
  whitePoint: illuminant.D65,
  adaptingLuminance: 40,
  backgroundLuminance: 20,
  surroundType: 'average',
  discounting: false,
}, ciecam02.cfs('JCh'))


const xyz = _xyz(workspace.sRGB, illuminant.D65)

/** @type {(jch: [j: number, c: number, h: number]) => [r: number, g: number, b: number]} */
export const cam02jch_to_rgb = pipe(
  ([J, C, h]) => cam.toXyz({ J, C, h }),
  xyz.toRgb,
  denormalize_rgb,
)

/** @type {(rgb: [r: number, g: number, b: number]) => [j: number, c: number, h: number]} */
export const rgb_to_cam02jch = pipe(
  normalize_rgb,
  xyz.fromRgb,
  cam.fromXyz,
  ({ J, C, h }) => [J, C, h]
)