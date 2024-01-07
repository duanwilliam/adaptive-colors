import { Hsluv } from 'hsluv'

const conv = new Hsluv()

/** @type {(rgb: [r: number, g: number, b: number]) => [h: number, s: number, l: number]} */
export function rgb_to_hsluv([r, g, b]) {
  conv.rgb_r = r
  conv.rgb_g = g
  conv.rgb_b = b
  conv.rgbToHsluv()
  return [conv.hsluv_h, conv.hsluv_s, conv.hsluv_l]
}

/** @type {(hsluv: [h: number, s: number, l: number]) => [r: number, g: number, b: number]} */
export function hsluv_to_rgb([h, s, l]) {
  conv.hsluv_h = h
  conv.hsluv_s = s
  conv.hsluv_l = l
  conv.hsluvToRgb()
  return [conv.rgb_r, conv.rgb_g, conv.rgb_b]
} 
