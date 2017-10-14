/*
 * paper.js PathFitter modified for Graphein
 */

/*
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2016, Juerg Lehni & Jonathan Puckey
 * http://scratchdisk.com/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

// An Algorithm for Automatically Fitting Digitized Curves
// by Philip J. Schneider
// from "Graphics Gems", Academic Press, 1990
// Modifications and optimizations of original algorithm by Juerg Lehni.

// paperjs shim

// Numerical.EPSILON
const EPSILON = 1e-12

// Numerical.isZero
const isZero = x => Math.abs(x) <= EPSILON

// Point methods
const add = function (b) {
  return this.map((x, i) => x + b[i])
}
const subtract = function (b) {
  return this.map((x, i) => x - b[i])
}
const getDistance = function (b) {
  return Math.hypot(...this::subtract(b))
}
const normalize = function (length = 1) {
  let scale = length / Math.hypot(...this)
  if (!Number.isFinite(scale)) scale = 0
  return this.map((x) => x * scale)
}
const negate = function () {
  return this.map(x => -x)
}
const multiply = function (b) {
  return this.map(x => x * b)
}
const dot = function (b) {
  return this.map((x, i) => x * b[i]).reduce((a, b) => a + b, 0)
}

// simple Segment implementation
class Segment {
  constructor (point = [0, 0], handleIn = [0, 0], handleOut = [0, 0]) {
    this.point = point
    this.handleIn = handleIn
    this.handleOut = handleOut
  }

  setHandleOut (point) {
    this.handleOut = point
  }

  // additional utilities not required by path fitter

  handleInLength () {
    return Math.hypot(...this.handleIn)
  }

  handleOutLength () {
    return Math.hypot(...this.handleOut)
  }
}

/**
 * @name PathFitter
 * @class
 * @private
 */
