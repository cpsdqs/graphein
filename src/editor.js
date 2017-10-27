const arc = require('arc-to')
const { vec2, vec3, mat4 } = require('gl-matrix')
const { distanceTo } = require('./path/vector-utils')
const Path = require('./path')
const Color = require('./color')
const Brush = require('./brush')
const Eraser = require('./eraser')
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
      eraser: new Eraser(this),
      select: new Select(this)
    }

    this.tool = this.tools.brush

    this.currentLayer = canvas.image.children[0]
    this.cursorSize = 10
    this.tiltAmount = 0.3
    this.erasing = false

    this.lastMouse = [0, 0]

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

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault()
      if (e.shiftKey) {
        let transform = this.canvas.context.transform
        let rotY = -e.deltaX / 200
        let rotX = -e.deltaY / 200
        mat4.rotate(transform, transform, rotX, [1, 0, 0])
        mat4.rotate(transform, transform, rotY, [0, 1, 0])
      } else if (e.ctrlKey) {
        this.scaleCanvas(1 - (e.deltaY / 100), this.screenToGL(this.lastMouse))
      } else {
        let transform = this.canvas.context.transform
        transform[12] += -e.deltaX / this.canvas.context.width
        transform[13] += e.deltaY / this.canvas.context.height
      }
      this.canvas.render()
    })

    let lastGestureScale = 0
    let lastGestureRotation = 0
    this.canvas.addEventListener('gesturestart', e => {
      e.preventDefault()
      lastGestureScale = e.scale
      lastGestureRotation = e.rotation
    })
    this.canvas.addEventListener('gesturechange', e => {
      e.preventDefault()

      let deltaScale = e.scale - lastGestureScale
      this.scaleCanvas(1 + deltaScale, this.screenToGL(this.lastMouse))

      let transform = this.canvas.context.transform
      let inverted = mat4.create()
      mat4.invert(inverted, transform)

      let pivot = this.screenToGL(this.lastMouse)
      vec3.transformMat4(pivot, pivot, inverted)

      mat4.translate(transform, transform, pivot)
      let deltaRotZ = e.rotation - lastGestureRotation
      mat4.rotate(transform, transform, -deltaRotZ / 180 * Math.PI, [0, 0, 1])
      mat4.translate(transform, transform, vec3.scale(pivot, pivot, -1))

      lastGestureScale = e.scale
      lastGestureRotation = e.rotation
    })
    this.canvas.addEventListener('gestureend', e => {
      e.preventDefault()
    })

    this.canvas.addEventListener('keydown', e => {
      let preventDefault = true

      if (e.key === '1') {
        this.scaleCanvas(0.9)
      } else if (e.key === '2') {
        this.scaleCanvas(1.1)
      } else if (e.key === 'M' && e.shiftKey) {
        this.canvas.context.transform = mat4.create()
        this.canvas.render()
      } else preventDefault = false

      if (preventDefault) e.preventDefault()
    })
  }

  get selection () {
    return this.canvas.context.selection
  }

  set selection (v) {
    this.canvas.context.selection = v
  }

  scaleCanvas (factor, pivot) {
    let transform = this.canvas.context.transform
    let inverted = mat4.create()
    mat4.invert(inverted, transform)

    pivot = pivot || [0, 0, 0]
    vec3.transformMat4(pivot, pivot, inverted)

    mat4.translate(transform, transform, pivot)
    mat4.scale(transform, transform, [factor, factor, 1])
    mat4.translate(transform, transform, vec3.scale(pivot, pivot, -1))
    this.canvas.render()
  }

  updateImage () {
    this.currentLayer = canvas.image.children[0]
  }

  screenToGL (point, transform) {
    let magicNumber = transform
      ? vec3.transformMat4(vec3.create(), [0, 0, 0], transform)[2]
      : 0
    return [
      2 * point[0] / this.canvas.context.width - 1,
      -2 * point[1] / this.canvas.context.height + 1,
      magicNumber
    ]
  }

  glToScreen (point) {
    return [
      (point[0] + 1) / 2 * this.canvas.context.width,
      (-point[1] - 1) / 2 * this.canvas.context.height
    ]
  }

  projectPoint (point) {
    let transform = this.canvas.getTransform()
    let inverted = mat4.create()
    mat4.invert(inverted, transform)

    let glPoint = this.screenToGL(point, transform)
    vec3.transformMat4(glPoint, glPoint, inverted)
    return glPoint
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

    let scaleY = 1 + Math.hypot(dx, dy) / 40

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

    this.erasing = e.altKey || e.pointerType === 'pen' && e.button === 5

    if (e.shiftKey) {
      // TEMP: shift to select
      this.tool = this.tools.select
    } else if (this.erasing) {
      // TEMP: erasing!
      this.tool = this.tools.eraser
    } else this.tool = this.tools.brush

    this.previewStrokes = []
    this.createPreviewStroke()

    let [x, y] = this.projectPoint([e.offsetX, e.offsetY])

    let left = e.pressure * this.previewMaxWidth / 2
    let right = e.pressure * this.previewMaxWidth / 2
    this.previewStroke.addRoughPoint(x, y, left, right, true)

    this.lastPoint = [x, y]
    this.roughLength = 0

    this.tool.strokeStart(x, y, left, right, this.roughLength, e)
    this.lastMouse = [e.offsetX, e.offsetY]
    this.canvas.render()
  }

  handleSinglePointerMove (e) {
    if (!this.down) this.cursorSize = 10
    this.renderCursor(e.offsetX, e.offsetY, e.pressure, e.tiltX, e.tiltY)

    if (this.down !== 'pointer') return

    // TODO: deduplicate points

    let [x, y] = this.projectPoint([e.offsetX, e.offsetY])

    let vec = [x, y].map((x, i) => x - this.lastPoint[i])
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

    if (!e.isCoalescedEvent) {
      this.previewStroke.addRoughPoint(x, y, left, right)

      if (this.previewStroke.roughLength > 400) {
        // split stroke to prevent lag
        this.createPreviewStroke()
        this.previewStroke.addRoughPoint(x, y, left, right, true)
      }
    }

    this.roughLength += this.lastPoint::distanceTo([x, y])

    this.lastPoint = [x, y]

    this.tool.strokeMove(x, y, left, right, this.roughLength, e)
  }

  onPointerMove = e => {
    let events = [e]
    if (e.getCoalescedEvents) events.unshift(...e.getCoalescedEvents().map(e => {
      e.isCoalescedEvent = true
      return e
    }))

    for (let event of events) this.handleSinglePointerMove(event)

    this.lastMouse = [e.offsetX, e.offsetY]
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
    this.tool.strokeEnd(e.offsetX, e.offsetY, left, right, this.roughLength, e)
    this.lastMouse = [e.offsetX, e.offsetY]
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
      pressure: 1,
      tiltX: 0,
      tiltY: 0,
      shiftKey: e.shiftKey,
      altKey: e.altKey
    })
  }
  onMouseMove = e => {
    this.onPointerMove({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 1,
      tiltX: 0,
      tiltY: 0,
      shiftKey: e.shiftKey,
      altKey: e.altKey
    })
  }
  onMouseUp = e => {
    this.onPointerUp({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 1,
      tiltX: 0,
      tiltY: 0,
      shiftKey: e.shiftKey,
      altKey: e.altKey
    })
  }
}
