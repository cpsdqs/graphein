const { mix, distanceTo } = require('./vector-utils')

exports.getInterpolationAtLength = function getInterpolationAtLengthOnPolyline (points, length) {
  if (length < 0 || points.length < 2) return [0, 0, 0]

  let lastLength = 0
  let currentLength = 0
  let index = -1

  for (let i = 1; i < points.length; i++) {
    currentLength += points[i - 1]::distanceTo(points[i])
    if (currentLength > length) {
      index = i
      break
    }
    lastLength = currentLength
  }

  if (index === -1) return [points.length - 1, points.length - 1, 0]

  let mix = (length - lastLength) / (currentLength - lastLength)
  return [index - 1, index, mix]
}

exports.getPointAtLength = function getPointAtLengthOnPolyline (points, length) {
  if (length < 0 || points.length < 2) {
    if (points.length > 1) {
      let angle = Math.atan2(points[0][1] - points[1][1], points[0][0] - points[1][0])

      return [
        points[0][0] + Math.cos(angle) * -length,
        points[0][1] + Math.sin(angle) * -length
      ]
    } else return points[0].slice()
  }

  let lastLength = 0
  let currentLength = 0
  let index = -1

  for (let i = 1; i < points.length; i++) {
    currentLength += points[i - 1]::distanceTo(points[i])
    if (currentLength > length) {
      index = i
      break
    }
    lastLength = currentLength
  }

  if (index === -1) {
    let lastPoint = points[points.length - 1]
    let prevPoint = points[points.length - 2]
    let angle = Math.atan2(lastPoint[1] - prevPoint[1], lastPoint[0] - prevPoint[0])

    return [
      lastPoint[0] + Math.cos(angle) * (length - lastLength),
      lastPoint[1] + Math.sin(angle) * (length - lastLength)
    ]
  }

  let prevPoint = points[index - 1]
  let nextPoint = points[index]
  let mixAmount = (length - lastLength) / (currentLength - lastLength)

  return prevPoint::mix(nextPoint, mixAmount)
}

exports.getPartialLengths = function* getPartialPolylineLengths (points) {
  let length = 0

  yield length

  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    yield length
  }
}
