let HTMLMediaElement = requireModule('./HTMLMediaElement');

class HTMLAudioElement extends HTMLMediaElement {
  constructor() {
    super('audio')
  }
}

module.exports = HTMLAudioElement;
