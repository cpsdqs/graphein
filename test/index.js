document.body.style.background = '#eee'

const canvas = new (window.graphein.Canvas)()
canvas.style.position = 'relative'
canvas.style.display = 'inline-block'
canvas.canvas.style.background = '#fff'
canvas.canvas.style.borderRadius = '4px'
canvas.overlay.style.position = 'absolute'
canvas.overlay.style.top = canvas.overlay.style.left = 0
document.body.appendChild(canvas)

const serialized = {
  version: '0.0.0',
  w: 500,
  h: 500,
  d: 100,
  c: [
    {
      t: 'g',
      c: [
        {
          t: 'p',
          d: [
            [32, 43, 35],
            [48, 43, 31.482, 36.725, 24.137, 31, 27],
            [48, 26.912, 29.043, 25.379, 33.860, 24, 38],
            [48, 23.328, 40.015, 21.424, 48.712, 24, 50],
            [48, 30.781, 53.390, 37.858, 45.282, 41, 39],
            [48, 41.519, 37.961, 43.305, 32.305, 42, 31],
            [48, 41.491, 30.491, 40.347, 41.611, 40, 43],
            [48, 37.928, 51.287, 37.699, 59.600, 34, 67],
            [48, 31.828, 71.342, 22.776, 70.776, 20, 68],
            [48, 17.830, 65.830, 20, 60.479, 20, 58]
          ],
          l: [
            [16, 0, 3],
            [32, 136, 3]
          ],
          r: [
            [16, 0, 3],
            [32, 135, 3]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 49, 31],
            [48, 47.969, 31, 47, 45.838, 47, 48],
            [48, 47, 49.699, 46, 53, 46, 53],
            [48, 46, 53, 46.594, 43.810, 47, 43],
            [48, 49.664, 37.670, 56.566, 33.433, 60, 30],
            [48, 61.565, 28.434, 65, 29.026, 65, 31]
          ],
          l: [
            [16, 0, 3],
            [32, 57, 3]
          ],
          r: [
            [16, 0, 3],
            [32, 57, 3]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 77, 36],
            [48, 77, 31.198, 72.177, 28.822, 68, 33],
            [48, 64.208, 36.791, 60.224, 47.224, 65, 52],
            [48, 68.392, 55.392, 80.747, 40.505, 82, 38],
            [48, 82.625, 36.749, 81.720, 29.279, 81, 30],
            [48, 73.258, 37.741, 80.699, 59.300, 92, 48]
          ],
          l: [
            [16, 0, 3],
            [32, 98, 3]
          ],
          r: [
            [16, 0, 3],
            [32, 98, 3]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 95, 32],
            [48, 95, 42.362, 93, 51.463, 93, 62],
            [48, 93, 62.743, 92, 71, 92, 71],
            [48, 92, 71, 91.854, 61.436, 92, 61],
            [48, 94.604, 53.186, 95.443, 35.778, 103, 32],
            [48, 104.885, 31.057, 114.261, 39.477, 112, 44],
            [48, 107.901, 52.196, 95, 57.757, 95, 46]
          ],
          l: [
            [16, 0, 3],
            [32, 128, 3]
          ],
          r: [
            [16, 0, 3],
            [32, 128, 3]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 122, 15],
            [48, 122, 23.216, 118, 35.047, 118, 45],
            [48, 118, 46.884, 117, 54, 117, 54],
            [48, 117, 54, 116.875, 50.249, 117, 50],
            [48, 119.243, 45.513, 121.141, 39.929, 125, 38],
            [48, 125.932, 37.533, 128.381, 34.381, 130, 36],
            [48, 135.150, 41.150, 121.899, 54, 136, 54],
            [48, 136.886, 54, 138.066, 52.933, 139, 52],
            [48, 140.333, 50.666, 141.666, 49.333, 143, 48]
          ],
          l: [
            [16, 0, 3],
            [32, 97, 3]
          ],
          r: [
            [16, 0, 3],
            [32, 97, 3]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 143, 45],
            [48, 143, 46.050, 147.062, 46.937, 148, 46],
            [48, 150.401, 43.598, 158.651, 35.825, 151, 32],
            [48, 147.638, 30.319, 144.066, 35.867, 143, 38],
            [48, 137.969, 48.061, 144.122, 58.438, 155, 53],
            [48, 157.252, 51.873, 159.032, 49.967, 161, 48]
          ],
          l: [
            [16, 0, 3],
            [32, 68, 3]
          ],
          r: [
            [16, 0, 3],
            [32, 69, 3]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 167, 32],
            [48, 167, 38.203, 166, 43.728, 166, 50],
            [48, 166, 52.556, 165, 58.906, 165, 58]
          ],
          l: [
            [16, 0, 3],
            [32, 24, 3],
            [32, 26, 1]
          ],
          r: [
            [16, 0, 3],
            [32, 24, 3],
            [32, 26, 1]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 179, 31],
            [48, 179, 37.335, 176, 44.811, 176, 51],
            [48, 176, 51.308, 176, 58, 176, 58],
            [48, 176, 58, 176.763, 51.472, 177, 51],
            [48, 179.568, 45.863, 184.054, 37.945, 187, 35],
            [48, 189.391, 32.608, 190, 37.933, 190, 39],
            [48, 190, 43.258, 186.969, 50.938, 189, 55],
            [48, 191.586, 60.173, 204, 54.886, 204, 50]
          ],
          l: [
            [16, 0, 1],
            [32, 1, 2.5],
            [32, 2, 3],
            [32, 75, 3],
            [32, 86, 1]
          ],
          r: [
            [16, 0, 1],
            [32, 1, 2.5],
            [32, 2, 3],
            [32, 75, 3],
            [32, 86, 1]
          ],
          s: 0
        },
        {
          t: 'p',
          d: [
            [32, 169, 24],
            [48, 170.651, 24, 170.988, 21.011, 172, 20],
            [48, 173.101, 18.898, 176, 19.737, 176, 18]
          ],
          l: [
            [16, 3, 3]
          ],
          r: [
            [16, 3, 3]
          ],
          s: 0
        }
      ]
    }
  ]
}

