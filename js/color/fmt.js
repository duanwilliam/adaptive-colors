import { map_nan_to_zero, round } from '../math/math.js'
import { map, zip } from '../utils/iter.js'
import { pipe, id } from '../utils/fn.js'
import { chroma, to } from './chroma.js'
import { COLOR_SPACES } from './space.js'

// number transformations

/** @type {(n: number) => number} */
const m100 = n => n * 100
/** @type {(n: number) => number} */
const d100 = n => n / 100
/** @type {(d: number) => (n: number) => number} */
const rnd = d => n => round(n, d)

// stringifying

/** @type {<N extends number>(n: N) => `${N}%`} */
const pct = n => `${n}%`
/** @type {<N extends number>(n: N) => `${N}deg`} */
const deg = n => `${n}deg`

const sca_to_sca = rnd(2) // scalar to scalar
const sca_to_pct = pipe(m100, rnd(0), pct) // scalar to percent
const val_to_pct = pipe(rnd(0), pct) // value to percent
const val_to_val = rnd(0) // value to value
const val_to_deg = pipe(rnd(0), deg) // value to degree

/**
 * @template {Array<import('../utils/fn.js').Fn1<number, number | string>>} Fs
 * @template {number[]} C
 * @param {Fs} fmts 
 * @param {C} color 
 * @returns 
 */
const ap = (fmts, color) => zip([fmts, color]).map(([f, c]) => f(c))

/**
 * defines how to transform the result of `chroma(color).<colorspace>()` into a valid css string for it
 * @satisfies {Partial<Record<import('./space.js').InternalOutputColorSpace, number[]>> }>}
 */
const COLOR_SPACE_FORMATTERS = {
  // hex:    'hex', // hex is a string and handled separately
  rgb:    [id, id, id],
  hsl:    [val_to_deg, sca_to_pct, sca_to_pct],
  lab:    [val_to_pct, val_to_val, val_to_val],
  lch:    [val_to_pct, val_to_val, val_to_deg],
  oklab:  [sca_to_pct, sca_to_sca, sca_to_sca],
  oklch:  [sca_to_pct, sca_to_sca, val_to_deg],
}

/**
 * 
 * @param {string} color 
 * @param {import('./space.js').OutputColorSpace} output_format 
 */
export function fmt_color(color, output_format) {
  const space = COLOR_SPACES[output_format]
  
  if (space === 'hex') { return to.hex(chroma(color)) }
  
  if (COLOR_SPACE_FORMATTERS.hasOwnProperty(space)) {
    return pipe(
      space => ap(
        COLOR_SPACE_FORMATTERS[space],
        to[space](chroma(color)).map(map_nan_to_zero)
      ),
      map(String),
      xs => `${space}(${xs.join(', ')})`
    )(space)
  }
  throw new Error('unrecognized format')
}