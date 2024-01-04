# adaptive colors

adaptive color palettes

built upon Adobe's [Leonardo](https://github.com/adobe/leonardo)

## motivation

_"why do this when Adobe's already got Leonardo?"_

tl;dr

- as of writing this, the latest working version of `@adobe/leonardo-contrast-colors` is `1.0.0-alpha.13` (it's currently on `1.0.0-alpha.17`)
- it doesn't support oklab/oklch
- why not send in a pr then?  well, sorry Leonardo maintainers, but that code was an absolute horror to read through

adobe's official package for adaptive color palettes is broken, missing support for oklab/oklch, and the code is miserable to work with.

i want to create adaptive color palettes that target oklch.
i do not want to work within the constraints of their code, and wait all that time for a pr to be accepted (and for the package to get unborked).

rewriting the whole thing lets me create an api that i prefer, _and_ allows for clearer expression of data flow and transformation.

## installation

this package requires Node `>=20.0.0`.
for the most up to date information, see `package.json :: engines.node`.

```
npm i adaptive-colors
```

## usage

this section's code examples are adapted from Adobe Leonardo's readme

```js
import { Color, Theme } from "adaptive-colors";

const grey = new Color({
    name: 'grey',
    key_colors: ['#cacaca'],
    ratios: [2, 3, 4.5, 8]
});

const blue = new Color({
    name: 'blue',
    key_colors: ['#5CDBFF', '#0000FF'],
    ratios: [3, 4.5]
});

const red = new Color({
    name: 'red',
    key_colors: ['#FF9A81', '#FF0000'],
    ratios: [3, 4.5]
});

const theme = new Theme({
    colors: [gray, blue, red],
    backgroundColor: gray,
    lightness: 97
});

/*
colors  - theme colors as json
pairs   - theme colors as flat key:value map
values  - theme colors as list
*/
const { colors, pairs, values } = theme.get_contrast_colors()
```

### supported output formats

_this section is adapted from but taken nearly verbatim from Adobe Leonardo's readme_

available output formats conform to the [W3C CSS Color Module Level 4]((https://www.w3.org/TR/css-color-4/)) spec for the supported options, as listed below:

| output option       | sample value             |
| ------------------- | ------------------------ |
| `'hex'`             | `#RRGGBB`                |
| `'rgb'` _(default)_ | `rgb(255, 255, 255)`     |
| `'hsl'`             | `hsl(360deg, 0%, 100%)`  |
| `'hsv'`             | `hsv(360deg, 0%, 100%)`  |
| `'hsluv'`           | `hsluv(360, 0, 100)`     |
| `'lab'`             | `lab(100%, 0, 0)`        |
| `'lch'`             | `lch(100%, 0, 360deg)`   |
| `'oklab'`           | `oklab(100%, 0, 0)`      |
| `'oklch'`           | `oklch(100%, 0, 360deg)` |
| `'cam02'`           | `jab(100%, 0, 0)`        |
| `'cam02p'`          | `jch(100%, 0, 360deg)`   |
