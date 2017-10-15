module.exports = class Tool {
  constructor (editor) {
    this.editor = editor
  }

  strokeStart (x, y, left, right, e) {
    console.warn(`${this.constructor.name}#strokeStart not implemented`)
  }

  strokeMove (x, y, left, right, e) {
    console.warn(`${this.constructor.name}#strokeMove not implemented`)
  }

  strokeEnd (x, y, left, right, e) {
    console.warn(`${this.constructor.name}#strokeEnd not implemented`)
  }
}
