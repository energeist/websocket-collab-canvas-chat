const socket = io();

// chat panel setup
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const usernameForm = document.getElementById('username-form');
const usernameInput = document.getElementById('username-input');

// canvas setup
let canvas = document.getElementsByClassName('whiteboard')[0];
let colors = document.getElementsByClassName('color');
let context = canvas.getContext('2d');

// initialize canvas variables
let current = {
  color: 'black'
};

let drawing = false;

// canvas mouse events
canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseUp, false);
canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

// Touch support for mobile devices
canvas.addEventListener('touchstart', onMouseDown, false);
canvas.addEventListener('touchend', onMouseUp, false);
canvas.addEventListener('touchcancel', onMouseUp, false);
canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

for (let i = 0; i < colors.length; i++){
  colors[i].addEventListener('click', onColorUpdate, false);
}

// Set username event listeners 
let username = "";
usernameForm.addEventListener('submit', function(e) {
  e.preventDefault();
  console.log("???")
  console.log(usernameInput.value)
  if (usernameInput.value) {
    username = usernameInput.value;
  }
  usernameForm.style.display = "none";
});

// Chat event listeners 
form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value, username);
    input.value = '';
  }
});

// Chat message socket
socket.on('chat message', function(msg, username) {
  const item = document.createElement('li');
  const d = new Date();
  msg = `${username} @ [${d.toLocaleString()}]: ${msg}`;
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

// Drawing socket
socket.on('drawing', onDrawingEvent);

// Drawing functions
function drawLine(x0, y0, x1, y1, color, emit){
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.strokeStyle = color;
  if (context.strokeStyle == "#ffffff") {
    context.lineWidth = 20;
  } else {
    context.lineWidth = 2;
  }
  context.stroke();
  context.closePath();

  if (!emit) { return; }
  const w = canvas.width;
  const h = canvas.height;

  socket.emit('drawing', {
    x0: x0 / w,
    y0: y0 / h,
    x1: x1 / w,
    y1: y1 / h,
    color: color
  });
}

function getMouseCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function onMouseDown(e) {
  drawing = true;
  const { x, y } = getMouseCoordinates(e);
  current.x = x;
  current.y = y;
}

function onMouseUp(e) {
  if (!drawing) {
    return;
  }
  drawing = false;
  const { x, y } = getMouseCoordinates(e);
  drawLine(current.x, current.y, x, y, current.color, true);
}

function onMouseMove(e) {
  if (!drawing) {
    return;
  }
  const { x, y } = getMouseCoordinates(e);
  drawLine(current.x, current.y, x, y, current.color, true);
  current.x = x;
  current.y = y;
}

function onColorUpdate(e){
  current.color = e.target.className.split(' ')[1];
}

// limit the number of events per second
function throttle(callback, delay) {
  let previousCall = new Date().getTime();
  return function() {
    let time = new Date().getTime();

    if ((time - previousCall) >= delay) {
      previousCall = time;
      callback.apply(null, arguments);
    }
  };
}

function onDrawingEvent(data){
  let w = canvas.width;
  let h = canvas.height;
  drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}

// make the canvas fill its parent
function onResize() {
  canvas.width = 500;
  canvas.height = 500;
}

window.addEventListener('resize', onResize);