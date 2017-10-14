module.exports = class Color {
  constructor (r = 0, g = 0, b = 0, a = 1) {
    this.alpha = a
    this.red = r
    this.green = g
    this.blue = b
  }

  toCSS () {
    return `rgba(${this.red * 255}, ${this.green * 255}, ${this.blue * 255}, ${this.alpha})`
  }

  toVec4 () {
    return [this.red, this.green, this.blue, this.alpha]
  }

  serialize () {
    let color = 255 - (this.alpha * 255) | 0
    color |= (this.red * 255) << 8
    color |= (this.green * 255) << 8
    color |= (this.blue * 255) << 8
    return color
  }

  static deserialize (color) {
    return new Color(
      ((color >> 8) & 0xFF) / 255,
      ((color >> 16) & 0xFF) / 255,
      (color >> 24) / 255,
      1 - (color & 0xFF) / 255
    )
  }
}
