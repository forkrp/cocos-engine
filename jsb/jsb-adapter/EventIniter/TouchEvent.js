class TouchEvent {

  constructor(type) {
    this.target = window.canvas
    this.currentTarget = window.canvas
    this.touches = []
    this.targetTouches = []
    this.changedTouches = []
    this.type = type
  }

  stopPropagation() {

  }

  preventDefault() {

  }
}

function touchEventHandlerFactory(type) {
  return (touches) => {
    const touchEvent = new TouchEvent(type)

    // touchEvent.touches = event.touches
    // touchEvent.targetTouches = Array.prototype.slice.call(event.touches)
    touchEvent.changedTouches = touches;//event.changedTouches
    // touchEvent.timeStamp = event.timeStamp
    document.dispatchEvent(touchEvent)
  }
}

jsb.onTouchStart = touchEventHandlerFactory('touchstart');
jsb.onTouchMove = touchEventHandlerFactory('touchmove');
jsb.onTouchEnd = touchEventHandlerFactory('touchend');
jsb.onTouchCancel = touchEventHandlerFactory('touchcancel');
