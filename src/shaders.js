const createShader = require('gl-shader')

module.exports = function (gl) {
  return {
    path: do {
      const shader = createShader(gl, `
precision mediump float;

attribute vec2 position;
attribute vec2 normal;
attribute float miter;
attribute float thickness;
uniform mat4 transform;

void main() {
  vec2 pos = position + vec2(normal * thickness / 2.0 * sign(miter));
  gl_Position = transform * vec4(pos, 0.0, 1.0);
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
      shader.attributes.normal.location = 1
      shader.attributes.miter.location = 2
      shader.attributes.thickness.location = 3

      shader
    }
  }
}
