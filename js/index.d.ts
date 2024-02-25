export type ColorSpace =
    | "hex"
    | "rgb"
    | "hsl"
    | "hsv"
    | "hsluv"
    | "lab"
    | "lch"
    | "oklab"
    | "oklch"
    | "cam02"
    | "cam02p"
    | "cam16"
    | "cam16p"
    | "hct"

export type InterpolationColorSpace = Extract<ColorSpace,
    | "rgb"
    | "hsl"
    | "hsv"
    | "hsluv"
    | "lab"
    | "lch"
    | "oklab"
    | "oklch"
    | "cam02"
    | "cam02p"
    | "cam16"
    | "cam16p"
    | "hct"
>

export type OutputColorSpace = Extract<ColorSpace,
    | "hex"
    | "rgb"
    | "hsl"
    | "lab"
    | "lch"
    | "oklab"
    | "oklch"
>

export type ContrastAlgorithm =
    | "wcag2"
    | "wcag3"

type LightnessDistribution = 
    | 'linear'
    | 'polynomial'
    | 'parabola'

type Ratios = number[] | Record<string, number>

export class Color {
    constructor({ name, key_colors, color_space, ratios, smooth, saturation }: {
        name: string
        key_colors: string[]
        color_space: InterpolationColorSpace
        ratios: Ratios
        smooth?: boolean
        saturation?: number | null
    })
    clone(): Color

    get name(): string
    get key_colors(): string[]
    get resolved_key_colors(): string[]
    get color_space(): InterpolationColorSpace
    get ratios(): Ratios
    get saturation(): number | null
    get smooth(): boolean

    with_name(name: string): this
    with_key_colors(key_colors: string[]): this
    with_color_space(color_space: InterpolationColorSpace): this
    with_ratios(ratios: Ratios): this
    with_smooth(smooth: boolean): this
    with_saturation(saturation?: number | null): this

    get_color_scale(granularity?: number): (d: number) => import('chroma-js').Color

    to_object(): {
        name: string
        key_colors: string[]
        color_space: InterpolationColorSpace
        ratios: Ratios
        smooth: boolean
        saturation: number | null
    }
    #private
}

export class Theme {
    constructor(opts: {
        colors: Color[]
        background_color: Color | string
        lightness?: number
        contrast?: number
        saturation?: number | null
        algorithm?: ContrastAlgorithm
        output_format?: OutputColorSpace
    })

    get colors(): Color[]
    get background_color(): Color
    get lightness(): number
    get contrast(): number
    get saturation(): number | null
    get algorithm(): ContrastAlgorithm
    get output_format(): OutputColorSpace
    get background_color_value(): string

    with_colors(colors: Color[]): this
    with_background_color(background_color: Color | string): this
    with_lightness(lightness: number): this
    with_contrast(contrast: number): this
    with_saturation(saturation: number | null): this
    with_algorithm(algorithm: ContrastAlgorithm): this
    with_output_format(fmt: OutputColorSpace): this

    palette(output_format?: OutputColorSpace): {
        colors: [OutputBackgroundColor, ...OutputColor[]]
        color_pairs: Record<string, string>
        color_values: string[]
    }

    to_object(): {
        colors: Color[]
        background_color: Color
        lightness: number
        contrast: number
        saturation: number | null
        algorithm: ContrastAlgorithm
        output_format: OutputColorSpace
        background_color_value: string
    }
    #private
}

export type OutputColor = {
    name: string
    values: {
        name: string
        contrast: number
        value: string
    }[]
}

export type OutputBackgroundColor = {
    background: string
}

export function contrast(
    color: [r255: number, g255: number, b255: number],
    base: [r255: number, g255: number, b255: number],
    base_v?: number | undefined,
    algorithm?: ContrastAlgorithm,
): number

export function luminance(color: [r255: number, g255: number, b255: number], algorithm?: ContrastAlgorithm): number

export function ratio_names(ratios: number[], algorithm: ContrastAlgorithm): string[]

export function is_positive_ratio(algorithm: ContrastAlgorithm): (r: number) => boolean

export function min_positive_ratio(ratios: number[], algorithm: ContrastAlgorithm): number

export function fmt_color(color: string, output_format: OutputColorSpace): string

export function color_scale<AsFn extends boolean = false>(
    granularity: number,
    key_colors: string[],
    color_space: InterpolationColorSpace,
    opts?: {
        shift?: number
        full_scale?: boolean
        smooth?: boolean
        distribute_lightness?: LightnessDistribution
        sort_color?: boolean
        as_fn?: AsFn
    }
): AsFn extends false ? string[] : (d: number) => import('chroma-js').Color