window.document = require('./document');
window.HTMLElement = require('./HTMLElement');
window.HTMLCanvasElement = require('./HTMLCanvasElement');
window.HTMLImageElement = require('./HTMLImageElement');
window.HTMLMediaElement = require('./HTMLMediaElement');
window.HTMLAudioElement = require('./HTMLAudioElement');
window.canvas = new HTMLCanvasElement();
window.gl.canvas = window.canvas;
window.navigator = require('./navigator');
window.Image = require('./Image');
window.Audio = require('./Audio');
window.FileReader = require('./FileReader');
window.location = require('./location');
window.FontFace = require('./FontFace');

function inject () {
  window.addEventListener = (type, listener) => {
    window.document.addEventListener(type, listener)
  }
  window.removeEventListener = (type, listener) => {
    window.document.removeEventListener(type, listener)
  }

  if (window.canvas) {
    window.canvas.addEventListener = window.addEventListener
    window.canvas.removeEventListener = window.removeEventListener
  }

  window.top = window.parent = window
}

if (!window.__isAdapterInjected) {
  window.__isAdapterInjected = true
  inject()
}
