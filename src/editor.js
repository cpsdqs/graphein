const arc = require('arc-to')
const Path = require('./path')
const Color = require('./color')

module.exports = class Editor {
  constructor (canvas) {
    this.canvas = canvas

    this.down = false
    this.previewMaxWidth = null
    this.previewStroke = null
    this.lastPoint = null

    this.cursorSize = 10

    this.canvas.style.cursor = 'none'

    if (typeof this.canvas.onpointermove !== 'undefined') {
      this.canvas.addEventListener('pointerdown', this.onPointerDown)
      this.canvas.addEventListener('pointermove', this.onPointerMove)
      this.canvas.addEventListener('pointerup', this.onPointerUp)
      this.canvas.addEventListener('pointerout', this.onPointerOut)
    } else {
      this.canvas.addEventListener('mousedown', this.onMouseDown)
      this.canvas.addEventListener('mousemove', this.onMouseMove)
      this.canvas.addEventListener('mouseup', this.onMouseUp)
      this.canvas.addEventListener('mouseout', this.onMouseUp)

      // TODO: touch
    }
  }

  renderCursor (x, y, p, dx, dy) {
    const ctx = this.canvas.overlayCtx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.overlay.width, this.canvas.overlay.height)
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    if (x < 0 || y < 0) return
    if (!this.down && p === 0) p = 1

    ctx.translate(x, y)

    ctx.save()
    ctx.rotate(-Math.atan2(dx, -dy))

    let scaleY = 1 + Math.hypot(dx, dy) / 10

    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()

    let radius = p * this.cursorSize / 4
    let points = arc(0, 0, radius, 0, Math.PI * 2)
    let first = true
    for (let point of points) {
      let [x, y] = point

      if (first) ctx.moveTo(x, y * scaleY + (scaleY - 1) * radius)
      else ctx.lineTo(x, y * scaleY + (scaleY - 1) * radius)

      first = false
    }

    ctx.stroke()

    ctx.restore()
  }

  onPointerDown = e => {
    this.down = 'pointer'

    this.cursorSize = e.pointerType === 'pen' && e.button === 5 ? 30 : 10
    this.renderCursor(e.offsetX, e.offsetY, e.pressure, e.tiltX, e.tiltY)

    this.previewStroke = new Path()

    if (e.pointerType === 'pen' && e.button === 5) {
      // eraser
      this.previewStroke.stroke = new Color(0, 1, 0, 0.5)
      this.previewMaxWidth = 30
    } else {
      this.previewStroke.stroke = new Color(1, 0, 1, 0.5)
      this.previewMaxWidth = 10
    }

    this.canvas.image.appendChild(this.previewStroke)
    let left = e.pressure * this.previewMaxWidth / 2
    let right = e.pressure * this.previewMaxWidth / 2
    this.previewStroke.addRoughPoint(e.offsetX, e.offsetY, left, right, true)

    this.lastPoint = [e.offsetX, e.offsetY]

    this.canvas.render()
  }

  onPointerMove = e => {
    if (!this.down) this.cursorSize = 10
    this.renderCursor(e.offsetX, e.offsetY, e.pressure, e.tiltX, e.tiltY)

    if (this.down !== 'pointer') return

    let vec = [e.offsetX, e.offsetY].map((x, i) => x - this.lastPoint[i])
    let angle = Math.atan2(...vec)

    // angles:
    //        pi
    // -pi/2      pi/2
    //        0

    let tiltAngle = Math.atan2(e.tiltX, -e.tiltY)
    let tiltLength = Math.hypot(e.tiltX, e.tiltY) / 100

    // left normal vector
    let vecLeft = [Math.cos(angle + Math.PI / 2), Math.sin(angle + Math.PI / 2)]
    // right normal vector
    let vecRight = [Math.cos(angle - Math.PI / 2), Math.sin(angle - Math.PI / 2)]

    let tiltVector = [Math.cos(tiltAngle), Math.sin(tiltAngle)]

    let left = e.pressure * this.previewMaxWidth / 2
    let right = e.pressure * this.previewMaxWidth / 2

    // dot left normal with tilt vector to get amount
    left += vecLeft.map((x, i) => x * tiltVector[i]).reduce((a, b) => a + b, 0) * this.previewMaxWidth * tiltLength
    right += vecRight.map((x, i) => x * tiltVector[i]).reduce((a, b) => a + b, 0) * this.previewMaxWidth * tiltLength

    this.previewStroke.addRoughPoint(e.offsetX, e.offsetY, left, right)

    this.lastPoint = [e.offsetX, e.offsetY]

    this.canvas.render()
  }

  onPointerUp = e => {
    if (this.down !== 'pointer') return
    this.down = null
    let left = e.pressure * this.previewMaxWidth / 2
    let right = e.pressure * this.previewMaxWidth / 2
    this.previewStroke.addRoughPoint(e.offsetX, e.offsetY, left, right)
    this.previewStroke.parentNode.removeChild(this.previewStroke)

    this.renderCursor(e.offsetX, e.offsetY, e.pressure, e.tiltX, e.tiltY)
    this.canvas.render()
  }

  onPointerOut = e => {
    this.renderCursor(-1, -1, 0, 0, 0)
    this.onPointerUp(e)
  }
}
