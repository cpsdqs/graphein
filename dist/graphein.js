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
    ctx.clearRect(0, 0, this.width, this.height);
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
      ctx.transform(...this.data);
    } else if (this.type == Transform.types.MAT4) {
      console.warn('Cannot properly render Mat4 on canvas');
      ctx.transform(this.data[0], this.data[1], this.data[3], this.data[4], this.data[9], this.data[10]);
    }
  }

  static deserialize(data) {
    let transform = new Transform();
    transform.type = data.length === 12 ? Transform.types.MAT4 : data.length === 6 ? Transform.types.MAT3 : Transform.types.NONE;
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
const Brush = __webpack_require__(7);

class Canvas extends window.HTMLElement {
  constructor() {
    super();

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.brush = new Brush();
    this.brush.bind(this.canvas);

    this._image = new Image();
    this.brush.previewLayer = this._image;
    this.brush.on('update', () => this.render());
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
    this.brush.previewLayer = v;
    this.render();
  }

  render() {
    let start = performance.now();
    this.image.render(this.ctx);
    let end = performance.now();
    console.log(`Rendered in ${end - start}ms`);
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
        if (x > length) return length;
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
  constructor(type, ...data) {
    this.type = type | 0;
    this.data = data || [];
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

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

const EventEmitter = __webpack_require__(8);
const Path = __webpack_require__(5);

// TODO: pen tilt

module.exports = class Brush extends EventEmitter {
  constructor() {
    super();

    this.onPointerDown = e => {
      this.isDown = true;
      this.points = [];
      this.points.push({
        x: e.offsetX,
        y: e.offsetY,
        pressure: e.pressure
      });
      this.previewStroke = new Path();
      this.previewStroke.stroke.alpha = 1;
      this.previewStroke.data.push(new Path.Instruction(0x10, e.offsetX, e.offsetY));
      this.previewStroke.data.push(new Path.Instruction(0x60, 0, e.pressure * this.size / 2, e.pressure * this.size / 2));
      if (this.previewLayer) this.previewLayer.children.push(this.previewStroke);
      this.emit('update');
    };

    this.onPointerMove = e => {
      if (!this.isDown) return;

      for (let event in e.getCoalescedEvents().concat(e)) {
        this.points.push({
          x: e.offsetX,
          y: e.offsetY,
          pressure: e.pressure
        });

        this.previewStroke.data.push(new Path.Instruction(0x20, e.offsetX, e.offsetY));
        this.previewStroke.data.push(new Path.Instruction(0x60, this.getCurrentLength(), e.pressure * this.size / 2, e.pressure * this.size / 2));
      }
      this.emit('update');
    };

    this.onPointerUp = e => {
      this.isDown = false;
      this.points.push({
        x: e.offsetX,
        y: e.offsetY,
        pressure: e.pressure
      });

      this.previewStroke.data.push(new Path.Instruction(0x20, e.offsetX, e.offsetY));
      this.previewStroke.data.push(new Path.Instruction(0x60, this.getCurrentLength(), e.pressure * this.size / 2, e.pressure * this.size / 2));

      if (this.previewLayer) {
        this.previewLayer.children.splice(this.previewLayer.children.indexOf(this.previewStroke), 1);
      }

      console.log(this.previewStroke);

      this.stroke();

      this.emit('update');
    };

    this.eventTarget = null;
    this.previewLayer = null;

    this.size = 10;

    this.isDown = false;
    this.points = [];
    this.previewStroke = null;
  }

  bind(target) {
    if (this.eventTarget) console.warn('Binding brush to multiple elements');
    this.eventTarget = target;

    target.addEventListener('pointerdown', this.onPointerDown);
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerup', this.onPointerUp);
  }

  unbind() {
    this.eventTarget.removeEventListener('pointerdown', this.onPointerDown);
    this.eventTarget.removeEventListener('pointermove', this.onPointerMove);
    this.eventTarget.removeEventListener('pointerup', this.onPointerUp);
  }

  stroke() {}

  getCurrentLength() {
    let length = 0;
    let lastPoint = [0, 0];
    for (let instruction of this.previewStroke.data) {
      if (instruction.type === 0x10) {
        lastPoint = instruction.data;
      } else if (instruction.type === 0x20) {
        length += Math.hypot(instruction.data[0] - lastPoint[0], instruction.data[1] - lastPoint[1]);
        lastPoint = instruction.data;
      }
    }
    return length;
  }

};

/***/ }),
/* 8 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ })
/******/ ]);
//# sourceMappingURL=graphein.js.map