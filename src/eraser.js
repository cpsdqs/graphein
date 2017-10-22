const PathFitter = require('./lib/path-fitter')
const Tool = require('./tool')
const Path = require('./path')
const Color = require('./color')

module.exports = class Eraser extends Tool {
  constructor (...args) {
    super(...args)

    this.points = []
  }

  erase () {
    let path = new Path()
    path.stroke = new Color(1, 0, 0, 1)

    let centerLine = PathFitter.fitPath(this.points.map(p => [p.x, p.y]))
    let weightLeft = PathFitter.fitPath(this.points.map(p => [p.length, p.left]), 1)
    let weightRight = PathFitter.fitPath(this.points.map(p => [p.length, p.right]), 1)

    path.data.push(...centerLine)
    path.left.push(...weightLeft)
    path.right.push(...weightRight)

    this.editor.currentLayer.appendChild(path)

    let layers = this.editor.currentLayer.children
    let removeLayers = []
    for (let layer of layers) {
      let points = path.intersect(layer)
      if (points.length) {
        // for (let point of points) {
          // TODO: split paths
        // }
        removeLayers.push(layer)
      }
    }

    for (let layer of removeLayers) layer.parentNode.removeChild(layer)
  }

  strokeStart (x, y, left, right, length) {
    this.points = []
    this.points.push({ x, y, left, right, length })
  }

  strokeMove (x, y, left, right, length) {
    this.points.push({ x, y, left, right, length })
  }

  strokeEnd (x, y, left, right, length) {
    this.points.push({ x, y, left, right, length })
    this.erase()
  }
}
