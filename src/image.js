const Layer = require('./layer')

module.exports = class Image extends Layer {
  constructor () {
    super()

    // TODO: don't hardcode
    this.version = 0
    this.width = 100
    this.height = 100
  }

  serialize () {
    return {
      version: this.version,
      w: this.width,
      h: this.height,
      c: this.children.map(child => child.serialize())
    }
  }

  render (ctx) {
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, this.width, this.height)
    ctx.clip()
    this.children.forEach(child => child.render(ctx))
    ctx.restore()
  }
}
