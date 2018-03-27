let Node = require('./Node');

class Element extends Node {
    constructor() {
        super()
        this.className = ''
        this.children = []
        this.clientLeft = 0;
        this.clientTop = 0;
    }

    get clientWidth() {
        return 0;
    }

    get clientHeight() {
        return 0;
    }

    getBoundingClientRect() {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
    }
}

module.exports = Element;
