/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var _class, _temp;

const Transform = __webpack_require__(2);

module.exports = (_temp = _class = class Layer {
  constructor() {
    this.type = Layer.types.GROUP;
    this.transform = new Transform();
    this.children = [];
  }

  serialize() {
    return {
      type: this.type,
      transform: this.transform.serialize(),
      children: this.children.map(child => child.serialize())
    };
  }

  render(ctx) {
    ctx.save();
    this.transform.render(ctx);
    this.children.forEach(child => child.render(ctx));
    ctx.restore();
  }

}, _class.types = {
  GROUP: 'g',
  PATH: 'p',
  CLIPPING_MASK: 'c',
  RECTANGLE: 'sr',
  CIRCLE: 'sc',
  TEXT: 't',
  RASTER_IMAGE: 'b'
}, _temp);

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

const Layer = __webpack_require__(0);

module.exports = class Image extends Layer {
  constructor() {
    super();

    // TODO: don't hardcode
    this.version = 0;
    this.width = 100;
    this.height = 100;
  }

  serialize() {
    return {
      version: this.version,
      w: this.width,
      h: this.height,
      c: this.children.map(child => child.serialize())
    };
  }

  render(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();
    this.children.forEach(child => child.render(ctx));
    ctx.restore();
  }
};

/***/ }),
/* 2 */
/***/ (function(module, exports) {

var _class, _temp;

module.exports = (_temp = _class = class Transform {
  constructor() {
    this.type = Transform.types.NONE;
    this.data = new Float32Array([]);
  }

  serialize() {
    return this.data;
  }

  render(ctx) {
    if (this.type === Transform.types.MAT3) {
      ctx.transform(this.data[0], this.data[1], this.data[3], this.data[4], this.data[6], this.data[7]);
    } else if (this.type == Transform.types.MAT4) {
      console.warn('Cannot properly render Mat4 on canvas');
      ctx.transform(this.data[0], this.data[1], this.data[4], this.data[5], this.data[12], this.data[13]);
    }
  }

  static deserialize(data) {
    let transform = new Transform();
    transform.type = data.length === 16 ? Transform.types.MAT4 : data.length === 9 ? Transform.types.MAT3 : Transform.types.NONE;
    transform.data = new Float32Array(data.slice());
    return transform;
  }

}, _class.types = {
  NONE: 0,
  MAT3: 1,
  MAT4: 2
}, _temp);

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

const Canvas = __webpack_require__(4);
const Image = __webpack_require__(1);
const Layer = __webpack_require__(0);
const Transform = __webpack_require__(2);
const Path = __webpack_require__(5);

const graphein = {
  Canvas,
  Image,
  Layer,
  Transform,
  Path
};

module.exports = window.graphein = graphein;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

const Image = __webpack_require__(1);

class Canvas extends window.HTMLElement {
  constructor() {
    super();

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this._image = new Image();
  }

  connectedCallback() {
    if (!this._didInit) {
      this._didInit = true;
      this.appendChild(this.canvas);
    }
  }

  get image() {
    return this._image;
  }

  set image(v) {
    this._image = v;
    this.render();
  }

  render() {
    this.image.render(this.ctx);
  }
}

window.customElements.define('graphein-canvas', Canvas);
module.exports = Canvas;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var _class, _temp;

const Layer = __webpack_require__(0);
const Color = __webpack_require__(6);

// TODO: redo properly

// reuse svg elements
let basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
let widthL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
let widthR = document.createElementNS('http://www.w3.org/2000/svg', 'path');

class StrokeRenderer {
  constructor() {
    this.path = [];
    this.widthL = [['M', 0, 0]];
    this.widthR = [['M', 0, 0]];
    this.cursor = [0, 0];
    this.cursorL = [0, 0];
    this.cursorR = [0, 0];
  }

  add(type, ...args) {
    if (type.startsWith('_')) {
      type = type.substr(1);
      if (type === 'L') {
        this.cursorL = [args[0], args[1]];
        this.cursorR = [args[0], args[2]];
        this.widthL.push([type, ...this.cursorL]);
        this.widthR.push([type, ...this.cursorR]);
      } else if (type === 'l') {
        this.cursorL[0] += args[0];
        this.cursorR[0] += args[0];
        this.cursorL[1] += args[1];
        this.cursorR[1] += args[2];
        this.widthL.push([type, ...this.cursorL]);
        this.widthR.push([type, ...this.cursorR]);
      } else if (type === 'C') {
        let leftArgs = args.slice(1, 5).concat([args[0], args[5]]);
        let rightArgs = args.slice(6, 10).concat([args[0], args[10]]);
        this.cursorL = [args[0], args[5]];
        this.cursorR = [args[0], args[10]];
        this.widthL.push(['C', ...leftArgs]);
        this.widthR.push(['C', ...rightArgs]);
      }
      // TODO: c
    } else {
      this.path.push([type, ...args]);
    }
  }

  getPath() {
    return this.path.map(item => item.join(' ')).join(' ');
  }

  getWidthL() {
    return this.widthL.map(item => item.join(' ')).join(' ');
  }

  getWidthR() {
    return this.widthR.map(item => item.join(' ')).join(' ');
  }

  render(ctx) {
    basePath.setAttribute('d', this.getPath());
    widthL.setAttribute('d', this.getWidthL());
    widthR.setAttribute('d', this.getWidthR());

    let baseLength = basePath.getTotalLength();
    let resolution = 1 / window.devicePixelRatio;

    let cursor = null;
    let currentL = 0;
    let currentR = 0;

    let findNextPointAtX = (path, target, start = 0) => {
      let x = start;
      let length = path.getTotalLength();

      while (true) {
        if (x > length) return Infinity;
        if (path.getPointAtLength(x).x >= target) {
          return x;
        }
        x += resolution;
      }
    };

    let lastLeftPos = 0;
    let lastRightPos = 0;

    for (let x = 0; x < baseLength; x += resolution) {
      let point = basePath.getPointAtLength(x);

      let leftPos = findNextPointAtX(widthL, x, lastLeftPos);
      let rightPos = findNextPointAtX(widthR, x, lastRightPos);

      let left = widthL.getPointAtLength(leftPos).y;
      let right = widthR.getPointAtLength(rightPos).y;

      // TODO: support jumps (M/m) midway

      if (!cursor) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        cursor = [point.x, point.y];
      }

      if (left !== currentL || right !== currentR) {
        currentL = left;
        currentR = right;

        // TODO: support asymmetry
        ctx.stroke();
        ctx.lineWidth = (currentL + currentR) / 2; // average for now
        ctx.beginPath();
        ctx.moveTo(...cursor);
      }

      ctx.lineTo(point.x, point.y);
      cursor = [point.x, point.y];
    }

    ctx.stroke();
  }
}

const instructionFunctions = {
  0x00: 'Z',
  0x10: 'M',
  0x11: 'm',
  0x20: 'L',
  0x21: 'l',
  0x30: 'C',
  0x31: 'c',
  0x32: 'S',
  0x33: 's',
  0x40: 'Q',
  0x41: 'q',
  0x42: 'T',
  0x43: 't',
  0x50: 'A',
  0x51: 'a',
  0x60: '_L',
  0x61: '_l',
  0x62: '_C',
  0x63: '_c'
};

class Instruction {
  constructor() {
    this.type = 0;
    this.data = [];
  }

  render(renderer) {
    renderer.add(instructionFunctions[this.type], ...this.data);
  }

  serialize() {
    return [this.type, this.data];
  }

}

Instruction.types = {
  CLOSE_PATH: 0,
  MOVE: 0x10,
  MOVE_R: 0x11,
  LINE: 0x20,
  LINE_R: 0x21,
  CUBIC_BEZIER: 0x30,
  CUBIC_BEZIER_R: 0x31,
  CUBIC_BEZIER_SHORT: 0x32,
  CUBIC_BEZIER_SHORT_R: 0x33,
  QUAD_BEZIER: 0x40,
  QUAD_BEZIER_R: 0x41,
  QUAD_BEZIER_SHORT: 0x42,
  QUAD_BEZIER_SHORT_R: 0x43,
  ARC: 0x50,
  ARC_R: 0x51,
  STROKE_WIDTH: 0x60,
  STROKE_WIDTH_R: 0x61,
  STROKE_WIDTH_BEZIER: 0x62,
  STROKE_WIDTH_BEZIER_R: 0x63
};
module.exports = (_temp = _class = class Path extends Layer {
  constructor() {
    super();

    this.stroke = new Color();
    this.fill = new Color();
    this.cap = Path.cap.BUTT;
    this.join = Path.join.BEVEL;
    this.miter = 0;
    this.data = [];
  }

  render(ctx) {
    let renderer = new StrokeRenderer();
    this.data.forEach(instruction => instruction.render(renderer));

    if (this.fill.alpha) {
      ctx.fillStyle = this.fill.toCSS();
      ctx.fill(new window.Path2D(renderer.getPath()));
    }
    if (this.stroke.alpha) {
      ctx.strokeStyle = this.stroke.toCSS();
      renderer.render(ctx);
    }
  }

}, _class.cap = {
  BUTT: 0,
  ROUND: 1,
  PROJECTING: 2
}, _class.join = {
  BEVEL: 0,
  ROUND: 1,
  MITER: 2
}, _class.Instruction = Instruction, _temp);

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = class Color {
  constructor() {
    this.alpha = 0;
    this.red = 0;
    this.green = 0;
    this.blue = 0;
  }

  toCSS() {
    return `rgba(${this.red * 255}, ${this.green * 255}, ${this.blue * 255}, ${this.alpha})`;
  }
};

/***/ })
/******/ ]);
//# sourceMappingURL=graphein.js.map