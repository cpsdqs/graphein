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
    let far = 1000
    let fov = Math.PI

    let projection = mat4.create()

    // copied from three.js
    let top = near * Math.tan(fov / 2)
    let height = 2 * top
    let width = (this.width / this.height) * height
    let left = -width / 2
    let right = left + width
    let bottom = top - height

    let x = 2 * near / (right - left)
    let y = 2 * near / (top - bottom)
    let a = (right + left) / (right - left)
    let b = (top + bottom) / (top - bottom)
    let c = -(far + near) / (far - near)
    let d = -2 * far * near / (far - near)

    // doesn't work for some reason
    // TODO: look into how this actually works
    /* projection[0] = x
    projection[5] = y
    projection[8] = a
    projection[9] = b
    projection[10] = c
    projection[11] = -1
    projection[14] = d
    projection[15] = 0 */

    let result = mat4.create()
    mat4.scale(result, projection, [2 / this.width, -2 / this.height, 1])
    mat4.translate(result, result, [-this.width / 2, -this.height / 2, 0])

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
