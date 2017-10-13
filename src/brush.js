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

    target.addEventListener('pointerdown', this.onPointerDown)
    target.addEventListener('pointermove', this.onPointerMove)
    target.addEventListener('pointerup', this.onPointerUp)
  }

  unbind () {
    this.eventTarget.removeEventListener('pointerdown', this.onPointerDown)
    this.eventTarget.removeEventListener('pointermove', this.onPointerMove)
    this.eventTarget.removeEventListener('pointerup', this.onPointerUp)
  }

  stroke () {

  }

  getCurrentLength () {
    let length = 0
    let lastPoint = [0, 0]
    for (let instruction of this.previewStroke.data) {
      if (instruction.type === 0x10) {
        lastPoint = instruction.data
      } else if (instruction.type === 0x20) {
        length += Math.hypot(instruction.data[0] - lastPoint[0], instruction.data[1] - lastPoint[1])
        lastPoint = instruction.data
      }
    }
    return length
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
    this.previewStroke.data.push(new Path.Instruction(0x10, e.offsetX, e.offsetY))
    this.previewStroke.data.push(new Path.Instruction(0x60, 0, e.pressure * this.size / 2, e.pressure * this.size / 2))
    if (this.previewLayer) this.previewLayer.children.push(this.previewStroke)
    this.emit('update')
  }

  onPointerMove = e => {
    if (!this.isDown) return

    for (let event in e.getCoalescedEvents().concat(e)) {
      this.points.push({
        x: e.offsetX,
        y: e.offsetY,
        pressure: e.pressure
      })

      this.previewStroke.data.push(new Path.Instruction(0x20, e.offsetX, e.offsetY))
    this.previewStroke.data.push(new Path.Instruction(0x60, this.getCurrentLength(), e.pressure * this.size / 2, e.pressure * this.size / 2))
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

    this.previewStroke.data.push(new Path.Instruction(0x20, e.offsetX, e.offsetY))
    this.previewStroke.data.push(new Path.Instruction(0x60, this.getCurrentLength(), e.pressure * this.size / 2, e.pressure * this.size / 2))

    if (this.previewLayer) {
      this.previewLayer.children.splice(this.previewLayer.children.indexOf(this.previewStroke), 1)
    }

    console.log(this.previewStroke)

    this.stroke()

    this.emit('update')
  }
}
