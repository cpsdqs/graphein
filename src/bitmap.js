const { mat4 } = require('gl-matrix')
const createTexture = require('gl-texture2d')
const createBuffer = require('gl-buffer')
const createVAO = require('gl-vao')
const Layer = require('./layer')

module.exports = class BitmapLayer extends Layer {
  constructor () {
    super()

    this.type = 'b'

    this.anchorX = 0
    this.anchorY = 0
    this._width = 0
    this._height = 0

    this.image = document.createElement('canvas')
    this.ctx = this.image.getContext('2d')

    // cache
    this.dirty = false
    this.texture = null
    this.buffer = null
    this.vao = null
  }

  get width () { return this._width }
  set width (v) {
    let imageData = this.ctx.getImageData(0, 0, this.image.width, this.image.height)
    this._width = this.image.width = v
    this.ctx.putImageData(imageData, 0, 0)
  }
  get height () { return this._height }
  set height (v) {
    let imageData = this.ctx.getImageData(0, 0, this.image.width, this.image.height)
    this._height = this.image.height = v
    this.ctx.putImageData(imageData, 0, 0)
  }

  loadImage (imageData, mime) {
    let binaryString = ''
    for (let i = 0; i < imageData.length; i++) binaryString += String.fromCharCode(imageData[i])
    let imageURL = `data:${mime};base64,${btoa(binaryString)}`
    let image = new window.Image()
    image.addEventListener('load', e => {
      this.ctx.drawImage(image, 0, 0)
    })
    image.addEventListener('error', e => {
      this.ctx.fillStyle = '#f00'
      this.ctx.textBaseline = 'top'
      this.ctx.fillText('Failed to load image', 0, 0)
    })
    image.src = imageURL
  }

  render (gl, transform, context) {
    let subTransform = mat4.create()
    mat4.multiply(subTransform, transform, this.transform.toMat4())
    this.renderChildren(gl, subTransform, context)

    if (!this.texture || this.texture.gl !== gl) {
      if (this.texture) this.texture.dispose()
      this.texture = createTexture(gl, this.image)
      this.texture.magFilter = gl.NEAREST
      this.texture.minFilter = gl.LINEAR
      this.dirty = false
    } else if (this.dirty) {
      this.texture.setPixels(this.image)
      this.dirty = false
    }

    if (!this.buffer || this.buffer.gl !== gl) {
      if (this.buffer) this.buffer.dispose()
      this.buffer = createBuffer(gl, [
        1, 1,
        0, 1,
        1, 0,
        0, 0
      ])
    }
    if (!this.vao || this.vao.gl !== gl) {
      if (this.vao) this.vao.dispose()
      this.vao = createVAO(gl, [{
        buffer: this.buffer,
        type: gl.FLOAT,
        size: 2
      }])
    }

    let imageTransform = mat4.create()
    mat4.translate(imageTransform, subTransform, [-this.anchorX * this.width, -this.anchorY * this.height, 0])
    mat4.scale(imageTransform, imageTransform, [this.width, this.height, 1])

    const shader = context.shaders.bitmap
    shader.bind()
    shader.uniforms.transform = imageTransform
    // shader.uniforms.texture = this.texture.bind()

    this.vao.bind()
    this.vao.draw(gl.TRIANGLE_STRIP, 4)
    this.vao.unbind()
  }

  serialize () {
    let dataURL = this.image.toDataURL().replace(/^data:/, '')
    let mime = dataURL.substr(0, dataURL.indexOf(';'))
    let binaryString = atob(dataURL.replace(/^.+(;|,)/, ''))
    let bytes = []
    for (let i = 0; i < binaryString.length; i++) {
      bytes.push(binaryString.charCodeAt(i))
    }
    let binary = new Uint8Array(bytes)

    return Object.assign(super.serialize(), {
      x: this.anchorX,
      y: this.anchorY,
      w: this.width,
      h: this.height,
      m: mime,
      d: binary
    })
  }

  static deserialize (data) {
    let layer = new BitmapLayer()
    Layer.deserializeLayerData(layer, data)

    layer.anchorX = data.x
    layer.anchorY = data.y
    layer.width = data.w
    layer.height = data.h
    layer.loadImage(data.d, data.m)

    return layer
  }
}
