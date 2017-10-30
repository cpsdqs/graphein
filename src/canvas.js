const { mat4 } = require('gl-matrix')
const Image = require('./image')
const shaders = require('./shaders')

class Canvas extends window.HTMLElement {
  constructor () {
    super()

    this.canvas = document.createElement('canvas')
    this.gl = this.canvas.getContext('webgl')

    this.overlay = document.createElement('canvas')
    this.overlayCtx = this.overlay.getContext('2d')

    this.shaders = shaders(this.gl)

    this.context = {
      shaders: this.shaders,
      transform: mat4.create(),
      width: 0,
      height: 0,
      selection: []
    }

    this._image = new Image()
    this.updateSize()
  }

  connectedCallback () {
    if (!this._didInit) {
      this._didInit = true
      this.tabIndex = this.getAttribute('tabindex') | 0
      this.appendChild(this.canvas)
      this.appendChild(this.overlay)
    }
  }

  updateSize () {
    this.canvas.width = this.image.width * window.devicePixelRatio
    this.canvas.height = this.image.height * window.devicePixelRatio
    this.canvas.style.width = `${this.image.width}px`
    this.canvas.style.height = `${this.image.height}px`

    this.overlay.width = this.canvas.width
    this.overlay.height = this.canvas.height
    this.overlay.style.width = this.canvas.style.width
    this.overlay.style.height = this.canvas.style.height

    this.context.width = this.image.width
    this.context.height = this.image.height
  }

  getProjection () {
    let near = 0.01
    let far = 3000
    let aspect = this.canvas.width / this.canvas.height
    let fov = Math.sqrt(2) / 2

    let projection = mat4.create()
    mat4.perspective(projection, fov, aspect, near, far)
    return projection
  }

  getScreenTransform () {
    let world = mat4.create()
    mat4.scale(world, world, [2 / this.image.width, -2 / this.image.height, 1])
    mat4.translate(world, world, [-this.image.width / 2, -this.image.height / 2, -Math.E])
    return world
  }

  get image () {
    return this._image
  }

  set image (v) {
    this._image = v
    this.dispatchEvent(new Event('image-change'))
    this.updateSize()
    this.render()
  }

  getTransform () {
    let transform = mat4.create()
    mat4.multiply(transform, transform, this.getProjection())
    mat4.multiply(transform, transform, this.context.transform)
    mat4.multiply(transform, transform, this.getScreenTransform())
    return transform
  }

  render () {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthMask(true)
    this.gl.depthFunc(this.gl.LEQUAL)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

    this.image.render(this.gl, this.getTransform(), this.context)
  }
}

window.customElements.define('graphein-canvas', Canvas)
module.exports = Canvas
