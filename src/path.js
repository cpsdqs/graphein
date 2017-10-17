const { mat4 } = require('gl-matrix')
const bezier = require('adaptive-bezier-curve')
const getNormals = require('polyline-normals')
const createBuffer = require('gl-buffer')
const createShader = require('gl-shader')
const createVAO = require('gl-vao')
const triangulate = require('cdt2d')
const { Intersection, Point2D } = require('kld-intersections')
const Layer = require('./layer')
const Color = require('./color')

class StrokeRenderer {
  constructor (gl, transform, context, stroke, fill) {
    this.currentPath = []
    this.paths = [this.currentPath]
    this.widthL = [[0, 0]]
    this.widthR = [[0, 0]]
    this.cursor = [0, 0]
    this.cursorL = [0, 0]
    this.cursorR = [0, 0]

    this.gl = gl
    this.transform = transform
    this.stroke = stroke
    this.fill = fill

    if (context) {
      this.shader = context.shaders.path
      this.fillShader = context.shaders.pathFill
    }

    this.selectedStyle = false

    this.strokeIsDirty = false
    this.fillIsDirty = false

    // cache
    this.strokeVAO = null
    this.strokeAttributeBuffers = null
    this.strokeVAOLength = 0
    this.fillVAO = null
    this.fillAttributeBuffers = null
    this.fillVAOLength = 0
  }

  clearPaths () {
    this.currentPath = []
    this.paths = [this.currentPath]

    this.strokeIsDirty = this.fillIsDirty = true
  }

  add (type, ...args) {
    let lastCursor = this.cursor.slice()

    if (type === 0x10) {
      // moveto
      this.cursor = args
      this.paths.push(this.currentPath = [this.cursor])
    } else if (type === 0x11) {
      // moveto relative
      this.cursor = this.cursor.map((x, i) => x + args[i])
      this.paths.push(this.currentPath = [this.cursor])
    } else if (type === 0x20) {
      // lineto
      this.currentPath.push(this.cursor = args)
    } else if (type === 0x21) {
      // lineto relative
      this.cursor = this.cursor.map((x, i) => x + args[i])
      this.currentPath.push(this.cursor)
    } else if (type === 0x30 || type === 0x31) {
      // curveto / relative
      let c1 = args.slice(0, 2)
      let c2 = args.slice(2, 4)
      this.cursor = args.slice(4)

      if (type === 0x31) {
        c1 = c1.map((x, i) => x + lastCursor[i])
        c2 = c2.map((x, i) => x + lastCursor[i])
        this.cursor = this.cursor.map((x, i) => x + lastCursor[i])
      }

      this.currentPath.push(...bezier(lastCursor, c1, c2, this.cursor).slice(1))
      // TODO: quadratic curves
    } else if (type === 0x50 || type === 0x51) {
      // TODO
    } else if (type === 0x60) {
      // stroke width to
      this.widthL.push(args)
      this.cursorL = args
      this.widthR.push(args)
      this.cursorR = args
    } else if (type === 0x61) {
      // stroke width relative
      this.widthL.push(args)
      this.cursorL = this.cursorL.map((x, i) => x + args[i])
      this.widthR.push(args)
      this.cursorR = this.cursorR.map((x, i) => x + args[i])
    } else if (type === 0x62) {
      // stroke width bezier
      let c1L = args.slice(1, 3)
      let c2L = args.slice(3, 5)
      let lastCursorL = this.cursorL.slice()
      this.cursorL = [args[0], args[5]]
      bezier(lastCursorL, c1L, c2L, this.cursorL, 1, this.widthL)

      let c1R = args.slice(6, 8)
      let c2R = args.slice(8, 10)
      let lastCursorR = this.cursorR.slice()
      this.cursorR = [args[0], args[10]]
      bezier(lastCursorR, c1R, c2R, this.cursorR, 1, this.widthR)
    } else {
      // TODO: stroke width bezier relative
    }

    this.strokeIsDirty = this.fillIsDirty = true
  }

