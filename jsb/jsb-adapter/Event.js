let {noop} = require('./util');

class Event {
  cancelBubble = false
  cancelable = false
  target = null
  timestampe = Date.now()
  preventDefault = noop
  stopPropagation = noop

  constructor(type) {
    this.type = type
  }
}

module.exports = Event;
