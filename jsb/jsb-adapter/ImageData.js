class ImageData {
    constructor(width, height) {
        this._data = new Uint8ClampedArray(width * height * 4);
        this._width = width;
        this._height = height;
    }


    get data() {
        return this._data;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

}

module.exports = ImageData;
