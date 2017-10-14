module.exports = class Color {
  constructor () {
    this.alpha = 0
    this.red = 0
    this.green = 0
    this.blue = 0
  }

  toCSS () {
    return `rgba(${this.red * 255}, ${this.green * 255}, ${this.blue * 255}, ${this.alpha})`
  }

  toVec4 () {
    return [this.red, this.green, this.blue, this.alpha]
  }
}
