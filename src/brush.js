const EventEmitter = require('events')
const Path = require('./path')

// TODO: pen tilt

module.exports = class Brush extends EventEmitter {
  constructor () {
    super()

    this.eventTarget = null
    this.previewLayer = null

    this.size = 10

    this.isDown = false
    this.points = []
    this.previewStroke = null
  }

  bind (target) {
    if (this.eventTarget) console.warn('Binding brush to multiple elements')
    this.eventTarget = target

    if (typeof target.onpointermove === 'undefined') {
      // pointer events not supported
      target.addEventListener('mousedown', this.onMouseDown)
      target.addEventListener('mousemove', this.onMouseMove)
      target.addEventListener('mouseup', this.onMouseUp)
    } else {
      target.addEventListener('pointerdown', this.onPointerDown)
      target.addEventListener('pointermove', this.onPointerMove)
      target.addEventListener('pointerup', this.onPointerUp)
    }
  }

  unbind () {
    if (typeof this.eventTarget.onpointermove === 'undefined') {
      this.eventTarget.removeEventListener('mousedown', this.onMouseDown)
      this.eventTarget.removeEventListener('mousemove', this.onMouseMove)
      this.eventTarget.removeEventListener('mouseup', this.onMouseUp)
    } else {
      this.eventTarget.removeEventListener('pointerdown', this.onPointerDown)
      this.eventTarget.removeEventListener('pointermove', this.onPointerMove)
      this.eventTarget.removeEventListener('pointerup', this.onPointerUp)
    }
  }

  stroke () {

  }

  getCurrentLength () {
    let length = 0
    let lastPoint = [0, 0]
    for (let command of this.previewStroke.data) {
      if (command.type === 0x10) {
        lastPoint = command.data
      } else if (command.type === 0x20) {
        length += Math.hypot(command.data[0] - lastPoint[0], command.data[1] - lastPoint[1])
        lastPoint = command.data
      }
    }
    return length
  }

  onMouseDown = e => {
    this.onPointerDown({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 0.5
    })
  }

  onMouseMove = e => {
    this.onPointerMove({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 0.5,
      getCoalescedEvents: () => []
    })
  }

  onMouseUp = e => {
    this.onPointerUp({
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pressure: 0.5
    })
  }

  onPointerDown = e => {
    this.isDown = true
    this.points = []
    this.points.push({
      x: e.offsetX,
      y: e.offsetY,
      pressure: e.pressure
    })
    this.previewStroke = new Path()
    this.previewStroke.stroke.alpha = 1
    this.previewStroke.data.push(new Path.Command(0x10, e.offsetX, e.offsetY))
    this.previewStroke.data.push(new Path.Command(0x60, 0, e.pressure * this.size / 2, e.pressure * this.size / 2))
    if (this.previewLayer) this.previewLayer.children.push(this.previewStroke)
    this.emit('update')
  }

  onPointerMove = e => {
    if (!this.isDown) return

    let events = [e]
    // coalesced events currently break everything
    // if (e.getCoalescedEvents) events.unshift(...e.getCoalescedEvents())

    for (let event of events) {
      let point = {
        x: event.offsetX,
        y: event.offsetY,
        pressure: event.pressure
      }

      console.log(point.pressure)

      let lastPoint = this.points[this.points.length - 1]
      if (point.x === lastPoint.x && point.y === lastPoint.y) {
        this.points.pop()
        this.previewStroke.data.pop()
        this.previewStroke.data.pop()
      }

      this.points.push(point)
      this.previewStroke.data.push(new Path.Command(0x20, e.offsetX, e.offsetY))
      this.previewStroke.data.push(new Path.Command(0x60, this.getCurrentLength(), e.pressure * this.size / 2, e.pressure * this.size / 2))
    }
    this.emit('update')
  }

  onPointerUp = e => {
    this.isDown = false
    this.points.push({
      x: e.offsetX,
      y: e.offsetY,
      pressure: e.pressure
    })

    this.previewStroke.data.push(new Path.Command(0x20, e.offsetX, e.offsetY))
    this.previewStroke.data.push(new Path.Command(0x60, this.getCurrentLength(), e.pressure * this.size / 2, e.pressure * this.size / 2))

    if (this.previewLayer) {
      // this.previewLayer.children.splice(this.previewLayer.children.indexOf(this.previewStroke), 1)
    }

    console.log(this.previewStroke)

    this.stroke()

    this.emit('update')
  }
}
