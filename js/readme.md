# adaptive colors

adaptive color palettes

built upon Adobe's [Leonardo](https://github.com/adobe/leonardo)

## motivation

_"why do this when Adobe's already got Leonardo?"_

tl;dr

- when it was written, the latest working version of `@adobe/leonardo-contrast-colors` was `1.0.0-alpha.13`, even though version-wise it had reached`1.0.0-alpha.17`
- it doesn't support oklab/oklch
- why not send in a pr then?
    - sorry Leonardo maintainers, but that code was an absolute horror to read through - it's hard to track what's going on
    - this sort of library, which is in large parts pertaining to data transformation, imo lends well to functional programming, so i figured it'd be interesting to explore writing javascript in a much more functional style (unfortunately, limitations in js and ts made getting everything typed well quite unwieldy)
    - and so sending in a pr would take prohibitively long, if it ever got accepted at all, since what i ended up writing involved a massive paradigmal shift in how the code was written. it also didn't help that adobe's repo was apparently under some sort of refactoring of its own

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
    background_color: gray,
});

/*
colors  - theme colors as json
pairs   - theme colors as flat key:value map
values  - theme colors as list
*/
const { colors, pairs, values } = theme.palette()
```

### interpolation color spaces

colors can be interpolated along a variety of possible color spaces

| color space | description                                |
| ----------- | ------------------------------------------ |
| `'rgb'`     | rgb color space                            |
| `'hsl'`     | hsl representation in rgb color space      |
| `'hsv'`     | hsv representation in rgb color space      |
| `'hsluv'`   | hsluv color space                          |
| `'lab'`     | cielab color space                         |
| `'lch'`     | polar representation in cielab color space |
| `'oklab'`   | oklab color space                          |
| `'oklch'`   | polar representation in oklab color space  |
| `'cam02'`   | ciecam02-ucs color appearance model        |
| `'cam02p'`  | ciecam02 color appearance model            |
| `'cam16'`   | ciecam16-ucs color appearance model        |
| `'cam16p'`  | ciecam16 color appearance model            |
| `'hct'`     | hct color space                            |

### output formats

_this section is adapted from but taken nearly verbatim from Adobe Leonardo's readme_

available output formats conform to the [W3C CSS Color Module Level 4]((https://www.w3.org/TR/css-color-4/)) spec for the supported options, as listed below:

| output option       | sample value             |
| ------------------- | ------------------------ |
| `'hex'`             | `#RRGGBB`                |
| `'rgb'` _(default)_ | `rgb(255, 255, 255)`     |
| `'hsl'`             | `hsl(360deg, 0%, 100%)`  |
| `'lab'`             | `lab(100%, 0, 0)`        |
| `'lch'`             | `lch(100%, 0, 360deg)`   |
| `'oklab'`           | `oklab(100%, 0, 0)`      |
| `'oklch'`           | `oklch(100%, 0, 360deg)` |