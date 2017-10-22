const createShader = require('gl-shader')

module.exports = function (gl) {
  return {
    path: do {
      const shader = createShader(gl, `
precision mediump float;

attribute vec2 position;
uniform mat4 transform;

void main() {
  gl_Position = transform * vec4(position, 0.0, 1.0);
}
        `, `
precision highp float;

uniform vec4 color;

void main() {
  gl_FragColor = color;
}
        `)

      shader.bind()
      shader.attributes.position.location = 0

      shader
    },
    pathFill: do {
      const shader = createShader(gl, `
precision mediump float;

attribute vec2 position;
uniform mat4 transform;
uniform bool isSelected;

void main() {
  gl_Position = transform * vec4(position, 0.0, 1.0);
}
      `, `
precision highp float;

uniform vec4 color;
uniform bool isSelected;

// from stackoverflow question 4200224
float rand(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  // very hacky way of showing selection
  if (isSelected && rand(gl_FragCoord.xy) > 0.6) {
    gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
  } else {
    gl_FragColor = color;
  }
}
      `)

      shader.bind()
      shader.attributes.position.location = 0

      shader
    }
  }
}
