import { map } from './iter.js'

export const normalize_rgb_component = c => c / 255

export const denormalize_rgb_component = c => c * 255

/**
 * normalizes [0, 255]-bounded rgb values to [0, 1] 
 */
export const normalize_rgb = map(normalize_rgb_component)

/**
 * maps normalized rgb values from [0, 1] to [0, 255]
 */
export const denormalize_rgb = map(denormalize_rgb_component)