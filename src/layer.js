const Transform = require('./transform')

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

  render (ctx) {
    ctx.save()
    this.transform.render(ctx)
    this.children.forEach(child => child.render(ctx))
    ctx.restore()
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
