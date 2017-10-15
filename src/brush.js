const Tool = require('./tool')
const PathFitter = require('./lib/path-fitter')
const Path = require('./path')
const Color = require('./color')

module.exports = class Brush extends Tool {
  constructor (...args) {
    super(...args)

    this.size = 10

    this.points = []
  }

  stroke () {
    let pathFitter = new PathFitter(this.points.map(x => [x.x, x.y]))
    let segments = pathFitter.fit(2) // TODO: weighted by time?

    let path = new Path()
    path.stroke = new Color(0, 0, 0, 1)

    let lastSegment = null
    for (let segment of segments) {
      if ((!lastSegment || !lastSegment.handleOutLength()) && !segment.handleInLength()) {
        // line from last segment to this one is straight
        path.data.push(new Path.Command(0x20, ...segment.point))
      } else if (lastSegment) {
        // cubic bezier curve

        // get absolute handle out & in
        let handleOut = lastSegment.handleOut.map((x, i) => x + lastSegment.point[i])
        let handleIn = segment.handleIn.map((x, i) => x + segment.point[i])

        path.data.push(new Path.Command(0x30, ...handleOut, ...handleIn, ...segment.point))
      } else {
        path.data.push(new Path.Command(0x10, ...segment.point))
      }

      lastSegment = segment
    }

    // TODO: don't do the following
    // copy width data to simplified path
    let length = 0
    let lastPoint = null
    for (let point of this.points) {
      if (lastPoint) {
        length += Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y)
      }
      lastPoint = point
      path.data.push(new Path.Command(0x60, length, point.left, point.right))
    }

    this.editor.currentLayer.appendChild(path)
  }

  strokeStart (x, y, left, right) {
    this.points = []
    this.points.push({ x, y, left, right })
  }

  strokeMove (x, y, left, right) {
    let lastPoint = this.points[this.points.length - 1]
    if (lastPoint.x === x && lastPoint.y === y) {
      Object.assign(lastPoint, { left, right })
    } else this.points.push({ x, y, left, right })
  }

  strokeEnd (x, y, left, right ) {
    this.strokeMove(x, y, left, right)

    this.stroke()
  }
}
