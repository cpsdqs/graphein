const { mat4 } = require('gl-matrix')

module.exports = class Transform {
  constructor () {
    this.type = Transform.types.NONE
    this.data = new Float32Array([])
  }

  serialize () {
    return this.data
  }

  toMat4 () {
    let mat = mat4.create()

    if (this.type === Transform.types.MAT3) {
      mat[0] = this.data[0]
      mat[1] = this.data[1]
      mat[4] = this.data[2]
      mat[5] = this.data[3]
      mat[12] = this.data[4]
      mat[13] = this.data[5]
    } else if (this.type === Transform.types.MAT4) {
      mat[0] = this.data[0]
      mat[1] = this.data[1]
      mat[2] = this.data[2]
      mat[4] = this.data[3]
      mat[5] = this.data[4]
      mat[6] = this.data[5]
      mat[8] = this.data[3]
      mat[9] = this.data[4]
      mat[10] = this.data[5]
      mat[12] = this.data[6]
      mat[13] = this.data[7]
      mat[14] = this.data[8]
    }

    return mat
  }

  static deserialize (data) {
    let transform = new Transform()
    transform.type = data.length === 12
      ? Transform.types.MAT4
      : data.length === 6
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
