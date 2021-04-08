import Seq from './seq';
import Util from '../util';

class RingBuffer extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'RingBuffer',
      extends: 'Seq',
      widx: 0,
      ridx: 0
    });
  }
  reset() {
    const s = this.state;
    s.widx = 0;
    s.ridx = 0;
    return this;
  }
  resize() {
    return this;
  }
  increment() {}

  write(val, inc=true) {
    const vals = Array.isArray(val) ? val : Array.of(val);
    const s = this.state;

    for (let i = 0; i < vals.length; i++) {
      const widx = (s.widx+i) % this.length;
      this[widx] = vals[i];
    }

    if (inc === true) {
      s.widx = (s.widx+vals.length) % this.length;
    } else if (Number.isInteger(inc)) {
      s.widx = (s.widx+inc) % this.length;
    }
    return this;
  }
  read(size=1, inc=true) {
    const s = this.state;
    const res = Seq.empty(size);

    for (let i = 0; i < size; i++) {
      const ridx = (s.ridx+i) % this.length;
      res[i] = this[ridx];
    }

    if (inc === true) {
      s.ridx = (s.ridx+size) % this.length;
    } else if (Number.isInteger(inc)) {
      s.ridx = (s.ridx+inc) % this.length;
    }
    return res;
  }
}

export default RingBuffer;
export const ringbuf = Util.createFactoryMethod(function (size=1) {
  return RingBuffer.const(size,0);
}, RingBuffer);