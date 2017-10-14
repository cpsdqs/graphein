const { mat4 } = require('gl-matrix')
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

  render (gl) {
    let near = 0.1
    let far = 1000
    let fov = Math.PI
    let width = this.width
    let height = this.height
    let aspect = width / height

    let projection = mat4.create()
    // TODO: projection

    let result = mat4.create()
    mat4.scale(result, projection, [2 / width, -2 / height, 1])
    mat4.translate(result, result, [-width / 2, -height / 2, 0])

    this.children.forEach(child => child.render(gl, result))
  }
}
