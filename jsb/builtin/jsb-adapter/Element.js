const Node = require('./Node');
const DOMRect = require('./DOMRect');

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
        return new DOMRect();
    }
}

module.exports = Element;
