const bezier = require('adaptive-bezier-curve')
const arc = require('arc-to')
const { add } = require('./vector-utils')

module.exports = function pathToPolylines (data) {
  let points = []
  let polylines = [points]

  let cursor = [0, 0]

  for (let command of data) {
    let [type, ...args] = command
    let lastCursor = cursor.slice()

    if (type === 0x10 || type === 0x11) {
      // moveto
      if (points.length) polylines.push(points = [])

      if (type === 0x10) cursor = args.slice()
      else cursor = cursor::add(args)

      points.push(cursor)
    } else if (type === 0x20 || type === 0x21) {
      // lineto
      if (type === 0x20) cursor = args.slice()
      else cursor = cursor::add(args)

      points.push(cursor)
    } else if (type === 0x30 || type === 0x31) {
      // curveto
      let c1 = args.slice(0, 2)
      let c2 = args.slice(2, 4)
      cursor = args.slice(4)

      if (type === 0x31) {
        c1 = c1::add(lastCursor)
        c2 = c2::add(lastCursor)
        cursor = cursor::add(lastCursor)
      }

      points.push(...bezier(lastCursor, c1, c2, cursor).slice(1))
    } else if (type === 0x50 || type === 0x51) {
      // arc
      let pos = args.slice(0, 2)
      let radius = args[2]
      let start = args[3]
      let end = args[4]

      points.push(...arc(...pos, radius, start, end))
    }
  }

  return polylines
}
