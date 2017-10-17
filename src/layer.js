const Transform = require('./transform')
const { mat4 } = require('gl-matrix')

const registry = {
  types: {},
  define (type, typeClass) {
    if (this.types[type]) {
      throw new Error(`Layer type registry: ${type} already exists`)
    }
    this.types[type] = typeClass
    return typeClass
  }
}

module.exports = registry.types.g = class Layer {
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
      this.children.splice(this.children.indexOf(child), 1)
      child.parentNode = null
    }
  }

  static deserializeLayerData (layer, data) {
    layer.transform = Transform.deserialize(data.a)
    layer.children = Layer.deserializeChildren(data.c, layer)
  }

  static deserialize (data) {
    let group = new Layer()
    if (data.t !== Layer.types.GROUP) {
      throw new Error(`Tried to deserialize layer of type ${data.t} as g`)
    }
    group.transform = Transform.deserialize(data.a)
    group.children = Layer.deserializeChildren(data.c, group)

    return group
  }

  static registry = registry

  static deserializeChildren (data, parentNode) {
    if (!data) return []
    let children = []

    for (let item of data) {
      if (registry.types[item.t]) {
        let child = registry.types[item.t].deserialize(item)
        child.parentNode = parentNode
        children.push(child)
      } else {
        throw new Error(`Unknown layer type: ${item.t}`)
      }
    }

    return children
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
