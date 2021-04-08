import Seq from './seq';
import Poly from './poly';
import Util from "../util";

let sampleRate = 44100;

// TODO: Deprecate this class.
class Unit extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Unit',
      extends: 'Seq',
      samplerate: sampleRate
    });
  }
  static samplerate(fs) {
    sampleRate = fs;
  }
  static MFB(k=1024,n=40,min=0,max=22050,sr=44100) {
    return this.of(min,max).freqtomel().linear(n+2).meltofreq().chunk(3,1).map(m => {
      return m.freqtobin(k,sr).peek(v => {
        let res = Seq.const(k);
        v.chunk(2,1).map(w => Seq.range(...w.take(-1, x => x+1)))
          .forEach((w,i) => res = res.put(w, !!i ? w.reverse().rescale(0,1) : w.rescale(0,1)));
        return res;
      });
    });
  }
  notetofreq() {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = 440*Math.pow(2,(this[i]-69)/12);
    }
    res.set(this.state);
    return res;
  }
  freqtonote() {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = Math.log2(this[i]/440.0)*12+69;
    }
    res.set(this.state);
    return res;
  }
  freqtobin(bins, fs=44100) {
    const binSize = fs/bins;
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = Math.round(this[i]/binSize);
    }
    return res;
  }
  bintofreq(bins, fs=44100) {
    const binSize = fs/bins;
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = this[i]*binSize;
    }
    return res;
  }
  notetobin(bins, fs=44100, round=true) {
    const binSize = fs/bins;
    const res = this.constructor.empty(this.length);

    if (round) {
      for (let i = 0; i < this.length; i++) {
        res[i] = Math.round(440*Math.pow(2,(this[i]-69)/12)/binSize);
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        res[i] = 440*Math.pow(2,(this[i]-69)/12)/binSize;
      }
    }
    return res;
  }
  bintonote(bins, fs=44100) {
    const binSize = fs/bins;
    const res = this.constructor.empty(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = Math.log2(this[i]*binSize/440.0)*12+69;
    }
    return res;
  }
  inttobeat() {
    return this.accumulate().slice(0,-1);
  }
  freqtomel() {
    return this.divideby(700).add(1).log10().multiply(2595);
  }
  meltofreq() {
    return this.divideby(2595).powerof(10).subtract(1).multiply(700);
  }
  scale(...args) {
    let sc = Util.flatten(args);
    if (sc.length === 0) sc = this.constructor.range(12);
    const res = this.constructor.empty(this.length);

    for (let i = 0; i < this.length; i++) {
      const pc = this[i] % 12;
      const oct = this[i] - pc;
      const idx = ~~(pc/12*sc.length);
      const frac = this[i] % 1;
      res[i] = oct + sc[idx] + frac;
    }
    return res;
  }
  octaves(n) {
    return this.encap(Poly).repeat(n).map((v,i) => v.add(i*12)).flat().cast(this.constructor);
  }

  // region Converters
  toNumber() {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      const parsed = Number(this[i]);
      res[i] = Number.isNaN(parsed) ? this[i] : parsed;
    }
    res.set(this.state);
    return res;
  }
  parseFloat() {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = Number.parseFloat(this[i]);
    }
    res.set(this.state);
    return res;
  }
  toFloat() {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      const parsed = Number.parseFloat(this[i]);
      res[i] = Number.isNaN(parsed) ? this[i] : parsed;
    }
    res.set(this.state);
    return res;
  }
  // Note: To be used with parseFloat.
  isNaN() {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = Number.isNaN(this[i]);
    }
    res.set(this.state);
    return res;
  }
  // Note: To be used with parseFloat.
  removeNaN() {
    if (!this.includes(NaN)) {
      return this;
    }
    const res = new this.constructor();
    for (let i = 0; i < this.length; i++) {
      if (!Number.isNaN(this[i])) res.push(this[i]);
    }
    return res;
  }
  // Note: To be used with parseFloat.
  replaceNaN(r=-1) {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = Number.isNaN(this[i]) ? r : this[i];
    }
    res.set(this.state);
    return res;
  }
  // endregion
}

export default Unit;
export const unit = Util.createFactoryMethod(function (...args) {
  return Unit.clone(Util.flatten(args));
}, Unit);