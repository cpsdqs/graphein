const Transform = require('./transform')
const { mat4 } = require('gl-matrix')

module.exports = class Layer {
  constructor () {
    this.type = Layer.types.GROUP
    this.transform = new Transform()
    this.children = []
  }

  serialize () {
    return {
      type: this.type,
      transform: this.transform.serialize(),
      children: this.children.map(child => child.serialize())
    }
  }

  render (gl, transform) {
    let subTransform = mat4.create()
    mat4.multiply(subTransform, transform, this.transform.toMat4())
    this.children.forEach(child => child.render(gl, subTransform))
  }

  static types = {
    GROUP: 'g',
    PATH: 'p',
    CLIPPING_MASK: 'c',
    RECTANGLE: 'sr',
    CIRCLE: 'sc',
    TEXT: 't',
    RASTER_IMAGE: 'b'
  }
}
