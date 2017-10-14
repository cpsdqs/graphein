document.body.style.background = '#eee'

const canvas = new (window.graphein.Canvas)()
canvas.canvas.style.background = '#fff'
canvas.canvas.style.borderRadius = '4px'
document.body.appendChild(canvas)

const image = new (window.graphein.Image)()
image.width = image.height = 500
const layer = new (window.graphein.Layer)()
image.children.push(layer)

const path = new (window.graphein.Path)()
layer.children.push(path)

path.stroke = new (window.graphein.Color)(0, 0, 0, 1)
path.fill = new (window.graphein.Color)(1, 0.5, 0, 1)

path.data = [
  [0x10, 12, 12],
  [0x30, 0, 50, 50, 80, 90, 50],
  [0x62, 50, /* L */ 10, 0, 20, 10, 0, /* R */ 10, 0, 20, 10, 10],
  [0x62, 100, /* L */ 70, 10, 80, 0, 0, /* R */ 70, 10, 80, 0, 0],
].map(x => new (window.graphein.Path.Command)(...x))

canvas.image = image
