const Image = require('./image')

class Canvas extends window.HTMLElement {
  constructor () {
    super()

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')

    this._image = new Image()
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
    this.render()
  }

  render () {
    this.image.render(this.ctx)
  }
}

window.customElements.define('graphein-canvas', Canvas)
module.exports = Canvas
