const Canvas = require('./canvas')
const Image = require('./image')
const Layer = require('./layer')
const Transform = require('./transform')
const Path = require('./path')

const graphein = {
  Canvas,
  Image,
  Layer,
  Transform,
  Path
}

module.exports = window.graphein = graphein
