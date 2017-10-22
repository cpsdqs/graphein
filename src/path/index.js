const { mat4 } = require('gl-matrix')
const getNormals = require('polyline-normals')
const createBuffer = require('gl-buffer')
const createVAO = require('gl-vao')
const libtess = require('libtess')
const Layer = require('../layer')
const Color = require('../color')
const pathToPolylines = require('./path-to-polylines')
const { getPointAtLength, getPartialLengths, getInterpolationAtLength } = require('./polyline-utils')
const { add, mix, invert, scale, distanceTo } = require('./vector-utils')

module.exports = class Path extends Layer {
  constructor () {
    super()

    this.type = 'p'

    this.stroke = null
    this.fill = null
    this.cap = Path.caps.BUTT
    this.join = Path.joins.BEVEL
    this.miter = 0

    this.dirty = false

    // cache
    this.leftContours = null
    this.rightContours = null
    this.contourTriangles = null
    this.strokeVAO = null
    this.strokeAttributeBuffers = null
    this.strokeVAOLength = null

    const self = this

    this._data = new Proxy([], {
      set (target, key, value) {
        target[key] = value
        self.dirty = true
        return true
      }
    })
    this._left = new Proxy([], {
      set (target, key, value) {
        target[key] = value
        self.dirty = true
        return true
      }
    })
    this._right = new Proxy([], {
      set (target, key, value) {
        target[key] = value
        self.dirty = true
        return true
      }
    })
  }

  get data () { return this._data }
  set data (v) {
    this._data.splice(0)
    this._data.push(...v)
  }
  get left () { return this._left }
  set left (v) {
    this._left.splice(0)
    this._left.push(...v)
  }
  get right () { return this._right }
  set right (v) {
    this._right.splice(0)
    this._right.push(...v)
  }

  updateStrokeContours () {
    let centerLines = pathToPolylines(this.data)
    let leftThicknesses = pathToPolylines(this.left)
    let rightThicknesses = pathToPolylines(this.right)

    this.leftContours = []
    this.rightContours = []

    for (let i = 0; i < centerLines.length; i++) {
      let centerLine = centerLines[i]
      let centerNormals = getNormals(centerLine)

      let centerLengths = [...getPartialLengths(centerLine)]

      // adds interpolated points to the thickness line at each point of the
      // center line to prevent undersampling contours (e.g. when the contour
      // is constant but the center line is bending)
      const addCenterLineSamples = (thicknessLine) => {
        // ensure that the whole center line is drawn by adding a start and end point
        thicknessLine = thicknessLine.slice()
        thicknessLine.unshift([0, 0])
        thicknessLine.push([centerLengths[centerLengths.length - 1], 0])

        let points = []
        let lastPoint = null
        for (let point of thicknessLine) {
          if (lastPoint) {
            // collect center line lengths between this point and the last
            let missedLengths = []

            // start and end lengths (thickness line's x maps to center line's length!)
            let start = lastPoint[0]
            let end = point[0]

            let leftBound = start < end ? start : end
            let rightBound = start < end ? end : start

            for (let length of centerLengths) {
              if (leftBound < length && length < rightBound) missedLengths.push(length)
            }

            // if the line is going backwards, then the interpolated points
            // should too
            if (end < start) missedLengths.reverse()

            // add interpolated points
            for (let length of missedLengths) {
              let amount = (length - start) / (end - start)
              points.push(lastPoint::mix(point, amount))
            }
          }

          lastPoint = point

          // also add the original point
          points.push(point.slice())
        }
        return points
      }

      // TODO: don't assume thickness lines and center lines align
      let leftThickness = addCenterLineSamples(leftThicknesses[i])
      let rightThickness = addCenterLineSamples(rightThicknesses[i])

      let leftContour = []
      let rightContour = []

      for (let point of leftThickness) {
        let centerPoint = getPointAtLength(centerLine, point[0])

        let interpolation = getInterpolationAtLength(centerLine, point[0])
        let firstNormal = centerNormals[interpolation[0]] || [0, 0]
        let secondNormal = centerNormals[interpolation[1]] || [0, 0]
        let centerNormal = firstNormal[0]::mix(secondNormal[0], interpolation[2])::invert()

        leftContour.push(centerPoint::add(centerNormal::scale(point[1])))
      }

      for (let point of rightThickness) {
        let centerPoint = getPointAtLength(centerLine, point[0])

        let interpolation = getInterpolationAtLength(centerLine, point[0])
        let firstNormal = centerNormals[interpolation[0]] || [0, 0]
        let secondNormal = centerNormals[interpolation[1]] || [0, 0]
        let centerNormal = firstNormal[0]::mix(secondNormal[0], interpolation[2])

        rightContour.push(centerPoint::add(centerNormal::scale(point[1])))
      }

      this.leftContours.push(leftContour)
      this.rightContours.push(rightContour)
    }

    // TODO: render all paths
    let leftContour = this.leftContours[0]
    let rightContour = this.rightContours[0]
    let contour = leftContour.concat(rightContour.slice().reverse())

    let tess = new libtess.GluTesselator()
    tess.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, (data, pva) => {
      pva.push(data[0], data[1])
      // console.log(data.join())
    })
    tess.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, (type) => {
      // console.log('begin', type)
    })
    tess.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, (type) => {
      // console.log('error', type)
    })
    tess.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, (coords, data, weight) => {
      return [coords[0], coords[1], coords[2]]
    })
    tess.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, (flag) => {
      // console.log('edge-flag', flag)
    })

    // nonzero winding rule to prevent overlap from subtracting
    tess.gluTessProperty(libtess.gluEnum.GLU_TESS_WINDING_RULE, libtess.windingRule.GLU_TESS_WINDING_NONZERO)

    tess.gluTessNormal(0, 0, 1)

    this.contourTriangles = []
    tess.gluTessBeginPolygon(this.contourTriangles)
    tess.gluTessBeginContour()

    for (let point of contour) {
      tess.gluTessVertex([point[0], point[1], 0], [point[0], point[1], 0])
    }

    tess.gluTessEndContour()
    tess.gluTessEndPolygon()
  }

  render (gl, transform, context) {
    let subTransform = mat4.create()
    mat4.multiply(subTransform, transform, this.transform.toMat4())

    let strokeColor = this.stroke ? this.stroke.toVec4() : [0, 0, 0, 0]
    let fillColor = this.fill ? this.fill.toVec4() : [0, 0, 0, 0]

    if (this.dirty) {
      this.updateStrokeContours()

      if (!this.strokeAttributeBuffers) {
        this.strokeAttributeBuffers = {
          positions: createBuffer(gl, this.contourTriangles)
        }
      } else {
        this.strokeAttributeBuffers.positions.update(this.contourTriangles)
      }
      if (!this.strokeVAO) {
        this.strokeVAO = createVAO(gl, [{
          buffer: this.strokeAttributeBuffers.positions,
          type: gl.FLOAT,
          size: 2
        }])
      }
      this.strokeVAOLength = this.contourTriangles.length / 2

      this.dirty = false
    }

    // stroke lines if there's alpha
    if (strokeColor[3]) {
      let shader = context.shaders.path
      shader.bind()
      shader.uniforms.color = strokeColor
      shader.uniforms.transform = transform

      this.strokeVAO.bind()
      this.strokeVAO.draw(gl.TRIANGLES, this.strokeVAOLength)
      this.strokeVAO.unbind()
    }
  }

  get roughLength () {
    let length = 0

    let lastPoint = null
    for (let command of this.data) {
      if (command[0] === 0x10) lastPoint = command.slice(1)
      else if (command[0] === 0x20) {
        if (lastPoint) length += lastPoint::distanceTo(command.slice(1))
        lastPoint = command.slice(1)
      }
    }

    return length
  }
  set roughLength (v) {}

  addRoughPoint (x, y, left, right, start) {
    this.data.push([start ? 0x10 : 0x20, x, y])
    let length = this.roughLength
    this.left.push([start ? 0x10 : 0x20, length, left])
    this.right.push([start ? 0x10 : 0x20, length, right])
  }

  serialize () {
    return Object.assign(super.serialize(), {
      d: this.data,
      l: this.left,
      r: this.right,
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
    path.data = (data.d || [])
    path.left = (data.l || [])
    path.right = (data.r || [])

    return path
  }

  static caps = {
    BUTT: 0,
    ROUND: 1,
    PROJECTING: 2
  }

  static joins = {
    BEVEL: 0,
    ROUND: 1,
    MITER: 2
  }
}
Layer.registry.define('p', module.exports)