const image = canvas.image = window.graphein.Image.deserialize(serialized)

let bitmap = new graphein.Bitmap()
bitmap.width = 500
bitmap.height = 250
bitmap.transform.type = 1
bitmap.transform.data = [1, 0, 0, 1, 0, 250]
bitmap.ctx.font = '24px sans-serif'
bitmap.ctx.fillText('Bitmap!', 10, 24)
bitmap.ctx.font = '16px monospace'
bitmap.ctx.fillText('Vector: editor.currentLayer = image.children[0]', 10, 44)
bitmap.ctx.fillText('Bitmap: editor.currentLayer = image.children[1]', 10, 60)
bitmap.ctx.beginPath()
bitmap.ctx.moveTo(0, 0)
bitmap.ctx.lineTo(500, 0)
bitmap.ctx.stroke()
image.appendChild(bitmap)

const editor = new (window.graphein.Editor)(canvas)

canvas.render()

{
  // svg import
  const div = document.createElement('div')
  document.body.appendChild(div)
  const input = document.createElement('textarea')
  input.placeholder = 'Paste SVG'
  input.style.fontFamily = 'Inconsolata, monospace'
  div.appendChild(input)
  const button = document.createElement('button')
  button.textContent = 'Insert'
  div.appendChild(button)

  const parseColor = (color) => {
    let match

    if ((match = color.match(/^#([\da-f]{6})$/i))) {
      return [
        parseInt(match[1].substr(0, 2), 16) / 0xff,
        parseInt(match[1].substr(2, 2), 16) / 0xff,
        parseInt(match[1].substr(4, 2), 16) / 0xff,
        1
      ]
    }
    if ((match = color
      .match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*(\d+))?\s*\)$/i))) {
      return [
        +match[1] / 0xff,
        +match[2] / 0xff,
        +match[3] / 0xff,
        match[4] ? +match[4] / 0xff : 1
      ]
    }

    return [0, 0, 0, 0]
  }

  const parseLength = length => {
    // TODO: units
    return Number.isFinite(length) ? length : +length.replace(/[^-\d.]/g, '')
  }

  const pathCommands = {
    M: 0x10,
    m: 0x11,
    L: 0x20,
    l: 0x21,
    C: 0x30,
    c: 0x31,
    A: 0x50,
    a: 0x51
  }

  const commandLengths = {
    M: 2,
    m: 2,
    L: 2,
    l: 2,
    C: 6,
    c: 6,
    A: 5,
    a: 5
  }

  const searchSVG = function (node, context) {
    if (!context) {
      context = {
        fillStyle: '#000000',
        strokeStyle: 'none',
        strokeWidth: 0
      }
    }
    for (let child of node.children) {
      if (child instanceof SVGPathElement) {
        let strokeWidth = child.getAttribute('stroke-width') || child.style.strokeWidth || context.strokeWidth
        let fillStyle = child.getAttribute('fill') || child.style.fill || context.fillStyle
        let strokeStyle = child.getAttribute('stroke') || child.style.stroke || context.strokeStyle

        let path = new graphein.Path()
        path.fill = new graphein.Color(...parseColor(fillStyle))
        path.stroke = new graphein.Color(...parseColor(strokeStyle))
        path.minimumWidth = parseLength(strokeWidth)

        let d = child.getAttribute('d') || ''

        let match
        while ((match = d.match(/([mlca])\s*((?:-?(?:\d+\.?)?\d+\s*,?\s*)+)/i))) {
          d = d.substr(match.index + match[0].length)
          let command = match[1]
          let numbers = match[2].trim().split(/\s+|\s*,\s*|\s*(?=-)/).map(x => +x)

          for (let i = numbers.length; i < commandLengths[command]; i++) {
            numbers.push(0)
          }

          path.data.push([pathCommands[command], ...numbers])
        }

        editor.currentLayer.appendChild(path)
      } else if (child instanceof SVGRectElement) {
        let strokeWidth = child.getAttribute('stroke-width') || child.style.strokeWidth || context.strokeWidth
        let fillStyle = child.getAttribute('fill') || child.style.fill || context.fillStyle
        let strokeStyle = child.getAttribute('stroke') || child.style.stroke || context.strokeStyle

        let path = new graphein.Path()
        path.fill = new graphein.Color(...parseColor(fillStyle))
        path.stroke = new graphein.Color(...parseColor(strokeStyle))
        path.minimumWidth = parseLength(strokeWidth)

        let x = +child.getAttribute('x')
        let y = +child.getAttribute('y')
        let width = +child.getAttribute('width')
        let height = +child.getAttribute('height')

        path.data.push([0x10, x, y])
        path.data.push([0x21, width, 0])
        path.data.push([0x21, 0, height])
        path.data.push([0x21, -width, 0])
        path.data.push([0x21, 0, -height])

        editor.currentLayer.appendChild(path)
      } else if (child instanceof SVGCircleElement) {
        let strokeWidth = child.getAttribute('stroke-width') || child.style.strokeWidth || context.strokeWidth
        let fillStyle = child.getAttribute('fill') || child.style.fill || context.fillStyle
        let strokeStyle = child.getAttribute('stroke') || child.style.stroke || context.strokeStyle

        let path = new graphein.Path()
        path.fill = new graphein.Color(...parseColor(fillStyle))
        path.stroke = new graphein.Color(...parseColor(strokeStyle))
        path.minimumWidth = parseLength(strokeWidth)

        let x = +child.getAttribute('cx')
        let y = +child.getAttribute('cy')
        let r = +child.getAttribute('r')

        path.data.push([0x10, x, y])
        path.data.push([0x50, x, y, r, 0, Math.PI * 2])

        editor.currentLayer.appendChild(path)
      } else if (child instanceof SVGLineElement) {
        let strokeWidth = child.getAttribute('stroke-width') || child.style.strokeWidth || context.strokeWidth
        let fillStyle = child.getAttribute('fill') || child.style.fill || context.fillStyle
        let strokeStyle = child.getAttribute('stroke') || child.style.stroke || context.strokeStyle

        let path = new graphein.Path()
        path.fill = new graphein.Color(...parseColor(fillStyle))
        path.stroke = new graphein.Color(...parseColor(strokeStyle))
        path.minimumWidth = parseLength(strokeWidth)

        let x1 = +child.getAttribute('x1')
        let y1 = +child.getAttribute('y1')
        let x2 = +child.getAttribute('x2')
        let y2 = +child.getAttribute('y2')

        path.data.push([0x10, x1, y1])
        path.data.push([0x20, x2, y2])

        editor.currentLayer.appendChild(path)
      } else if (child.style) {
        if (child.style.fill) context.fillStyle = child.style.fill
        if (child.style.stroke) context.strokeStyle = child.style.stroke
        if (child.style.strokeWidth) context.strokeWidth = child.style.strokeWidth
        else context.strokeWidth = 0
        searchSVG(child, context)
      }
    }
  }

  button.addEventListener('click', e => {
    const parser = new DOMParser()
    const document = parser.parseFromString(input.value, 'image/svg+xml')
    searchSVG(document)
  })
}
