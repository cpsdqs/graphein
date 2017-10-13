const Image = require('./image')
const Brush = require('./brush')

class Canvas extends window.HTMLElement {
  constructor () {
    super()

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')

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
    this.image.render(this.ctx)
    let end = performance.now()
    console.log(`Rendered in ${end - start}ms`)
  }
}

window.customElements.define('graphein-canvas', Canvas)
module.exports = Canvas
