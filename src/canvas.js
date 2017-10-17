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
      selection: []
    }

    this._image = new Image()
    this.updateSize()
  }

  connectedCallback () {
    if (!this._didInit) {
      this._didInit = true
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

  render () {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.enable(this.gl.DEPTH_TEST)

    this.image.render(this.gl, this.context)
  }
}

window.customElements.define('graphein-canvas', Canvas)
module.exports = Canvas