  updateStroke () {
    const gl = this.gl

    // TODO: render all paths instead of only one
    let path = this.currentPath.slice()
    let normals = getNormals(path)

    let getWidthL = StrokeRenderer.curveToFunction(this.widthL)
    let getWidthR = StrokeRenderer.curveToFunction(this.widthR)

    // TODO: include stroke width in resolution

    if (path.length === 1) {
      // can't draw triangles with only one point, so here's a dummy
      path.push(path[0])

      // can't compute normals for only one point, so here's a dummy
      normals = [[[1, 0], 1], [[1, 0], 1]]
    }

    let positions = []
    let vnormals = []
    let miters = []
    let thicknesses = []

    let length = 0
    let lastPoint = null
    for (let i = 0; i < path.length; i++) {
      let point = path[i]

      if (lastPoint) {
        length += Math.hypot(...point.map((x, i) => x - lastPoint[i]))
      }
      lastPoint = point

      let left = getWidthL(length)
      let right = getWidthR(length)

      thicknesses.push(right)

      positions.push(...point)
      vnormals.push(...normals[i][0])
      miters.push(normals[i][1])

      thicknesses.push(left)

      positions.push(...point)
      vnormals.push(...normals[i][0])
      miters.push(-normals[i][1])
    }

    if (!this.strokeAttributeBuffers) {
      this.strokeAttributeBuffers = {
        positions: createBuffer(gl, positions),
        normals: createBuffer(gl, vnormals),
        miters: createBuffer(gl, miters),
        thicknesses: createBuffer(gl, thicknesses)
      }
    } else {
      this.strokeAttributeBuffers.positions.update(positions)
      this.strokeAttributeBuffers.normals.update(vnormals)
      this.strokeAttributeBuffers.miters.update(miters)
      this.strokeAttributeBuffers.thicknesses.update(thicknesses)
    }

    if (!this.strokeVAO) {
      this.strokeVAO = createVAO(gl, [
        {
          buffer: this.strokeAttributeBuffers.positions,
          type: gl.FLOAT,
          size: 2
        },
        {
          buffer: this.strokeAttributeBuffers.normals,
          type: gl.FLOAT,
          size: 2
        },
        {
          buffer: this.strokeAttributeBuffers.miters,
          type: gl.FLOAT,
          size: 1
        },
        {
          buffer: this.strokeAttributeBuffers.thicknesses,
          type: gl.FLOAT,
          size: 1
        },
      ])
    }

    this.strokeVAOLength = positions.length / 2
    this.strokeIsDirty = false
  }

  render () {
    const gl = this.gl

    if (!this.strokeVAO || this.strokeIsDirty) this.updateStroke()

    this.shader.bind()
    this.shader.uniforms.color = this.stroke
    this.shader.uniforms.transform = this.transform
    this.shader.uniforms.isSelected = this.selectedStyle

    this.strokeVAO.bind()
    this.strokeVAO.draw(gl.TRIANGLE_STRIP, this.strokeVAOLength)
    this.strokeVAO.unbind()
  }

  updateFill () {
    const gl = this.gl

    let path = this.currentPath.slice()

    let cells = triangulate(path)

    let positions = []
    for (let cell of cells) {
      for (let pos of cell.map(x => path[x])) positions.push(...pos)
    }

    if (!this.fillAttributeBuffers) {
      this.fillAttributeBuffers = {
        positions: createBuffer(gl, positions)
      }
    } else {
      this.fillAttributeBuffers.positions.update(positions)
    }

    if (!this.fillVAO) {
      this.fillVAO = createVAO(gl, [
        {
          buffer: this.fillAttributeBuffers.positions,
          type: gl.FLOAT,
          size: 2
        }
      ])
    }

    this.fillVAOLength = positions.length / 2
    this.fillIsDirty = false
  }

  renderFill () {
    const gl = this.gl

    if (!this.fillVAO || this.fillIsDirty) this.updateFill()

    this.fillShader.bind()
    this.fillShader.uniforms.color = this.fill
    this.fillShader.uniforms.transform = this.transform
    this.fillShader.uniforms.isSelected = this.selectedStyle

    this.fillVAO.bind()
    this.fillVAO.draw(gl.TRIANGLES, this.fillVAOLength)
    this.fillVAO.unbind()
  }

  static curveToFunction (points) {
    let path = new Map()
    let x = 0

    for (let i = 0; i < points.length; i++) {
      let pointX = Math.max(points[i][0], x) // prevent overlap
      path.set(pointX, points[i][1])
    }

    return (x) => {
      let left = -Infinity
      let right = Infinity
      let leftPoint = null
      let rightPoint = null

      for (let pointX of path.keys()) {
        if (pointX <= x && pointX > left) {
          left = pointX
          leftPoint = path.get(pointX)
        }
        if (pointX > x && pointX < right) {
          right = pointX
          rightPoint = path.get(pointX)
        }
      }

      if (Number.isFinite(left) && Number.isFinite(right)) {
        let mix = (x - left) / (right - left)
        return (rightPoint - leftPoint) * mix + leftPoint
      } else if (Number.isFinite(left)) return leftPoint
      else if (Number.isFinite(right)) return rightPoint
      else return 0
    }
  }
}

class PathCommand {
  constructor (type, ...data) {
    this.type = type | 0
    this.data = data || []
  }

  render (renderer) {
    renderer.add(this.type, ...this.data)
  }

  serialize () {
    return [this.type, ...this.data]
  }

