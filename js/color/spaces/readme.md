functions for converting color spaces from/to rgb.

a given file should export at least two functions: 
- `rgb_to_space`, which takes in an array of rgb components in [0, 255] and returns an array of the component values in the new color space
- `space_to_rgb`, which takes in an array of space components (in the same format as the output of `rgb_to_space`) and returns an array of rgb components in [0, 255] 