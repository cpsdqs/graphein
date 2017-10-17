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

  fitPath (points, error = 2) {
    let pathFitter = new PathFitter(points)
    let segments = pathFitter.fit(error) // TODO: weighted by time?

    let commands = []
    let lastSegment = null
    for (let segment of segments) {
      if ((!lastSegment || !lastSegment.handleOutLength()) && !segment.handleInLength()) {
        // line from last segment to this one is straight
        commands.push([0x20, ...segment.point])
      } else if (lastSegment) {
        // cubic bezier curve

        // get absolute handle out & in
        let handleOut = lastSegment.handleOut.map((x, i) => x + lastSegment.point[i])
        let handleIn = segment.handleIn.map((x, i) => x + segment.point[i])

        commands.push([0x30, ...handleOut, ...handleIn, ...segment.point])
      } else {
        commands.push([0x10, ...segment.point])
      }

      lastSegment = segment
    }

    return commands
  }

  stroke () {
    let path = new Path()
    path.stroke = this.color.clone()

    let centerLine = this.fitPath(this.points.map(p => [p.x, p.y]))
    let weightLeft = this.fitPath(this.points.map(p => [p.length, p.left]), 3)
    let weightRight = this.fitPath(this.points.map(p => [p.length, p.right]), 3)

    path.data.push(...centerLine.map(command => new Path.Command(...command)))

    // TODO: don't do the following
    // copy width data to simplified path
    for (let point of this.points) {
      path.data.push(new Path.Command(0x60, point.length, point.left, point.right))
    }

    this.editor.currentLayer.appendChild(path)
  }

  strokeStart (x, y, left, right) {
    this.points = []
    this.points.push({ x, y, left, right, length: 0 })
  }

  strokeMove (x, y, left, right) {
    let lastPoint = this.points[this.points.length - 1]
    if (lastPoint.x === x && lastPoint.y === y) {
      Object.assign(lastPoint, { left, right })
    } else {
      let lastLength = lastPoint.length
      let partLength = Math.hypot(x - lastPoint.x, y - lastPoint.y)
      let length = partLength + lastLength
      this.points.push({ x, y, left, right, length })
    }
  }

  strokeEnd (x, y, left, right ) {
    this.strokeMove(x, y, left, right)

    this.stroke()
  }
}
