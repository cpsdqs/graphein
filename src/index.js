const Canvas = require('./canvas')
const Color = require('./color')
const Image = require('./image')
const Layer = require('./layer')
const Transform = require('./transform')
const Path = require('./path')

const graphein = {
  Canvas,
  Color,
  Image,
  Layer,
  Transform,
  Path
}

module.exports = window.graphein = graphein
