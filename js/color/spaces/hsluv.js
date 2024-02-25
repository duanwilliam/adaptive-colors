import { Hsluv } from 'hsluv'
import { denormalize_rgb, normalize_rgb } from '../../utils/color.js'

const conv = new Hsluv()

/** @type {(hsluv: [h: number, s: number, l: number]) => [r: number, g: number, b: number]} */
export function hsluv_to_rgb([h, s, l]) {
  conv.hsluv_h = h
  conv.hsluv_s = s
  conv.hsluv_l = l
  conv.hsluvToRgb()
  return denormalize_rgb([conv.rgb_r, conv.rgb_g, conv.rgb_b])
}

/** @type {(rgb: [r: number, g: number, b: number]) => [h: number, s: number, l: number]} */
export function rgb_to_hsluv(rgb) {
  const [r, g, b] = normalize_rgb(rgb)
  conv.rgb_r = r
  conv.rgb_g = g
  conv.rgb_b = b
  conv.rgbToHsluv()
  return [conv.hsluv_h, conv.hsluv_s, conv.hsluv_l]
}
