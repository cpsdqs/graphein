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
    pathCenterLine: do {
      const shader = createShader(gl, `
precision mediump float;

attribute vec2 point;
uniform mat4 transform;

void main() {
  gl_Position = transform * vec4(point, 0.0, 1.0);
}
        `, `
precision highp float;

uniform vec4 color;

void main() {
  gl_FragColor = color;
}
        `)

      shader.bind()
      shader.attributes.point.location = 1

      shader
    },
    pathFill: do {
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
uniform vec4 selection_color;

void main() {
  if (mod(gl_FragCoord.x, 5.0) <= 2.0 && mod(gl_FragCoord.y, 5.0) <= 2.0) {
    gl_FragColor = selection_color;
  } else {
    gl_FragColor = color;
  }
}
      `)

      shader.bind()
      shader.attributes.position.location = 2

      shader
    },
    bitmap: do {
      const shader = createShader(gl, `
precision mediump float;

attribute vec2 position;
uniform mat4 transform;

varying vec2 tex_coord;

void main() {
  gl_Position = transform * vec4(position, 0.0, 1.0);
  tex_coord = position;
}
        `, `
precision highp float;

uniform sampler2D texture;

varying vec2 tex_coord;

void main() {
  gl_FragColor = texture2D(texture, tex_coord);
}
        `)

      shader.bind()
      shader.attributes.position.location = 0

      shader
    }
  }
}
