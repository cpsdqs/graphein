const Tool = require('./tool')
const Path = require('./path')

module.exports = class Select extends Tool {
  constructor (...args) {
    super(...args)

    this.points = []
  }

  select () {
    this.editor.selection = []

    // get objects inside selection area
    // let cells = triangulate(this.points).map(cell => cell.map(i => this.points[i]))
    // TODO: just use Path#intersect (fill) for this
    let cells = []

    // get objects intersecting selection line
    let path = Path.fromPoints(this.points)

    let layers = this.editor.currentLayer.children
    for (let layer of layers) {
      // check if any point is inside selected area
      // let points = layer.toPolyline()
      let inSelection = false

      for (let cell of cells) {
        for (let point of points) {
          let inTriangle = false
          for (let i = 0, j = 2; i < 3; j = i++) {
            if (((cell[i][1] >= point[1]) != (cell[j][1] >= point[1])) &&
              (point[0] <= (cell[j][0] - cell[i][0]) * (point[1] - cell[i][1]) / (cell[j][1] - cell[i][1]) + cell[i][0])) {
              inTriangle = !inTriangle
            }
          }

          if (inTriangle) {
            inSelection = true
            break
          }
        }

        if (inSelection) break
      }

      if (inSelection) {
        this.editor.selection.push(layer)
      } else {
        // check if layer intersects selection path
        if (path.intersect(layer).length) this.editor.selection.push(layer)
      }
    }
  }

  pushPoint (x, y) {
    let lastPoint = this.points[this.points.length - 1]
    if (!lastPoint || (lastPoint.x !== x && lastPoint.y !== y)) {
      this.points.push([x, y])
    }
  }

  strokeStart (x, y) {
    this.points = []
    this.pushPoint(x, y)
  }

  strokeMove (x, y) {
    this.pushPoint(x, y)
  }

  strokeEnd (x, y) {
    this.pushPoint(x, y)

    this.select()
  }
}