module.exports = class PathFitter {
  constructor (pathPoints, closed = false) {
    let points = this.points = pathPoints

    // We need to duplicate the first and last segment when simplifying a
    // closed path.
    if (closed) {
      points.unshift(points[points.length - 1])
      points.push(points[1]) // The point previously at index 0 is now 1.
    }

    this.closed = closed
  }

  fit (error) {
    let points = this.points
    let length = points.length
    let segments = null

    if (length > 0) {
      // To support reducing paths with multiple points in the same place
      // to one segment:
      segments = [new Segment(points[0])]

      if (length > 1) {
        this.fitCubic(segments, error, 0, length - 1,
          // Left Tangent
          points[1]::subtract(points[0]),
          // Right Tangent
          points[length - 2]::subtract(points[length - 1]))

        // Remove the duplicated segments for closed paths again.
        if (this.closed) {
          segments.shift()
          segments.pop()
        }
      }
    }

    return segments
  }

  // Fit a Bezier curve to a (sub)set of digitized points
  fitCubic (segments, error, first, last, tan1, tan2) {
    let points = this.points

    // Use heuristic if region only has two points in it
    if (last - first === 1) {
      let pt1 = points[first]
      let pt2 = points[last]
      let dist = pt1::getDistance(pt2) / 3

      this.addCurve(segments, [pt1, pt1::add(tan1::normalize(dist)),
        pt2::add(tan2::normalize(dist)), pt2])
      return
    }

    // Parameterize points, and attempt to fit curve
    let uPrime = this.chordLengthParameterize(first, last)
    let maxError = Math.max(error, error * error)
    let split
    let parametersInOrder = true

    // Try 4 iterations
    for (let i = 0; i <= 4; i++) {
      let curve = this.generateBezier(first, last, uPrime, tan1, tan2)

      // Find max deviation of points to fitted curve
      let max = this.findMaxError(first, last, curve, uPrime)
      if (max.error < error && parametersInOrder) {
        this.addCurve(segments, curve)
        return
      }
      split = max.index

      // If error not too large, try reparameterization and iteration
      if (max.error >= maxError) {
        break
      }
      parametersInOrder = this.reparameterize(first, last, uPrime, curve)
      maxError = max.error
    }

    // Fitting failed -- split at max error point and fit recursively
    let tanCenter = points[split - 1]::subtract(points[split + 1])
    this.fitCubic(segments, error, first, split, tan1, tanCenter)
    this.fitCubic(segments, error, split, last, tanCenter::negate(), tan2)
  }

  addCurve (segments, curve) {
    let prev = segments[segments.length - 1]
    prev.setHandleOut(curve[1]::subtract(curve[0]))
    segments.push(new Segment(curve[3], curve[2]::subtract(curve[3])))
  }

  // Use least-squares method to find Bezier control points for region.
  generateBezier (first, last, uPrime, tan1, tan2) {
    let epsilon = /* #= */ EPSILON
    let abs = Math.abs
    let points = this.points
    let pt1 = points[first]
    let pt2 = points[last]

    // Create the C and X matrices
    let C = [[0, 0], [0, 0]]
    let X = [0, 0]

    for (let i = 0, l = last - first + 1; i < l; i++) {
      let u = uPrime[i]
      let t = 1 - u
      let b = 3 * u * t
      let b0 = t * t * t
      let b1 = b * t
      let b2 = b * u
      let b3 = u * u * u
      let a1 = tan1::normalize(b1)
      let a2 = tan2::normalize(b2)
      let tmp = points[first + i]
        ::subtract(pt1::multiply(b0 + b1))
        ::subtract(pt2::multiply(b2 + b3))

      C[0][0] += a1::dot(a1)
      C[0][1] += a1::dot(a2)
      // C[1][0] += a1.dot(a2);
      C[1][0] = C[0][1]
      C[1][1] += a2::dot(a2)
      X[0] += a1::dot(tmp)
      X[1] += a2::dot(tmp)
    }

    // Compute the determinants of C and X
    let detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1]
    let alpha1
    let alpha2

    if (abs(detC0C1) > epsilon) {
      // Kramer's rule
      let detC0X = C[0][0] * X[1] - C[1][0] * X[0]
      let detXC1 = X[0] * C[1][1] - X[1] * C[0][1]

      // Derive alpha values
      alpha1 = detXC1 / detC0C1
      alpha2 = detC0X / detC0C1
    } else {
      // Matrix is under-determined, try assuming alpha1 == alpha2
      let c0 = C[0][0] + C[0][1]
      let c1 = C[1][0] + C[1][1]

      alpha1 = alpha2 = abs(c0) > epsilon ? X[0] / c0
        : abs(c1) > epsilon ? X[1] / c1
        : 0
    }

    // If alpha negative, use the Wu/Barsky heuristic (see text)
    // (if alpha is 0, you get coincident control points that lead to
    // divide by zero in any subsequent NewtonRaphsonRootFind() call.
    let segLength = pt2::getDistance(pt1)
    let eps = epsilon * segLength
    let handle1
    let handle2

    if (alpha1 < eps || alpha2 < eps) {
      // fall back on standard (probably inaccurate) formula,
      // and subdivide further if needed.
      alpha1 = alpha2 = segLength / 3
    } else {
      // Check if the found control points are in the right order when
      // projected onto the line through pt1 and pt2.
      let line = pt2::subtract(pt1)
      // Control points 1 and 2 are positioned an alpha distance out
      // on the tangent vectors, left and right, respectively
      handle1 = tan1::normalize(alpha1)
      handle2 = tan2::normalize(alpha2)
      if (handle1::dot(line) - handle2::dot(line) > segLength * segLength) {
        // Fall back to the Wu/Barsky heuristic above.
        alpha1 = alpha2 = segLength / 3
        handle1 = handle2 = null // Force recalculation
      }
    }

    // First and last control points of the Bezier curve are
    // positioned exactly at the first and last data points
    return [
      pt1,
      pt1::add(handle1 || tan1::normalize(alpha1)),
      pt2::add(handle2 || tan2::normalize(alpha2)),
      pt2
    ]
  }

  // Given set of points and their parameterization, try to find
  // a better parameterization.
  reparameterize (first, last, u, curve) {
    for (let i = first; i <= last; i++) {
      u[i - first] = this.findRoot(curve, this.points[i], u[i - first])
    }

    // Detect if the new parameterization has reordered the points.
    // In that case, we would fit the points of the path in the wrong order.
    for (let i = 1, l = u.length; i < l; i++) {
      if (u[i] <= u[i - 1]) {
        return false
      }
    }
    return true
  }

  // Use Newton-Raphson iteration to find better root.
  findRoot (curve, point, u) {
    let curve1 = []
    let curve2 = []

    // Generate control vertices for Q'
    for (let i = 0; i <= 2; i++) {
      curve1[i] = curve[i + 1]::subtract(curve[i])::multiply(3)
    }

    // Generate control vertices for Q''
    for (let i = 0; i <= 1; i++) {
      curve2[i] = curve1[i + 1]::subtract(curve1[i])::multiply(2)
    }

    // Compute Q(u), Q'(u) and Q''(u)
    let pt = this.evaluate(3, curve, u)
    let pt1 = this.evaluate(2, curve1, u)
    let pt2 = this.evaluate(1, curve2, u)
    let diff = pt::subtract(point)
    let df = pt1::dot(pt1) + diff::dot(pt2)

    // u = u - f(u) / f'(u)
    return isZero(df) ? u : u - diff::dot(pt1) / df
  }

  // Evaluate a bezier curve at a particular parameter value
  evaluate (degree, curve, t) {
    // Copy array
    let tmp = curve.slice()

    // Triangle computation
    for (let i = 1; i <= degree; i++) {
      for (let j = 0; j <= degree - i; j++) {
        tmp[j] = tmp[j]::multiply(1 - t)::add(tmp[j + 1]::multiply(t))
      }
    }
    return tmp[0]
  }

  // Assign parameter values to digitized points
  // using relative distances between points.
  chordLengthParameterize (first, last) {
    let u = [0]
    for (let i = first + 1; i <= last; i++) {
      u[i - first] = u[i - first - 1]
                    + this.points[i]::getDistance(this.points[i - 1])
    }
    for (let i = 1, m = last - first; i <= m; i++) {
      u[i] /= u[m]
    }
    return u
  }

    // Find the maximum squared distance of digitized points to fitted curve.
  findMaxError (first, last, curve, u) {
    let index = Math.floor((last - first + 1) / 2)
    let maxDist = 0

    for (let i = first + 1; i < last; i++) {
      let P = this.evaluate(3, curve, u[i - first])
      let v = P::subtract(this.points[i])
      // let dist = v.x * v.x + v.y * v.y // squared
      let dist = v[0] * v[0] + v[1] * v[1]
      if (dist >= maxDist) {
        maxDist = dist
        index = i
      }
    }

    return {
      error: maxDist,
      index: index
    }
  }
}
