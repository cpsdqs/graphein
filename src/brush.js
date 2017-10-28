const { vec3, mat4 } = require('gl-matrix')
const Tool = require('./tool')
const PathFitter = require('./lib/path-fitter')
const Path = require('./path')
const Color = require('./color')

module.exports = class Brush extends Tool {
  constructor (...args) {
    super(...args)

    this.points = []
  }

  addRoundLineCap (commands) {
    let first = commands[0]
    let last = commands[commands.length - 1]

    let firstX = first[first.length - 2]
    let firstY = first[first.length - 1]
    let lastX = last[last.length - 2]
    let lastY = last[last.length - 1]

    commands.unshift([0x50, firstX, 0, firstY, Math.PI, 1.5 * Math.PI])
    commands.push([0x50, lastX, 0, lastY, 1.5 * Math.PI, 2 * Math.PI])
  }

  stroke () {
    if (this.editor.currentLayer.type === 'b') {
      // bitmap
      const ctx = this.editor.currentLayer.ctx
      ctx.fillStyle = this.editor.color.toCSS()

      let makeCircle = (x, y, r) => {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fill()
      }

      for (let point of this.points) {
        let inverted = mat4.create()
        mat4.invert(inverted, this.editor.currentLayer.transform.toMat4())

        let pointPos = [point.x, point.y, 0]
        vec3.transformMat4(pointPos, pointPos, inverted)

        point.x = pointPos[0]
        point.y = pointPos[1]
      }

      let spacing = 1
      let lastPoint = null
      for (let point of this.points) {
        let radius = (point.left + point.right) / 2

        // interpolate line
        if (lastPoint) {
          let length = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y)
          let angle = Math.atan2(point.y - lastPoint.y, point.x - lastPoint.x)
          let cosAngle = Math.cos(angle)
          let sinAngle = Math.sin(angle)
          let lastRadius = (lastPoint.left + lastPoint.right) / 2

          for (let x = 0; x < length; x += spacing) {
            makeCircle(
              lastPoint.x + cosAngle * x,
              lastPoint.y + sinAngle * x,
              lastRadius + (radius - lastRadius) * (x / length)
            )
          }
        }

        makeCircle(point.x, point.y, radius)
        lastPoint = point
      }

      this.editor.currentLayer.dirty = true
    } else {
      // vector
      let path = new Path()
      path.stroke = this.editor.color.clone()

      let centerLine = PathFitter.fitPath(this.points.map(p => [p.x, p.y]))
      let weightLeft = PathFitter.fitPath(this.points.map(p => [p.length, p.left]), 1)
      let weightRight = PathFitter.fitPath(this.points.map(p => [p.length, p.right]), 1)

      this.addRoundLineCap(weightLeft)
      this.addRoundLineCap(weightRight)

      path.data.push(...centerLine)
      path.left.push(...weightLeft)
      path.right.push(...weightRight)

      this.editor.currentLayer.appendChild(path)
    }
  }

  strokeStart (x, y, left, right, length) {
    this.points = []
    this.points.push({ x, y, left, right, length })
  }

  strokeMove (x, y, left, right, length) {
    let lastPoint = this.points[this.points.length - 1]
    if (lastPoint.x === x && lastPoint.y === y) {
      Object.assign(lastPoint, { left, right })
    } else {
      this.points.push({ x, y, left, right, length })
    }
  }

  strokeEnd (x, y, left, right, length) {
    this.strokeMove(x, y, left, right, length)

    this.stroke()
  }
}
