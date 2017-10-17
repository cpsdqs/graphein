const arc = require('arc-to')
const Path = require('./path')
const Color = require('./color')
const Brush = require('./brush')
const Select = require('./select')

module.exports = class Editor {
  constructor (canvas) {
    this.canvas = canvas

    this.down = false
    this.previewMaxWidth = null
    this.previewStrokes = []
    this.previewStroke = null
    this.lastPoint = null

    this.tools = {
      brush: new Brush(this),
      select: new Select(this)
    }

    this.tool = this.tools.brush

    this.currentLayer = canvas.image.children[0]
    this.cursorSize = 10
    this.tiltAmount = 0.3
    this.erasing = false

    this.canvas.addEventListener('image-change', e => {
      this.currentLayer = canvas.image.children[0]
    })

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

  get selection () {
    return this.canvas.context.selection
  }

  set selection (v) {
    this.canvas.context.selection = v
  }

  updateImage () {
    this.currentLayer = canvas.image.children[0]
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

  createPreviewStroke () {
    this.previewStroke = new Path()
    this.previewStrokes.push(this.previewStroke)

    if (this.erasing) {
      this.previewStroke.stroke = new Color(0, 1, 0, 0.5)
      this.previewMaxWidth = 30
    } else {
      this.previewStroke.stroke = new Color(1, 0, 1, 0.5)
      this.previewMaxWidth = 10
    }

    this.canvas.image.appendChild(this.previewStroke)
  }

  onPointerDown = e => {
    this.down = 'pointer'

    this.cursorSize = e.pointerType === 'pen' && e.button === 5 ? 30 : 10
    this.renderCursor(e.offsetX, e.offsetY, e.pressure, e.tiltX, e.tiltY)

    this.erasing = e.pointerType === 'pen' && e.button === 5

    if (this.erasing) {
      // TEMP: selection!
      this.tool = this.tools.select
    } else this.tool = this.tools.brush

    this.previewStrokes = []
    this.createPreviewStroke()

    let left = e.pressure * this.previewMaxWidth / 2
    let right = e.pressure * this.previewMaxWidth / 2
    this.previewStroke.addRoughPoint(e.offsetX, e.offsetY, left, right, true)

    this.lastPoint = [e.offsetX, e.offsetY]

    this.tool.strokeStart(e.offsetX, e.offsetY, left, right, e)
    this.canvas.render()
  }

  handleSinglePointerMove (e) {
    if (!this.down) this.cursorSize = 10
    this.renderCursor(e.offsetX, e.offsetY, e.pressure, e.tiltX, e.tiltY)

    if (this.down !== 'pointer') return

    // TODO: deduplicate points

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
    left += this.tiltAmount * Math.abs(vecLeft.map((x, i) => x * tiltVector[i]).reduce((a, b) => a + b, 0) * this.previewMaxWidth * tiltLength)
    right += this.tiltAmount * Math.abs(vecRight.map((x, i) => x * tiltVector[i]).reduce((a, b) => a + b, 0) * this.previewMaxWidth * tiltLength)

    this.previewStroke.addRoughPoint(e.offsetX, e.offsetY, left, right)

    if (this.previewStroke.roughLength > 400) {
      // split stroke to prevent lag
      this.createPreviewStroke()
      this.previewStroke.addRoughPoint(e.offsetX, e.offsetY, left, right, true)
    }

    this.lastPoint = [e.offsetX, e.offsetY]

    this.tool.strokeMove(e.offsetX, e.offsetY, left, right, e)
  }

  onPointerMove = e => {
    let events = [e]
    if (e.getCoalescedEvents) events.unshift(...e.getCoalescedEvents())

    for (let event of events) this.handleSinglePointerMove(event)

    this.canvas.render()
  }

  onPointerUp = e => {
    if (this.down !== 'pointer') return
    this.down = null
    let left = e.pressure * this.previewMaxWidth / 2
    let right = e.pressure * this.previewMaxWidth / 2

    for (let stroke of this.previewStrokes) {
      stroke.parentNode.removeChild(stroke)
    }

    this.previewStroke = null
    this.previewStrokes = []

    this.renderCursor(e.offsetX, e.offsetY, e.pressure, e.tiltX, e.tiltY)
    this.tool.strokeEnd(e.offsetX, e.offsetY, left, right, e)
    this.canvas.render()
  }

  onPointerOut = e => {
    this.renderCursor(-1, -1, 0, 0, 0)
    this.onPointerUp(e)
  }

  onMouseDown = e => {
    this.onPointerDown({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 0, // taper ends
      tiltX: 0,
      tiltY: 0
    })
  }
  onMouseMove = e => {
    this.onPointerMove({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 1,
      tiltX: 0,
      tiltY: 0
    })
  }
  onMouseUp = e => {
    this.onPointerUp({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 0, // taper ends
      tiltX: 0,
      tiltY: 0
    })
  }
}
