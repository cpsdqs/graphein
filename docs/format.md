# Graphein Serialized Format
## 1.0.0
### Structure
The root Object must always be an Object with the following properties:

| Name    | Type   | Description |
| ------- | ------ | ----------- |
| version | str    | The semantic versioning number this image was generated with
| w       | uint16 | Width of the image
| h       | uint16 | Height of the image
| c       | arr    | Content. An array of layers, see below

#### Layer
A layer may contain other layers or even draw content itself. Every layer must have the following properties:

| Name | Type | Description |
| ---- | ---- | ----------- |
| t    | str  | Type. The layer's type, see below
| a    | arr  | Affine transform, see below.
| c    | arr  | Content. An array of sublayers.

Sublayers should be drawn in order, i.e. the last item will always be on top.

The affine transform can either be an empty array, an array of 6 float32s or an array of 12 float32s. If it has 6 entries, it represents the following 2D transformation matrix (where each letter is an entry in an alphabetically sorted argument list):
```
a c e
b d f
0 0 1
```
If it has 12 entries, it represents the following 3D transformation matrix:
```
a d g j
b e h k
c f i l
0 0 0 1
```

#### Layer Types
##### Group `g`
Group layers do nothing by themselves. Empty group layers should be avoided.

##### Path `p`
A path draws an arbitrary path using a compact version of the SVG path `d` syntax. It adds the following properties:

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| s    | color or nil   | Stroke color. See color for more info
| f    | color or nil   | Fill color
| d    | arr            | Data. An array of path instructions. See below
| e    | uint8 or nil   | Line cap. `0` for butt, `1` for round, `2` for projecting. Will be inherited
| j    | uint8 or nil   | Line join. `0` for bevel, `1` for round, `2` for miter. Will be inherited
| m    | float32 or nil | Miter limit for miter line joins. Will be inherited

###### Instructions
Every instruction is an array. The first entry is always the type as a uint8:

- `0x00` Close path (Z)
- `0x10` Move (M)
- `0x11` Move relative (m)
- `0x20` Line (L)
- `0x21` Line relative (l)
- `0x30` Cubic Bézier curve (C)
- `0x31` Cubic Bézier curve relative (c)
- `0x32` Cubic Bézier shortcut (S)
- `0x33` Cubic Bézier shortcut relative (s)
- `0x40` Quadratic Bézier curve (Q)
- `0x41` Quadratic Bézier curve relative (q)
- `0x42` Quadratic Bézier shortcut (T)
- `0x43` Quadratic Bézier shortcut relative (t)
- `0x50` Arc (A)
- `0x51` Arc relative (a)
- `0x60` Stroke width: Line (pos, value left, value right)
- `0x61` Stroke width: Line relative (relative pos, relative value left, relative value right)
- `0x62` Stroke width: Cubic Bézier (pos, left c1x, c1y, c2x, c2y, value, right c1x, c1y, c2x, c2y, value)
- `0x63` Stroke width relative: Cubic Bézier (pos, left c1x, c1y, c2x, c2y, value, right c1x, c1y, c2x, c2y, value)

The rest of the entries are float32s of the arguments in the order as used in SVG paths.

A stroke width instruction should appear at least once in the beginning before any line is drawn, though if not, no stroke should be drawn until one does appear. The stroke width is a one-dimensional bézier or linear curve and should be interpreted as a function that maps a position on the stroke to its width.

##### Clipping Mask `c`
A clipping mask adds the following properties:

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| d    | arr   | Data. An array of path instructions. See path instructions
| o    | uint8 | Operation. `0` to cut what's outside, `1` to cut what's inside

A clipping mask will be applied to all layers after the clipping mask. Multiple clipping masks can be applied at once. They can't be reset, but will only act within their scope, i.e. group.

##### Shape: Rectangle `sr`
A rectangle adds the following properties:

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| x    | float32        | X position
| y    | float32        | Y position
| w    | float32        | Width
| h    | float32        | Height
| f    | color or nil   | Fill color. See color for more info
| s    | color or nil   | Stroke color
| l    | float32        | Stroke width
| c    | uint8 or nil   | Line cap. `0` for butt, `1` for round, `2` for projecting. Will be inherited
| j    | uint8 or nil   | Line join. `0` for bevel, `1` for round, `2` for miter. Will be inherited
| m    | float32 or nil | Miter limit for miter line joins. Will be inherited

##### Shape: Circle `sc`
A circle adds the following properties:

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| x    | float32        | X position
| y    | float32        | Y position
| r    | float32        | Radius
| f    | color or nil   | Fill color. See color for more info
| s    | color or nil   | Stroke color
| l    | float32        | Stroke width

##### Text `t`
A text object adds the following properties:

| Name | Type           | Description |
| ---- | -------------- | ----------- |
| x    | float32        | X position
| y    | float32        | Y position
| w    | float32 or nil | Width. If not nil, the text will wrap at the specified width
| f    | color or nil   | Fill color. See color for more info
| s    | color or nil   | Stroke color
| m    | str            | Font. A CSS Level 3 `font` string

##### Raster Image `b`
A raster image object adds the following properties:

| Name | Type    | Description |
| ---- | ------- | ----------- |
| x    | float32 | X position
| y    | float32 | Y position
| w    | float32 | Width
| h    | float32 | Height
| m    | str     | Image mime type
| d    | bin32   | Image binary blob

The image mime type can be any of the following:

- `image/png`
- `image/gif` (not animated)
- `image/bmp`
- `image/jpeg`
- `image/webp`

### Color Format
Colors are specified using an unsigned 32-bit integer.

| Byte  | Description |
| ----- | ----------- |
| LSB   | The inverse alpha. 0 for opaque, 255 for transparent.
| 1     | The red component. 0 for none, 255 for full.
| 2     | The green component.
| MSB   | The blue component.
