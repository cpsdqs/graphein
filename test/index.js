const canvas = new (window.graphein.Canvas)()
canvas.canvas.style.background = '#fff9da'
document.body.appendChild(canvas)

const image = new (window.graphein.Image)()
image.width = image.height = 300
const layer = new (window.graphein.Layer)()
image.children.push(layer)

const path = new (window.graphein.Path)()
layer.children.push(path)

path.stroke = new (window.graphein.Color)(0, 0, 0, 1)

path.data = [
  [0x10, 12, 12],
  [0x30, 0, 50, 50, 80, 90, 50],
  [0x62, 50, /* L */ 10, 0, 20, 10, 0, /* R */ 10, 0, 20, 10, 10],
  [0x62, 100, /* L */ 70, 10, 80, 0, 0, /* R */ 70, 10, 80, 0, 0],
].map(x => {
  let command = new (window.graphein.Path.Command)()
  command.type = x[0]
  command.data = x.slice(1)
  return command
})

canvas.image = image
