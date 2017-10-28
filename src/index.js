const Canvas = require('./canvas')
const Color = require('./color')
const Image = require('./image')
const Layer = require('./layer')
const Transform = require('./transform')
const Path = require('./path')
const Editor = require('./editor')
const Bitmap = require('./bitmap')

const graphein = {
  Canvas,
  Color,
  Image,
  Layer,
  Transform,
  Path,
  Editor,
  Bitmap
}

module.exports = window.graphein = graphein
