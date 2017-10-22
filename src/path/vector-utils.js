exports.add = function addVector2D (b) {
  return [this[0] + b[0], this[1] + b[1]]
}
exports.mix = function mixVector2D (b, mix) {
  return [
    this[0] + (b[0] - this[0]) * mix,
    this[1] + (b[1] - this[1]) * mix
  ]
}
exports.invert = function invertVector2D () {
  return [-this[0], -this[1]]
}
exports.scale = function scaleVector2D (b) {
  return [this[0] * b, this[1] * b]
}
exports.distanceTo = function distanceToVector2D (b) {
  return Math.hypot(b[0] - this[0], b[1] - this[1])
}
