/**
 * CIECAM02
 */

import { cam02jch_to_rgb, rgb_to_cam02jch } from './cam02_jch.js'

import { pipe } from '../../utils/fn.js'
import { denormalize_rgb, normalize_rgb } from '../../utils/color.js'

const coefs = { k_l: 1, c1: 0.007, c2: 0.0228 }
const pi = Math.PI
const CIECAM02_la = (64 / pi) / 5
const CIECAM02_k = 1 / ((5 * CIECAM02_la) + 1)
const CIECAM02_fl = (0.2 * (CIECAM02_k ** 4) * (5 * CIECAM02_la)) + 0.1 * ((1 - (CIECAM02_k ** 4)) ** 2) * ((5 * CIECAM02_la) ** (1 / 3))

/** @type {(jch: [j: number, c: number, h: number]) => [j: number, a: number, b: number]} */
export function jch_to_jab([J, C, h]) {
  const M = C * (CIECAM02_fl ** 0.25)
  let j = ((1 + 100 * coefs.c1) * J) / (1 + coefs.c1 * J)
  j /= coefs.k_l
  const M_prime = (1 / coefs.c2) * Math.log(1.0 + coefs.c2 * M)
  const a = M_prime * Math.cos(h * (pi / 180))
  const b = M_prime * Math.sin(h * (pi / 180))
  return [j, a, b]
}

/** @type {(jab: [j: number, a: number, b: number]) => [j: number, c: number, h: number]} */
export function jab_to_jch([j, a, b]) {
  const new_M_prime = Math.sqrt(a * a + b * b)
  const new_M = (Math.exp(new_M_prime * coefs.c2) - 1) / coefs.c2
  const h = ((180 / pi) * Math.atan2(b, a) + 360) % 360
  const C = new_M / (CIECAM02_fl ** 0.25)
  const J = j / (1 + coefs.c1 * (100 - j))
  return [J, C, h]
}

/** @type {(jab: [j: number, a: number, b: number]) => [r: number, g: number, b: number]} */
export const cam02jab_to_rgb = pipe(
  jab_to_jch,
  cam02jch_to_rgb,
  denormalize_rgb,
)

/** @type {(rgb: [r: number, g: number, b: number]) => [j: number, a: number, b: number]} */
export const rgb_to_cam02jab = pipe(
  normalize_rgb,
  rgb_to_cam02jch,
  jch_to_jab,
)
