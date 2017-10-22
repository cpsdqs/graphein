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

  getWorldTransform () {
    let near = 0.1
    let far = 100
    let fov = Math.sqrt(2) / 2

    let projection = mat4.create()
    let a = Math.tan(Math.PI / 2 - fov / 2)
    let b = 1 / (near - far)

    projection[0] = a / b
    projection[5] = a
    projection[10] = b * (near + far)
    projection[11] = -1
    projection[14] = 2 * b * near * far
    projection[15] = 0

    let result = mat4.create()
    mat4.scale(result, projection, [-1 / (this.width * 50), -2 / this.height, 1])
    mat4.translate(result, result, [-this.width / 2, -this.height / 2, -Math.E])

    return result
  }

  render (gl, context) {
    this.renderChildren(gl, this.getWorldTransform(), context)
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
