
function inject () {
    window.top = window.parent = window

    window.document = requireModule('./document');
    window.HTMLElement = requireModule('./HTMLElement');
    window.HTMLCanvasElement = requireModule('./HTMLCanvasElement');
    window.HTMLImageElement = requireModule('./HTMLImageElement');
    window.HTMLMediaElement = requireModule('./HTMLMediaElement');
    window.HTMLAudioElement = requireModule('./HTMLAudioElement');
    window.canvas = new HTMLCanvasElement();
    window.gl.canvas = window.canvas;
    window.WebGLRenderingContext = window.gl;
    window.navigator = requireModule('./navigator');
    window.Image = requireModule('./Image');
    window.Audio = requireModule('./Audio');
    window.FileReader = requireModule('./FileReader');
    window.location = requireModule('./location');
    window.FontFace = requireModule('./FontFace');
    window.FontFaceSet = requireModule('./FontFaceSet');
    window.EventTarget = requireModule('./EventTarget');
    window.Event = requireModule('./Event');
    window.TouchEvent = requireModule('./TouchEvent');

    window.addEventListener = function(eventName, listener, options) {
        window.canvas.addEventListener(eventName, listener, options);
    }

    window.removeEventListener = function(eventName, listener, options) {
        window.canvas.removeEventListener(eventName, listener, options);
    }

    window.dispatchEvent = function(event) {
        window.canvas.dispatchEvent(event);
    }

    window._isInjected = true;
}

if (!window._isInjected) {
    inject();
}

window.canvas.getContext = function(name) {
    if (name === 'webgl' || name === 'experimental-webgl') {
        return window.gl;
    }
    return null;
};

window.localStorage = sys.localStorage;
