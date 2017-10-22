const Tool = require('./tool')
const PathFitter = require('./lib/path-fitter')
const Path = require('./path')
const Color = require('./color')

module.exports = class Brush extends Tool {
  constructor (...args) {
    super(...args)

    this.color = new Color(0, 0, 0, 1)

    this.points = []
  }

  stroke () {
    let path = new Path()
    path.stroke = this.color.clone()

    let centerLine = PathFitter.fitPath(this.points.map(p => [p.x, p.y]))
    let weightLeft = PathFitter.fitPath(this.points.map(p => [p.length, p.left]), 1)
    let weightRight = PathFitter.fitPath(this.points.map(p => [p.length, p.right]), 1)

    path.data.push(...centerLine)
    path.left.push(...weightLeft)
    path.right.push(...weightRight)

    this.editor.currentLayer.appendChild(path)
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
