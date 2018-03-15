// window.CC_RUNTIME = true;
// window.CC_JSB = false; // FIXME: need to be true
console.log("CC_JSB:" + CC_JSB);
window.CC_WECHATGAME = true;

// Simulate wechat game API:

window.wx = {
    getSystemInfoSync() {
        return {
            platform: 'mac',
            language: 'CN',
            system: 1.0,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
        };
    },

    onShow() {

    },

    onHide() {
        
    }
}

'use strict'

let requestFrameCallback = null;
let oldRequestFrameCallback = null;

window.requestAnimationFrame = function(cb) {
    requestFrameCallback = cb;
};

function tick(nowMilliSeconds) {
    fireTimeout(nowMilliSeconds);

    oldRequestFrameCallback = requestFrameCallback;
    if (oldRequestFrameCallback) {
        requestFrameCallback = null;
        oldRequestFrameCallback(nowMilliSeconds);
    }
}

let _timeoutIDIndex = 0;

class TimeoutInfo {
    constructor(cb, delay) {
        this.cb = cb;
        this.id = ++_timeoutIDIndex;
        this.start = performance.now();
        this.delay = delay;
    }
}

let _timeoutInfos = {};

function fireTimeout(nowMilliSeconds) {
    let info;
    for (let id in _timeoutInfos) {
        info = _timeoutInfos[id];
        if (info && info.cb) {
            if ((nowMilliSeconds - info.start) >= info.delay) {
//                console.log(`fireTimeout: id ${id}, start: ${info.start}, delay: ${info.delay}, now: ${nowMilliSeconds}`);
                info.cb();
                delete _timeoutInfos[id];
            }
        }
    }
}

//TODO: window.setInterval

window.setTimeout = (cb, delay) => {
    // console.log("window.setTimeout: cb: " + cb + ", delay: " + delay);
    let info = new TimeoutInfo(cb, delay);
    _timeoutInfos[info.id] = info;
    return info.id;
};

window.clearTimeout = (id) => {
    // console.log("window.clearTimeout: cb: " + cb);
    delete _timeoutInfos[id];
};

window.alert = console.error.bind(console);

//
// let { mat2, mat3, mat4, vec2, vec3, vec4, quat} = require('./gl-matrix');
// window.mat2 = mat2;
// window.mat3 = mat3;
// window.mat4 = mat4;
// window.vec2 = vec2;
// window.vec3 = vec3;
// window.vec4 = vec4;
// window.quat = quat;

require('./jsb_prepare');
require('./jsb_opengl');
window.DOMParser = require('./xmldom/dom-parser').DOMParser;

// cc.plistParser = cc.PlistParser.getInstance();

// File utils (Temporary, won't be accessible)
cc.fileUtils = cc.FileUtils.getInstance();
cc.fileUtils.setPopupNotify(false);

/**
 * @type {Object}
 * @name jsb.fileUtils
 * jsb.fileUtils is the native file utils singleton object,
 * please refer to Cocos2d-x API to know how to use it.
 * Only available in JSB
 */
jsb.fileUtils = cc.fileUtils;
delete cc.FileUtils;
delete cc.fileUtils;

window.CanvasRenderingContext2D = cc.CanvasRenderingContext2D;
delete cc.CanvasRenderingContext2D;

jsb.urlRegExp = new RegExp("^(?:https?|ftp)://\\S*$", "i");

let HTMLCanvasElement = require('./jsb-adapter/HTMLCanvasElement');
let HTMLImageElement = require('./jsb-adapter/HTMLImageElement');

let _glTexImage2D = gl.texImage2D;

