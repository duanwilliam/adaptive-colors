export type ColorSpace =
    | "cam02"
    | "cam02p"
    | "hex"
    | "rgb"
    | "hsl"
    | "hsluv"
    | "lab"
    | "lch"
    | "oklab"
    | "oklch"

export type InterpolationColorSpace = Extract<ColorSpace,
    | "cam02"
    | "cam02p"
    | "rgb"
    | "hsl"
    | "hsluv"
    | "lab"
    | "lch"
    | "oklab"
    | "oklch"
>

export type ContrastAlgorithm =
    | "wcag2"
    | "wcag3"

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
        output_format?: ColorSpace
    })

    get colors(): Color[]
    get background_color(): Color
    get lightness(): number
    get contrast(): number
    get saturation(): number | null
    get algorithm(): ContrastAlgorithm
    get output_format(): ColorSpace
    get background_color_value(): string

    with_colors(colors: Color[]): this
    with_background_color(background_color: Color | string): this
    with_lightness(lightness: number): this
    with_contrast(contrast: number): this
    with_saturation(saturation: number | null): this
    with_algorithm(algorithm: ContrastAlgorithm): this
    with_output_format(fmt: ColorSpace): this

    palette(output_format?: ColorSpace): {
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
        output_format: ColorSpace
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