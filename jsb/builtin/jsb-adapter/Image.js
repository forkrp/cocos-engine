let HTMLImageElement = requireModule('./HTMLImageElement');

function Image (width, height) {
    return new HTMLImageElement(width, height);
}

module.exports = Image;
