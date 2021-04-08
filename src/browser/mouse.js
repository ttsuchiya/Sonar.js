import Seq from '../core/seq';
import Util from '../util';

let ready = false;
let lastEvent = null;
function listener(e) {
  lastEvent = e;
}

const margin = {
  width: 0.025,
  height: 0.1
};

class Mouse extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Mouse',
      extends: 'Seq',
      ready: ready,
      x: 0,
      y: 0,
      margin: margin
    });

    this.constructor.initialize();
  }
  static initialize() {
    if (document.onmousemove !== listener) {
      document.onmousemove = listener;
      document.dispatchEvent(new MouseEvent('mousemove'));
      ready = true;
    }
  }
  static x() {
    if (!ready) this.initialize();
    const marginX = document.body.clientWidth * margin.width;
    let res = (lastEvent.clientX-marginX) / (document.body.clientWidth-marginX*1.45);
    if (res > 1) res = 1;
    else if (res < 0) res = 0;
    return this.of(res);
  }
  static y() {
    if (!ready) this.initialize();
    const marginY = document.body.clientHeight * margin.height;
    let res = 1 - (lastEvent.clientY-marginY) / (document.body.clientHeight-marginY*2);
    if (res > 1) res = 1;
    else if (res < 0) res = 0;
    return this.of(res);
  }
  x() {
    const margin = document.body.clientWidth * this.get('margin').width;
    let res = (lastEvent.clientX-margin) / (document.body.clientWidth-margin*1.45);
    if (res > 1) res = 1;
    else if (res < 0) res = 0;
    return this.constructor.of(res);
  }
  y() {
    const margin = document.body.clientHeight * this.get('margin').height;
    let res = 1 - (lastEvent.clientY-margin) / (document.body.clientHeight-margin*2);
    if (res > 1) res = 1;
    else if (res < 0) res = 0;
    return this.constructor.of(res);
  }
  // Other features such as acceleration...
  xy() {
    return this;
  }
}

export default Mouse;
export const mouse = Util.createFactoryMethod(() => Mouse.empty(), Mouse);