const { mat4 } = require('gl-matrix')
const Layer = require('./layer')

const version = '0.0.0'

module.exports = class Image extends Layer {
  constructor () {
    super()

    // TODO: don't hardcode
    this.version = version
    this.width = 100
    this.height = 100
    this.depth = 100
  }

  serialize () {
    return {
      version: this.version,
      w: this.width,
      h: this.height,
      d: this.depth,
      c: this.children.map(child => child.serialize())
    }
  }

  render (gl, transform, context) {
    this.renderChildren(gl, transform, context)
  }

  static deserialize (data) {
    if (data.version !== version) throw new Error('Version does not match: ' + data.version)

    let image = new Image()
    image.width = data.w
    image.height = data.h
    image.depth = data.d
    image.children = Layer.deserializeChildren(data.c, image)

    return image
  }
}
