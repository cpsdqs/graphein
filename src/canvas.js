const Image = require('./image')
const Brush = require('./brush')
const shaders = require('./shaders')

class Canvas extends window.HTMLElement {
  constructor () {
    super()

    this.canvas = document.createElement('canvas')
    this.gl = this.canvas.getContext('webgl')

    this.overlay = document.createElement('canvas')
    this.overlayCtx = this.overlay.getContext('2d')

    this.shaders = shaders(this.gl)

    this.brush = new Brush()
    this.brush.bind(this.canvas)

    this._image = new Image()
    this.updateSize()

    this.brush.previewLayer = this._image
    this.brush.on('update', () => this.render())
    this.brush.on('stroke', stroke => {
      this.image.children[this.image.children.length - 1].children.push(stroke)
    })
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
    this.brush.previewLayer = v
    this.updateSize()
    this.render()
  }

  render () {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.enable(this.gl.DEPTH_TEST)

    this.image.render(this.gl, {
      shaders: this.shaders
    })
  }
}

window.customElements.define('graphein-canvas', Canvas)
module.exports = Canvas
