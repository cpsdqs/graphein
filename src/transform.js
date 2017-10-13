module.exports = class Transform {
  constructor () {
    this.type = Transform.types.NONE
    this.data = new Float32Array([])
  }

  serialize () {
    return this.data
  }

  render (ctx) {
    if (this.type === Transform.types.MAT3) {
      ctx.transform(this.data[0], this.data[1], this.data[3], this.data[4], this.data[6], this.data[7])
    } else if (this.type == Transform.types.MAT4) {
      console.warn('Cannot properly render Mat4 on canvas')
      ctx.transform(this.data[0], this.data[1], this.data[4], this.data[5], this.data[12], this.data[13])
    }
  }

  static deserialize (data) {
    let transform = new Transform()
    transform.type = data.length === 16
      ? Transform.types.MAT4
      : data.length === 9
      ? Transform.types.MAT3
      : Transform.types.NONE
    transform.data = new Float32Array(data.slice())
    return transform
  }

  static types = {
    NONE: 0,
    MAT3: 1,
    MAT4: 2
  }
}