/*
// WebGL1:
void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);
void gl.texImage2D(target, level, internalformat, format, type, ImageData? pixels);
void gl.texImage2D(target, level, internalformat, format, type, HTMLImageElement? pixels);
void gl.texImage2D(target, level, internalformat, format, type, HTMLCanvasElement? pixels);
void gl.texImage2D(target, level, internalformat, format, type, HTMLVideoElement? pixels);
void gl.texImage2D(target, level, internalformat, format, type, ImageBitmap? pixels);
*/
gl.texImage2D = function(target, level, internalformat, width, height, border, format, type, pixels) {
    let argCount = arguments.length;
    if (argCount == 6) {
        var image = border;
        type = height;
        format = width;

        //TODO: ImageData
        if (image instanceof HTMLImageElement) {
            console.log(`==> texImage2D internalformat: ${image._glInternalFormat}, format: ${image._glFormat}, image: w:${image.width}, h:${image.height}, dataLen:${image._data.length}`);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, image._alignment);
       
            _glTexImage2D(target, level, image._glInternalFormat, image.width, image.height, 0, image._glFormat, image._glType, image._data);
        }
        else if (image instanceof HTMLCanvasElement) {
            console.log(`==> texImage2D internalformat: ${internalformat}, format: ${format}, image: w:${image.width}, h:${image.height}`);//, dataLen:${image._data.length}`);
            _glTexImage2D(target, level, internalformat, image.width, image.height, 0, format, type, image._data);
        }
        else {
            console.error((new Error("Invalid pixel argument passed to gl.texImage2D!").stack));
        } 
    }
    else if (argCount == 9) {
        _glTexImage2D(target, level, internalformat, width, height, border, format, type, pixels);
    } else {
        console.error((new Error("gl.texImage2D: invalid argument count!").stack));
    }
}


let _glTexSubImage2D = gl.texSubImage2D;
/*
 // WebGL 1:
 void gl.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, ArrayBufferView? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, ImageData? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, HTMLImageElement? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, HTMLCanvasElement? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, HTMLVideoElement? pixels);
 void gl.texSubImage2D(target, level, xoffset, yoffset, format, type, ImageBitmap? pixels);
 */
gl.texSubImage2D = function(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    let argCount = arguments.length;
    if (argCount == 7) {
        var image = format;
        type = height;
        format = width;

        //TODO: ImageData
        if (image instanceof HTMLImageElement) {
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, image._alignment);
            _glTexSubImage2D(target, level, xoffset, yoffset, image.width, image.height, image._glFormat, image._glType, image._data);
        }
        else if (image instanceof HTMLCanvasElement) {
            _glTexSubImage2D(target, level, xoffset, yoffset, image.width, image.height, format, type, image._data);
        }
        else {
            console.error((new Error("Invalid pixel argument passed to gl.texImage2D!").stack));
        }
    }
    else if (argCount == 9) {
        _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
    } else {
        console.error((new Error("gl.texImage2D: invalid argument count!").stack));
    }
}

require('./jsb-adapter');

window.canvas.getContext = function(name) {
    if (name === 'webgl' || name === 'experimental-webgl') {
        return window.gl;
    }
};

//require('./sample-7');
require('../index');
// require('src/jsb_polyfill.dev.js');

// require('./jsb-loader');

/**
 * @type {Object}
 * @name jsb.reflection
 * jsb.reflection is a bridge to let you invoke Java static functions.
 * please refer to this document to know how to use it: http://www.cocos2d-x.org/docs/manual/framework/html5/v3/reflection/en
 * Only available on Android platform
 */
jsb.reflection = {
    callStaticMethod : function(){
        cc.log("not supported on current platform");
    }
};

// JS to Native bridges
if(window.JavascriptJavaBridge && cc.sys.os == cc.sys.OS_ANDROID){
    jsb.reflection = new JavascriptJavaBridge();
    cc.sys.capabilities["keyboard"] = true;
}
else if(window.JavaScriptObjCBridge && (cc.sys.os == cc.sys.OS_IOS || cc.sys.os == cc.sys.OS_OSX)){
    jsb.reflection = new JavaScriptObjCBridge();
}

window.io = window.SocketIO;

window.gameTick = tick;

