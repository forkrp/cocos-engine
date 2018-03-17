
class FontFace {
    constructor(family, source, descriptors) {
        this.family = family;
        this.source = source;
        this.descriptors = descriptors;

        this._status = 'unloaded';
        this._loaded = null;
    }

    // Promise load() {
    //     jsb.loadFont(this.source);
    // }

    get status() {
        return this._status;
    }

    get loaded() {
        return this._loaded;
    }
}

module.exports = FontFace;