  static deserialize (data) {
    return new PathCommand(...data)
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

// WeakMap<WebGLRenderingContext, WeakMap<Path, StrokeRenderer>>
const strokeRendererContexts = new WeakMap()

module.exports = class Path extends Layer {
  constructor () {
    super()

    this.type = 'p'

    this.stroke = null
    this.fill = null
    this.cap = Path.cap.BUTT
    this.join = Path.join.BEVEL
    this.miter = 0

    this.dataIsDirty = false
    const self = this
    this._data = new Proxy([], {
      set (target, key, value) {
        target[key] = value
        self.dataIsDirty = true
        return true
      }
    })
  }

  get data () {
    return this._data
  }
  set data (v) {
    this._data.splice(0)
    this._data.push(...v)
  }

  getRenderer (gl, subTransform, context, strokeColor, fillColor) {
    let renderer

    // get stroke renderer from cache
    let strokeRenderers = strokeRendererContexts.get(gl)
    if (strokeRenderers) {
      renderer = strokeRenderers.get(this)
    }

    if (!renderer) {
      // not in cache, create one
      renderer = new StrokeRenderer(gl, subTransform, context, strokeColor, fillColor)
      this.data.forEach(command => command.render(renderer))
      this.dataIsDirty = false

      if (gl && !strokeRendererContexts.has(gl)) strokeRendererContexts.set(gl, new WeakMap())
      if (strokeRendererContexts.has(gl)) strokeRendererContexts.get(gl).set(this, renderer)
    } else {
      // update variables
      renderer.transform = subTransform
      renderer.context = context
      renderer.stroke = strokeColor
      renderer.fill = fillColor

      if (this.dataIsDirty) {
        renderer.clearPaths()
        this.data.forEach(command => command.render(renderer))
        this.dataIsDirty = false
      }
    }

    if (context) {
      renderer.selectedStyle = context.selection.includes(this)
    }

    return renderer
  }

  render (gl, transform, context) {
    let subTransform = mat4.create()
    mat4.multiply(subTransform, transform, this.transform.toMat4())

    let strokeColor = this.stroke ? this.stroke.toVec4() : [0, 0, 0, 0]
    let fillColor = this.fill ? this.fill.toVec4() : [0, 0, 0, 0]

    let renderer = this.getRenderer(gl, transform, context, strokeColor, fillColor)

    if (this.stroke && this.stroke.alpha) renderer.render()
    if (this.fill && this.fill.alpha) renderer.renderFill()
  }

  get roughLength () {
    let length = 0

    let lastPoint = null
    for (let command of this.data) {
      if (command.type === 0x10) {
        lastPoint = command.data
      } else if (command.type === 0x20) {
        length += Math.hypot(...command.data.map((x, i) => x - lastPoint[i]))
        lastPoint = command.data
      } else if (command.type !== 0x60) {
        console.warn('Cannot get rough length of command type 0x' + command.type.toString(16))
      }
    }

    return length
  }
  set roughLength (v) {}

  addRoughPoint (x, y, left, right, first = false) {
    this.data.push(new PathCommand(first ? 0x10 : 0x20, x, y))
    this.data.push(new PathCommand(0x60, this.roughLength, left, right))
  }

  toPolyline () {
    let renderer = this.getRenderer(null, this.getWorldTransform())

    // TODO: consider all paths
    return renderer.currentPath.slice()
  }

  intersect (layer) {
    if (layer instanceof Path) {
      let ownPoints = this.toPolyline().map(point => new Point2D(...point))
      let layerPoints = layer.toPolyline().map(point => new Point2D(...point))
      let intersection = Intersection.intersectPolylinePolyline(ownPoints, layerPoints)
      return intersection.points
    } else throw new Error(`Intersection of Path with ${layer.constructor.name} not implemented`)
  }

  static fromPoints (points) {
    let path = new Path()

    for (let i = 0; i < points.length; i++) {
      path.data.push(new PathCommand(i === 0 ? 0x10 : 0x20, ...points[i]))
    }

    return path
  }

  serialize () {
    return Object.assign(super.serialize(), {
      d: this.data.map(x => x.serialize()),
      e: this.cap,
      j: this.join,
      m: this.miter,
      s: this.stroke ? this.stroke.serialize() : null,
      f: this.fill ? this.fill.serialize() : null
    })
  }

  static deserialize (data) {
    let path = new Path()
    Layer.deserializeLayerData(path, data)

    path.cap = data.e || 0
    path.join = data.j || 0
    path.miter = data.m || 0
    path.stroke = Color.deserialize(data.s)
    path.fill = Color.deserialize(data.f)
    path.data = (data.d || []).map(x => PathCommand.deserialize(x))

    return path
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

  static Command = PathCommand
}

Layer.registry.define('p', module.exports)
