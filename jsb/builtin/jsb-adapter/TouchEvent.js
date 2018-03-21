let Event = requireModule('./Event')

class TouchEvent extends Event {

  constructor(type, touchEventInit) {
    super(type)
    // this.touches = []
    // this.targetTouches = []
    this.changedTouches = []
  }
}

function touchEventHandlerFactory(type) {
  return (touches) => {
    const touchEvent = new TouchEvent(type)

    // touchEvent.touches = event.touches
    // touchEvent.targetTouches = Array.prototype.slice.call(event.touches)
    touchEvent.changedTouches = touches;//event.changedTouches
    // touchEvent.timeStamp = event.timeStamp
    window.canvas.dispatchEvent(touchEvent);
  }
}

jsb.onTouchStart = touchEventHandlerFactory('touchstart');
jsb.onTouchMove = touchEventHandlerFactory('touchmove');
jsb.onTouchEnd = touchEventHandlerFactory('touchend');
jsb.onTouchCancel = touchEventHandlerFactory('touchcancel');

module.exports = TouchEvent
