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
    let centerLine = PathFitter.fitPath(this.points)
    let path = new Path()
    path.stroke = new Color(1, 0, 0, 1)
    path.data.push(new Path.Command(0x60, 0, 5, 5))
    path.data.push(...centerLine.map(command => new Path.Command(...command)))

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

  strokeStart (x, y) {
    this.points = []
    this.points.push([x, y])
  }

  strokeMove (x, y) {
    this.points.push([x, y])
  }

  strokeEnd (x, y) {
    this.points.push([x, y])
    this.erase()
  }
}
