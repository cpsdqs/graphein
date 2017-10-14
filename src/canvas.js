const Image = require('./image')
const Brush = require('./brush')

class Canvas extends window.HTMLElement {
  constructor () {
    super()

    this.canvas = document.createElement('canvas')
    this.gl = this.canvas.getContext('webgl')

    this.brush = new Brush()
    this.brush.bind(this.canvas)

    this._image = new Image()
    this.brush.previewLayer = this._image
    this.brush.on('update', () => this.render())
  }

  connectedCallback () {
    if (!this._didInit) {
      this._didInit = true
      this.appendChild(this.canvas)
    }
  }

  get image () {
    return this._image
  }

  set image (v) {
    this._image = v
    this.brush.previewLayer = v
    this.render()
  }

  render () {
    let start = performance.now()

    this.gl.clearColor(1, 1, .9, 1)
    this.gl.viewport(0, 0, this.image.width, this.image.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.image.render(this.gl)

    let end = performance.now()
    console.log(`Rendered in ${end - start}ms`)
  }
}

window.customElements.define('graphein-canvas', Canvas)
module.exports = Canvas
