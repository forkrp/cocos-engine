/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and  non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Chukong Aipu reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

'use strict';

var EventTarget = require('../cocos2d/core/event/event-target');
var View = require('../cocos2d/core/platform/CCView');
var renderer = require('../cocos2d/core/renderer');
var inputManager = require('../cocos2d/core/platform/CCInputManager');

// cc.game
var game = cc.game = {

    EVENT_HIDE: "game_on_hide",
    EVENT_SHOW: "game_on_show",
    EVENT_RESIZE: "game_on_resize",

    _onShowListener: null,
    _onHideListener: null,

    // states
    _paused: true, //whether the game is paused
    _prepareCalled: false,//whether the prepare function has been called
    _prepared: false,//whether the engine has prepared
    _rendererInitialized: false,

    /**
     * Config of game
     * @type {Object}
     */
    config: null,

    /**
     * Callback when the scripts of engine have been load.
     * @type {Function}
     */
    onStart: null,

    // Scenes list
    _sceneInfos: [],


    /**
     * !#en The outer frame of the game canvas, parent of game container.
     * !#zh 游戏画布的外框，container 的父容器。
     * @property frame
     * @type {Object}
     */
    frame: null,
    /**
     * !#en The container of game canvas.
     * !#zh 游戏画布的容器。
     * @property container
     * @type {HTMLDivElement}
     */
    container: null,
    /**
     * !#en The canvas of the game.
     * !#zh 游戏的画布。
     * @property canvas
     * @type {HTMLCanvasElement}
     */
    canvas: null,

    _persistRootNodes: {},
    _ignoreRemovePersistNode: null,

    RENDER_TYPE_CANVAS: 0,
    RENDER_TYPE_WEBGL: 1,
    RENDER_TYPE_OPENGL: 2,

    EVENT_GAME_INITED: "game_inited",
    
    CONFIG_KEY: {
        width: 'width',
        height: 'height',
        // engineDir: 'engineDir',
        modules: 'modules',
        debugMode: 'debugMode',
        showFPS: 'showFPS',
        frameRate: 'frameRate',
        id: 'id',
        renderMode: 'renderMode',
        registerSystemEvent: 'registerSystemEvent',
        jsList: 'jsList',
        scenes: 'scenes'
    },

//@Public Methods

//  @Game play control
    /**
     * Set frameRate of game.
     * @param frameRate
     */
    setFrameRate: function (frameRate) {
        var self = this, config = self.config, CONFIG_KEY = self.CONFIG_KEY;
        config[CONFIG_KEY.frameRate] = frameRate;
        cc.director.setAnimationInterval(1.0/frameRate);
    },

    /**
     * Run the game frame by frame.
     */
    step: function () {
        cc.director.mainLoop();
    },

    /**
     * Pause the game.
     */
    pause: function () {
        this._paused = true;
        cc.director.pause();
    },

    /**
     * Resume the game from pause.
     */
    resume: function () {
        this._paused = false;
        cc.director.resume();
    },

    /**
     * Check whether the game is paused.
     */
    isPaused: function () {
        return this._paused;
    },

    /**
     * Restart game.
     */
    restart: function () {
        __restartVM();
    },

    /**
     * End game, it will close the game window
     */
    end: function () {
        close();
    },

    prepare: function (cb) {
        var self = this,
            config = self.config,
            CONFIG_KEY = self.CONFIG_KEY;

        this._loadConfig();

        // Already prepared
        if (this._prepared) {
            if (cb) cb();
            return;
        }
        // Prepare called, but not done yet
        if (this._prepareCalled) {
            return;
        }
        
        // Prepare never called and engine ready
        this._prepareCalled = true;
        this._initRenderer(config[CONFIG_KEY.width], config[CONFIG_KEY.height]);

        // Additional step in JSB
        cc.game.renderType = cc.game.RENDER_TYPE_OPENGL;

        /**
         * @module cc
         */

        /**
         * !#en cc.view is the shared view object.
         * !#zh cc.view 是全局的视图对象。
         * @property view
         * @type {View}
         */
        cc.view = View ? View._getInstance() : null;

        /**
         * !#en Director
         * !#zh 导演类。
         * @property director
         * @type {Director}
         */
        cc.director = cc.Director._getInstance();

        /**
         * !#en cc.winSize is the alias object for the size of the current game window.
         * !#zh cc.winSize 为当前的游戏窗口的大小。
         * @property winSize
         * @type Size
         */
        cc.winSize = cc.director.getWinSize();

        if (!CC_EDITOR) {
            this._initEvents();
        }

        this._setAnimFrame();
        this._runMainLoop();

        // Load game scripts
        var jsList = config[CONFIG_KEY.jsList];
        if (jsList) {
            cc.loader.load(jsList, function (err) {
                if (err) throw new Error(JSON.stringify(err));
                self._prepared = true;
                if (cb) cb();
                self.emit(self.EVENT_GAME_INITED);
            });
        }
        else {
            if (cb) cb();
            self.emit(self.EVENT_GAME_INITED);
        }
    },

    /**
     * Run game with configuration object and onStart function.
     * @param {Object|Function} [config] Pass configuration object or onStart function
     * @param {onStart} [onStart] onStart function to be executed after game initialized
     */
    run: function (config, onStart) {
        if (typeof config === 'function') {
            cc.game.onStart = config;
        }
        else {
            if (config) {
                cc.game.config = config;
            }
            if (typeof onStart === 'function') {
                cc.game.onStart = onStart;
            }
        }

        this.prepare(cc.game.onStart && cc.game.onStart.bind(cc.game));
    },

//  @ Persist root node section
    /**
     * !#en
     * Add a persistent root node to the game, the persistent node won't be destroyed during scene transition.<br/>
     * The target node must be placed in the root level of hierarchy, otherwise this API won't have any effect.
     * !#zh
     * 声明常驻根节点，该节点不会被在场景切换中被销毁。<br/>
     * 目标节点必须位于为层级的根节点，否则无效。
     * @method addPersistRootNode
     * @param {Node} node - The node to be made persistent
     */
    addPersistRootNode: function (node) {
        if (!cc.Node.isNode(node) || !node.uuid) {
            cc.warnID(3803);
            return;
        }
        var id = node.uuid;
        if (!this._persistRootNodes[id]) {
            var scene = cc.director._scene;
            if (cc.isValid(scene)) {
                if (!node.parent) {
                    node.parent = scene;
                }
                else if ( !(node.parent instanceof cc.Scene) ) {
                    cc.warnID(3801);
                    return;
                }
                else if (node.parent !== scene) {
                    cc.warnID(3802);
                    return;
                }
                this._persistRootNodes[id] = node;
                node._persistNode = true;
            }
        }
    },

    /**
     * Remove a persistent root node
     * @method removePersistRootNode
     * @param {ENode} node - The node to be removed from persistent node list
     */
    removePersistRootNode: function (node) {
        if (node !== this._ignoreRemovePersistNode) {
            var id = node._id || '';
            if (node === this._persistRootNodes[id]) {
                delete this._persistRootNodes[id];
                node._persistNode = false;
            }
        }
    },

    /**
     * Check whether the node is a persistent root node
     * @method isPersistRootNode
     * @param {ENode} node - The node to be checked
     * @return {Boolean}
     */
    isPersistRootNode: function (node) {
        return node._persistNode;
    },

//@Private Methods
    //  @Time ticker section
    _setAnimFrame: function () {
//cjh        this._lastTime = new Date();
//        var frameRate = game.config[game.CONFIG_KEY.frameRate];
//        this._frameTime = 1000 / frameRate;
//        if (frameRate !== 60 && frameRate !== 30) {
//            window.requestAnimFrame = this._stTime;
//            window.cancelAnimFrame = this._ctTime;
//        }
//        else {
//            window.requestAnimFrame = window.requestAnimationFrame ||
//            window.webkitRequestAnimationFrame ||
//            window.mozRequestAnimationFrame ||
//            window.oRequestAnimationFrame ||
//            window.msRequestAnimationFrame ||
//            this._stTime;
//            window.cancelAnimFrame = window.cancelAnimationFrame ||
//            window.cancelRequestAnimationFrame ||
//            window.msCancelRequestAnimationFrame ||
//            window.mozCancelRequestAnimationFrame ||
//            window.oCancelRequestAnimationFrame ||
//            window.webkitCancelRequestAnimationFrame ||
//            window.msCancelAnimationFrame ||
//            window.mozCancelAnimationFrame ||
//            window.webkitCancelAnimationFrame ||
//            window.oCancelAnimationFrame ||
//            this._ctTime;
//        }
    },
    _stTime: function(callback){
//cjh        var currTime = new Date().getTime();
//        var timeToCall = Math.max(0, game._frameTime - (currTime - game._lastTime));
//        var id = window.setTimeout(function() { callback(); },
//                                   timeToCall);
//        game._lastTime = currTime + timeToCall;
//        return id;
    },
    _ctTime: function(id){
//cjh        window.clearTimeout(id);
    },
        //Run game.
    _runMainLoop: function () {
        var self = this, callback, config = self.config, CONFIG_KEY = self.CONFIG_KEY,
        director = cc.director,
        skip = true, frameRate = config[CONFIG_KEY.frameRate];

        director.setDisplayStats(config[CONFIG_KEY.showFPS]);

        callback = function () {
            if (!self._paused) {
                // self._intervalId = window.requestAnimFrame(callback);
                if (frameRate === 30) {
                    if (skip = !skip) {
                        return;
                    }
                }
                director.mainLoop();
            }
        };

        self._paused = false;
        self._intervalId = window.requestAnimFrame(callback);
    },

    _loadConfig: function () {
        // Load config
        // Already loaded
        if (this.config) {
            this._initConfig(this.config);
        }
        // Load from project.json
        else {
            try {
                var txt = jsb.fileUtils.getStringFromFile('project.json');
                var data = JSON.parse(txt);
                this._initConfig(data || {});
            } catch (e) {
                console.log('Failed to read or parse project.json');
                this._initConfig({});
            }
        }
    },

    _initConfig: function (config) {
        var CONFIG_KEY = this.CONFIG_KEY;

        // Configs adjustment
        if (typeof config[CONFIG_KEY.debugMode] !== 'number') {
            config[CONFIG_KEY.debugMode] = 0;
        }
        if (typeof config[CONFIG_KEY.frameRate] !== 'number') {
            config[CONFIG_KEY.frameRate] = 60;
        }
        if (typeof config[CONFIG_KEY.renderMode] !== 'number') {
            config[CONFIG_KEY.renderMode] = 0;
        }
        config[CONFIG_KEY.showFPS] = (CONFIG_KEY.showFPS in config) ? (!!config[CONFIG_KEY.showFPS]) : true;
        // config[CONFIG_KEY.engineDir] = config[CONFIG_KEY.engineDir] || 'frameworks/cocos2d-html5';

        // Group List and Collide Map
        this.groupList = config.groupList || [];
        this.collisionMatrix = config.collisionMatrix || [];

        // Scene parser
        this._sceneInfos = config[CONFIG_KEY.scenes] || [];

        cc._initDebugSetting(config[CONFIG_KEY.debugMode]);

        this.config = config;
    },

    _initRenderer: function (width, height) {
        // Avoid setup to be called twice.
        if (this._rendererInitialized) return;

        var localCanvas;
        this.container = { style: {} };
        this.canvas = localCanvas = canvas;

        var opts = {
            'stencil': true,
            'alpha': cc.macro.ENABLE_TRANSPARENT_CANVAS
        };

        renderer.init(localCanvas, opts);
        this._renderContext = renderer.device._gl;
        cc.renderer = renderer;

        this.emit(this.EVENT_RENDERER_INITED, true);

        this._rendererInitialized = true;
    },

    _initEvents: function () {
        var win = window, hiddenPropName;

        // register system events
        if (this.config[this.CONFIG_KEY.registerSystemEvent])
            inputManager.registerSystemEvent(this.canvas);

        // if (typeof document.hidden !== 'undefined') {
        //     hiddenPropName = "hidden";
        // } else if (typeof document.mozHidden !== 'undefined') {
        //     hiddenPropName = "mozHidden";
        // } else if (typeof document.msHidden !== 'undefined') {
        //     hiddenPropName = "msHidden";
        // } else if (typeof document.webkitHidden !== 'undefined') {
        //     hiddenPropName = "webkitHidden";
        // }

        var hidden = false;

        function onHidden () {
            if (!hidden) {
                hidden = true;
                game.emit(game.EVENT_HIDE, game);
            }
        }
        function onShown () {
            if (hidden) {
                hidden = false;
                game.emit(game.EVENT_SHOW, game);
            }
        }

        // if (hiddenPropName) {
        //     var changeList = [
        //         "visibilitychange",
        //         "mozvisibilitychange",
        //         "msvisibilitychange",
        //         "webkitvisibilitychange",
        //         "qbrowserVisibilityChange"
        //     ];
        //     for (var i = 0; i < changeList.length; i++) {
        //         document.addEventListener(changeList[i], function (event) {
        //             var visible = document[hiddenPropName];
        //             // QQ App
        //             visible = visible || event["hidden"];
        //             if (visible)
        //                 onHidden();
        //             else
        //                 onShown();
        //         });
        //     }
        // } else {
        //     win.addEventListener("blur", onHidden);
        //     win.addEventListener("focus", onShown);
        // }

        // if (navigator.userAgent.indexOf("MicroMessenger") > -1) {
        //     win.onfocus = onShown;
        // }

        // if (CC_WECHATGAME) {
        //     wx.onShow(onShown);
        //     wx.onHide(onHidden);
        // }

        // if ("onpageshow" in window && "onpagehide" in window) {
        //     win.addEventListener("pagehide", onHidden);
        //     win.addEventListener("pageshow", onShown);
        //     // Taobao UIWebKit
        //     document.addEventListener("pagehide", onHidden);
        //     document.addEventListener("pageshow", onShown);
        // }

        this.on(game.EVENT_HIDE, function () {
            game.pause();
        });
        this.on(game.EVENT_SHOW, function () {
            game.resume();
        });
    }
};

cc.EventTarget.call(cc.game);
cc.js.addon(cc.game, cc.EventTarget.prototype);

//cjh cc.game._onHideListener = cc.eventManager.addCustomListener(cc.game.EVENT_HIDE, function () {
//     cc.game.emit(cc.game.EVENT_HIDE, cc.game);
// });
// cc.game._onShowListener = cc.eventManager.addCustomListener(cc.game.EVENT_SHOW, function () {
//     cc.game.emit(cc.game.EVENT_SHOW, cc.game);
// });
