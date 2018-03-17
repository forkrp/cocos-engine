let HTMLElement = require('./HTMLElement');

class HTMLImageElement extends HTMLElement {
    constructor(width, height) {
        super('img')
        this.width = width;
        this.height = height;
        this._data = null;
        this.onload = null;
        this._src = null;
        this.complete = false;
        this._glFormat = this._glInternalFormat = gl.RGBA;
        this.crossOrigin = null;
    }

    set src(src) {
        this._src = src;
        var self = this;
        getImageInfo(src, function(info){
            self.width = self.naturalWidth = info.width;
            self.height = self.naturalHeight = info.height;
            self._data = info.data;
            // console.log(`glFormat: ${info.glFormat}, glInternalFormat: ${info.glInternalFormat}, glType: ${info.glType}`);
            self._glFormat = info.glFormat;
            self._glInternalFormat = info.glInternalFormat;
            self._glType = info.glType;
            self._numberOfMipmaps = info.numberOfMipmaps;
            self._compressed = info.compressed;
            self._bpp = info.bpp;

            self._alignment = 1;
            // Set the row align only when mipmapsNum == 1 and the data is uncompressed
            if (self._numberOfMipmaps == 1 && !self._compressed) {
                let bytesPerRow = self.width * self._bpp / 8;
                if (bytesPerRow % 8 == 0)
                    _alignment = 8;
                else if(bytesPerRow % 4 == 0)
                    _alignment = 4;
                else if(bytesPerRow % 2 == 0)
                    _alignment = 2;
            }

            self.complete = true;

            if (self.onload) {
                self.onload();
            }
        });
    }

    get src() {
        return this._src;
    }
}

module.exports = HTMLImageElement;
