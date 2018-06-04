/****************************************************************************
 Copyright (c) 2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
 
const HTMLMediaElement = require('./HTMLMediaElement');
const Event = require('./Event');

const HAVE_NOTHING = 0
const HAVE_METADATA = 1
const HAVE_CURRENT_DATA = 2
const HAVE_FUTURE_DATA = 3
const HAVE_ENOUGH_DATA = 4

class HTMLAudioElement extends HTMLMediaElement {
    constructor(url, isCalledFromAudio) {
        if (!isCalledFromAudio) {
            throw new TypeError("Illegal constructor, use 'new Image(w, h); instead!'");
            return;
        }

        super('audio')
        this._audioID = null;
        this.src = url;
        this.configDirty = true;
    }

    load() {
        console.warn('HTMLAudioElement.load() is not implemented.')
    }

    play() {
        if (this._audioID)
            jsb.AudioEngine.stop(this._audioID);
        this._audioID = jsb.AudioEngine.play2d(this._src);
        this.loop = this._loop;
    }

    pause() {
        if (this._audioID) {
            jsb.AudioEngine.pause(this._audioID);
        }
    }

    canPlayType(mediaType = '') {
        if (typeof mediaType !== 'string') {
            return ''
        }

        if (mediaType.indexOf('audio/mpeg') > -1 || mediaType.indexOf('audio/mp4')) {
            return 'probably'
        }
        return ''
    }

    get currentTime() {
        if (this._audioID) {
            return jsb.AudioEngine.getCurrentTime(this._audioID);
        }
        return 0;
    }

    set currentTime(value) {
        if (this._audioID) {
            jsb.AudioEngine.setCurrentTime(this._audioID, value);
        }
    }

    get src() {
        return this._src;
    }

    set src(value) {
        this._src = value;
        this._audioID = null;
        if (value) {
            jsb.AudioEngine.preload(this._src, ()=>{
                this.dispatchEvent(new Event('canplaythrough'));
            });
        }
    }

    get loop() {
        return this._loop;
    }

    set loop(value) {
        this._loop = value;
        if (this._audioID)
            jsb.AudioEngine.setLoop(this._audioID, value);
    }

    get autoplay() {

    }

    set autoplay(value) {

    }

    get paused() {

    }

    cloneNode() {
        return new Audio(this._src);
    }
}

module.exports = HTMLAudioElement;
