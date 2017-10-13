const Layer = require('./layer')
const Color = require('./color')

// TODO: redo properly

// reuse svg elements
let basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
let widthL = document.createElementNS('http://www.w3.org/2000/svg', 'path')
let widthR = document.createElementNS('http://www.w3.org/2000/svg', 'path')

class StrokeRenderer {
  constructor () {
    this.path = []
    this.widthL = [['M', 0, 0]]
    this.widthR = [['M', 0, 0]]
    this.cursor = [0, 0]
    this.cursorL = [0, 0]
    this.cursorR = [0, 0]
  }

  add (type, ...args) {
    if (type.startsWith('_')) {
      type = type.substr(1)
      if (type === 'L') {
        this.cursorL = [args[0], args[1]]
        this.cursorR = [args[0], args[2]]
        this.widthL.push([type, ...this.cursorL])
        this.widthR.push([type, ...this.cursorR])
      } else if (type === 'l') {
        this.cursorL[0] += args[0]
        this.cursorR[0] += args[0]
        this.cursorL[1] += args[1]
        this.cursorR[1] += args[2]
        this.widthL.push([type, ...this.cursorL])
        this.widthR.push([type, ...this.cursorR])
      } else if (type === 'C') {
        let leftArgs = args.slice(1, 5).concat([args[0], args[5]])
        let rightArgs = args.slice(6, 10).concat([args[0], args[10]])
        this.cursorL = [args[0], args[5]]
        this.cursorR = [args[0], args[10]]
        this.widthL.push(['C', ...leftArgs])
        this.widthR.push(['C', ...rightArgs])
      }
      // TODO: c
    } else {
      this.path.push([type, ...args])
    }
  }

  getPath () {
    return this.path.map(item => item.join(' ')).join(' ')
  }

  getWidthL () {
    return this.widthL.map(item => item.join(' ')).join(' ')
  }

  getWidthR () {
    return this.widthR.map(item => item.join(' ')).join(' ')
  }

  render (ctx) {
    basePath.setAttribute('d', this.getPath())
    widthL.setAttribute('d', this.getWidthL())
    widthR.setAttribute('d', this.getWidthR())

    let baseLength = basePath.getTotalLength()
    let resolution = 1 / window.devicePixelRatio

    let cursor = null
    let currentL = 0
    let currentR = 0

    let findNextPointAtX = (path, target, start = 0) => {
      let x = start
      let length = path.getTotalLength()

      while (true) {
        if (x > length) return length
        if (path.getPointAtLength(x).x >= target) {
          return x
        }
        x += resolution
      }
    }

    let lastLeftPos = 0
    let lastRightPos = 0

    for (let x = 0; x < baseLength; x += resolution) {
      let point = basePath.getPointAtLength(x)

      let leftPos = findNextPointAtX(widthL, x, lastLeftPos)
      let rightPos = findNextPointAtX(widthR, x, lastRightPos)

      let left = widthL.getPointAtLength(leftPos).y
      let right = widthR.getPointAtLength(rightPos).y

      // TODO: support jumps (M/m) midway

      if (!cursor) {
        ctx.beginPath()
        ctx.moveTo(point.x, point.y)
        cursor = [point.x, point.y]
      }

      if (left !== currentL || right !== currentR) {
        currentL = left
        currentR = right

        // TODO: support asymmetry
        ctx.stroke()
        ctx.lineWidth = (currentL + currentR) / 2 // average for now
        ctx.beginPath()
        ctx.moveTo(...cursor)
      }

      ctx.lineTo(point.x, point.y)
      cursor = [point.x, point.y]
    }

    ctx.stroke()
  }
}

const instructionFunctions = {
  0x00: 'Z',
  0x10: 'M',
  0x11: 'm',
  0x20: 'L',
  0x21: 'l',
  0x30: 'C',
  0x31: 'c',
  0x32: 'S',
  0x33: 's',
  0x40: 'Q',
  0x41: 'q',
  0x42: 'T',
  0x43: 't',
  0x50: 'A',
  0x51: 'a',
  0x60: '_L',
  0x61: '_l',
  0x62: '_C',
  0x63: '_c'
}

class Instruction {
  constructor (type, ...data) {
    this.type = type | 0
    this.data = data || []
  }

  render (renderer) {
    renderer.add(instructionFunctions[this.type], ...this.data)
  }

  serialize () {
    return [this.type, this.data]
  }

  static types = {
    CLOSE_PATH: 0,
    MOVE: 0x10,
    MOVE_R: 0x11,
    LINE: 0x20,
    LINE_R: 0x21,
    CUBIC_BEZIER: 0x30,
    CUBIC_BEZIER_R: 0x31,
    CUBIC_BEZIER_SHORT: 0x32,
    CUBIC_BEZIER_SHORT_R: 0x33,
    QUAD_BEZIER: 0x40,
    QUAD_BEZIER_R: 0x41,
    QUAD_BEZIER_SHORT: 0x42,
    QUAD_BEZIER_SHORT_R: 0x43,
    ARC: 0x50,
    ARC_R: 0x51,
    STROKE_WIDTH: 0x60,
    STROKE_WIDTH_R: 0x61,
    STROKE_WIDTH_BEZIER: 0x62,
    STROKE_WIDTH_BEZIER_R: 0x63
  }
}

module.exports = class Path extends Layer {
  constructor () {
    super()

    this.stroke = new Color()
    this.fill = new Color()
    this.cap = Path.cap.BUTT
    this.join = Path.join.BEVEL
    this.miter = 0
    this.data = []
  }

  render (ctx) {
    let renderer = new StrokeRenderer()
    this.data.forEach(instruction => instruction.render(renderer))

    if (this.fill.alpha) {
      ctx.fillStyle = this.fill.toCSS()
      ctx.fill(new window.Path2D(renderer.getPath()))
    }
    if (this.stroke.alpha) {
      ctx.strokeStyle = this.stroke.toCSS()
      renderer.render(ctx)
    }
  }

  static cap = {
    BUTT: 0,
    ROUND: 1,
    PROJECTING: 2
  }

  static join = {
    BEVEL: 0,
    ROUND: 1,
    MITER: 2
  }

  static Instruction = Instruction
}
