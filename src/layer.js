const Transform = require('./transform')
const { mat4 } = require('gl-matrix')

module.exports = class Layer {
  constructor () {
    this.type = Layer.types.GROUP
    this.transform = new Transform()
    this.children = []
    this.parentNode = null
  }

  serialize () {
    return {
      t: this.type,
      a: this.transform.serialize(),
      c: this.children.map(child => child.serialize())
    }
  }

  render (gl, transform, context) {
    let subTransform = mat4.create()
    mat4.multiply(subTransform, transform, this.transform.toMat4())
    this.renderChildren(gl, subTransform, context)
  }

  renderChildren (gl, transform, context) {
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].render(gl, transform, context)
    }
  }

  appendChild (child) {
    if (!child.parentNode) {
      this.children.push(child)
      child.parentNode = this
    } else {
      throw new Error('Cannot add child to multiple parents')
    }
  }

  removeChild (child) {
    if (child.parentNode === this) {
      this.children.splice(this.children.indexOf(child, 1))
      child.parentNode = null
    }
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
