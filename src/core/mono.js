import Seq from './seq';
import Util from '../util';

const units = {
  samples: ['samples','samplerate','samps','fs','sr'],
  frequency: ['frequency','frequencies','freq','freqs','hz'],
  note: ['note','notes','midi','pitch'],
  bin: ['bin','bins','block','blocksize'],
  mel: ['mel'],
  beat: ['beat','beats'],
  interval: ['interval','intervals','int','itv'],
  offset: ['offset','offsets'],
  grid: ['grid','grids']
};

const state = {
  samples: 44100,
  bins: 128, // aka grids
  A4: 440,
  BPM: 60
};

class Mono extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Mono',
      extends: 'Seq',
      unit: null,
      ...state
    });
  }

  // region Utilities
  static initialize(...args) {
    const state = args.state;
    args = this.flatten(...args);
    const type = Util.argtype(args);

    if (type==='empty') {
      return new this();
    } else if (type==='array') {
      const res = this.empty(args.length);
      for (let i = 0; i < args.length; i++) {
        res[i] = args[i];
      }
      return args.state ? res.set(args.state) : res;
    } else if (type==='string') {
      const res = new this();
      return res.unit(args[0]);
    } else if (type==='prefix') {
      const res = this.empty(args.length-1);
      for (let i = 1; i < args.length; i++) {
        res[i-1] = args[i];
      }
      return state ? res.unit(args[0]).set(state) : res.unit(args[0]);
    } else if (type==='object') {
      return new this();
    }
  }
  static cast(src, ...args) {
    return this.initialize(...args, src);
  }
  // endregion

  // region Global
  static samples(samps) {
    state.samples = samps;
  }
  static bins(bins) {
    state.bins = bins;
  }
  static A4(base) {
    state.A4 = base;
  }
  static BPM(bpm) {
    state.BPM = bpm;
  }
  // endregion

  // region Generators
  static comb(...args) {
    args = Util.flatten(args);
    const [len,peaks,amp,jitter,phase] = Util.mapParams(args, [
      ['length', 4096],
      ['peaks', 1],
      ['amplitude', 1],
      ['jitter', 0],
      ['phase', null]
    ]);

    const seg = Math.floor(len/peaks)-1;
    let rem = len - (seg*peaks+peaks);
    const shift = this.random(peaks,-jitter/2,jitter/2).multiply(seg).round();
    let res = this.const(Math.floor(seg/2)+shift[0],0);
    res.push(amp);

    for (let i = 1; i < peaks; i++) {
      res = res.concat(this.const(seg+shift[i]-(i>0?shift[i-1]:0),0));

      if (rem !== 0) {
        res.push(0);
        rem--;
      }

      res.push(amp);
    }

    res = res.concat(this.const(Math.ceil(seg/2)+rem-shift[shift.length-1],0));

    if (phase !== null) {
      res = res.rotate(res.indexOf(amp)).pshift(-phase);
    }

    return res;
  }
  // Note: Removed the automatic zero-padding.
  static harmonics(...args) {
    args = Util.flatten(args);
    const [len,interval,jitter,atten] = Util.mapParams(args, [
      ['length', 4096],
      ['interval', 1],
      ['jitter', 0],
      ['attenuate', 0]
    ]);

    const res = this.const(len,0);
    let indices = this.range(0,len,interval).drop(0);

    // No jitter for the first (fundamental) and last peak. The last peak seems to exceed the index boundary (and increase the array size).
    const shift = this.random(indices.length-2,-interval/2*jitter,interval/2*jitter);
    shift.forEach((v,i) => indices[i+1] += v);

    // Level normalized by the number of peaks.
    switch (atten) {
      default:
      case 0:
        indices.forEach(v => res[Math.round(v)] = 1);
        break;
      case 1:
      case 'softmax':
        indices.forEach(v => res[Math.round(v)] = 1/indices.length);
        break;
      case 2:
      case 'diminish':
        indices.forEach((v,i) => res[Math.round(v)] = 1/(i+1));
        break;
    }
    return res;
  }
  static nharmonics(...args) {
    const [interval,jitter] = Util.flatten(args).concat([0.1,0].slice(args.length));
    let res = this.range(0,1,interval);
    res.shift();
    if (jitter !== 0) {
      const rand = this.random(res.length).rescale(-interval*jitter*0.5,interval*jitter*0.5);
      rand[0] = 0;
      res = res.add(rand);
      if (res[res.length-1] > 1) res[res.length-1] = 1;
    }
    return res;
  }
  // TODO: Need a better name.
  static ncomb(...args) {
    const [npeaks,jitter] = Util.flatten(args).concat([1,0].slice(args.length));
    const width = 1-1/npeaks;
    const jithw = .5/npeaks * jitter;

    if (!jitter) {
      return this.pframe(npeaks,0.5,width);
    } else {
      return this.pframe(npeaks,0.5,width).add(this.random(npeaks,-jithw,jithw));
    }
  }
  static note(...args) {
    args = Util.flatten(args);
    const [len,note,harmonics,jitter,atten,nyquist] = Util.mapParams(args, [
      ['length', 4096],
      ['note', 69],
      ['harmonics', true],
      ['jitter', 0],
      ['attenuate', 0],
      ['nyquist', true]
    ]);

    const bins = nyquist?len*2:len;
    const pos = Math.round(440*Math.pow(2,(note-69)/12)/(44100/bins));
    if (harmonics) {
      return this.harmonics(len,pos,jitter,atten);
    } else {
      return this.const(len).put(pos,1);
    }
  }
  static angles(...args) {
    args = Util.flatten(args);
    const [len,phase,radian] = Util.mapParams(args, [
      ['length', 1],
      ['phase', 0],
      ['radian', true]
    ]);

    if (radian) {
      // TODO: Use for-loop.
      return this.range(len).map(v => {
        const x = v*phase%1 * 2;
        return (x>1 ? -2+x : x)*Math.PI
      });
    } else {
      // TODO: Use for-loop.
      return this.range(len).map(v => v*phase%1);
    }
  }
  // endregion

  unit(arg) {
    if (arg) {
      arg = arg.toLowerCase();
      for (const [key,val] of Object.entries(units)) {
        if (val.includes(arg)) {
          return this.set('unit',key);
        }
      }
      return this;
    } else {
      return units;
    }
  }
  from(...args) {
    return this.unit(...args);
  }
  to(unit, ...args) {
    unit = unit.toLowerCase();
    for (const [key,val] of Object.entries(units)) {
      if (val.includes(unit)) {
        return this[key](...args);
      }
    }
    return this;
  }
  convert(...args) {
    args = Util.flatten(args);
    const argtype = Util.argtype(args);
    if (argtype === 'array') {
      const [arg1, arg2, ...rest] = args;
      return this.from(arg1).to(arg2, ...rest);
    } else if (argtype === 'object') {
      const { from, to, args } = args[0];
      return this.from(from).to(to,args);
    } else if (argtype === 'prefix') {

    }
    return this;
  }

  BPM(...args) {}

  // region Frequency
  frequency(...args) {
    const unit = this.get('unit');
    let fn = v => v;
    args = Util.flatten(args);
    const argtype = Util.argtype(args);

    if (unit === 'note') {
      const A4 = this.get('A4');
      fn = v => A4*Math.pow(2,(v-69)/12);
    } else if (unit === 'bin') {
      let bins = this.get('bins');
      let fs = this.get('samples');
      if (argtype === 'object') {
        for (const [key,val] of Object.entries(args[0])) {
          if (units.bin.includes(key.toLowerCase())) bins = val;
          if (units.samples.includes(key.toLowerCase())) fs = val;
        }
      } else if (argtype === 'array') {
        bins = args[0];
        if (args[1]) fs = args[1];
      }
      const binSize = fs/bins;
      fn = v => v*binSize;
    } else if (unit === 'mel') {
      fn = v => (Math.pow(10,v/2595)-1)*700;
    }

    return Util.iterate(this, fn).set(this.state).unit('frequency');
  }
  note(...args) {
    const unit = this.get('unit');
    let fn = v => v;
    args = Util.flatten(args);
    const argtype = Util.argtype(args);
    const A4 = this.get('A4');

    if (unit === 'frequency') {
      fn = v => A4*Math.log2(v/A4)*12+69;
    } else if (unit === 'bin') {
      let bins = this.get('bins');
      let fs = this.get('samples');
      let round = true;

      if (argtype === 'object') {
        for (const [key,val] of Object.entries(args[0])) {
          if (units.bin.includes(key.toLowerCase())) bins = val;
          if (units.samples.includes(key.toLowerCase())) fs = val;
          if (key==='round') round = val;
        }
      } else if (argtype === 'array') {
        bins = args[0];
        if (args[1]) fs = args[1];
        if (args[2]) round = args[2];
      }
      const binSize = fs/bins;
      if (round) {
        fn = v => Math.round(Math.log2(v*binSize/A4)*12+69);
      } else {
        fn = v => Math.log2(v*binSize/A4)*12+69;
      }
    } else if (unit === 'mel') {

    }
    return Util.iterate(this, fn).set(this.state).unit('note');
  }
  bin(...args) {
    const unit = this.get('unit');
    let fn = v => v;
    let bins = this.get('bins');
    let fs = this.get('samples');
    let round = true;

    const argtype = Util.argtype(args);
    if (argtype === 'object') {
      for (const [key,val] of Object.entries(args[0])) {
        if (units.bin.includes(key.toLowerCase())) bins = val;
        if (units.samples.includes(key.toLowerCase())) fs = val;
        if (key==='round') round = val;
      }
    } else if (argtype === 'array') {
      bins = args[0];
      if (args[1]) fs = args[1];
      if (args[2]) round = args[2];
    }
    const binSize = fs/bins;

    if (unit === 'frequency') {
      if (round) {
        fn = v => Math.round(v/binSize);
      } else {
        fn = v => v/binSize;
      }
    } else if (unit === 'note') {
      const A4 = this.get('A4');
      if (round) {
        fn = v => Math.round(A4*Math.pow(2,(v-69)/12)/binSize);
      } else {
        fn = v => A4*Math.pow(2,(v-69)/12)/binSize;
      }
    } else if (unit === 'mel') {

    }
    return Util.iterate(this, fn).set(this.state).unit('bin');
  }
  mel(...args) {
    const unit = this.get('unit');
    let fn = v => v;

    if (unit === 'frequency') {
      fn = v => Math.log10(v/700+1)*2595;
    } else if (unit === 'note') {
      const A4 = this.get('A4');
      fn = v => {
        const freq = A4*Math.pow(2,(v-69)/12);
        return Math.log10(freq/700+1)*2595
      };
    } else if (unit === 'bin') {
      let bins = this.get('bins');
      let fs = this.get('samples');
      if (argtype === 'object') {
        for (const [key,val] of Object.entries(args[0])) {
          if (units.bin.includes(key.toLowerCase())) bins = val;
          if (units.samples.includes(key.toLowerCase())) fs = val;
        }
      } else if (argtype === 'array') {
        bins = args[0];
        if (args[1]) fs = args[1];
      }
      const binSize = fs/bins;
      fn = v => Math.log10(v*binSize/700+1)*2595;
    }
    return Util.iterate(this, fn).set(this.state).unit('mel');
  }
  // endregion

  // region Rhythm
  interval() {
    const unit = this.get('unit');
    let fn = v => v;

    if (unit === 'offset') {
      return this.append(1).diff(1).set(this.state).unit('interval');
    }
    return Util.iterate(this, fn).set(this.state).unit('interval');
  }
  beat() {
    const unit = this.get('unit');
    let fn = v => v;

    if (unit === 'interval') {
      return this.accumulate().slice(0,-1).set(this.state).unit('beat');
    }
    return Util.iterate(this, fn).set(this.state).unit('beat');
  }
  offset(...args) {
    const unit = this.get('unit');
    let fn = v => v;

    if (unit === 'interval') {
      return this.softmax().accumulate().slice(0,-1).set(this.state).unit('offset');
    }
    return Util.iterate(this, fn).set(this.state).unit('offset');
  }
  grid(...args) {
    const unit = this.get('unit');
    args = Util.flatten(args);
    const argtype = Util.argtype(args);
    let bins = this.get('bins');

    if (argtype === 'array') {
      bins = args[0];
    } else if (argtype === 'object') {
      for (const [key,val] of Object.entries(args[0])) {
        if (units.bin.includes(key.toLowerCase())) bins = val;
      }
    }

    if (unit === 'interval') {
      return this.offset().grid(...args);
    } else if (unit === 'offset') {
      const res = this.constructor.const(bins,0);
      for (let i = 0; i < this.length; i++) {
        res[Math.ceil(this[i]*(bins-1))] = 1;
      }
      return res.set(this.state).unit('grid');
    }
    return this;
  }
  //endregion

  quantize(...args) {
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
    const unit = this.get('unit');

    if (unit === 'note') {

    }
  }
  bars(n) {}

  // region Spectral
  // TODO: Too experimental.
  window(...args) {
    const [fn,params] = [args[0],args.slice(1)];
    return this.multiply(fn.call(this.constructor,this.length,...params));
  }
  comb(len) {
    const res = this.constructor.const(len,0);
    for (let i = 0; i < this.length; i++) {
      res[Math.round(this[i]*(len-1))] = 1;
    }
    return res;
  }
  downsample(ratio) {
    const samps = Math.floor(this.length/ratio);
    const stepSize = this.length/samps;
    return this.constructor.range(samps).map(v => {
      const start = Math.round(v*stepSize);
      const stop = Math.round((v+1)*stepSize);

      let res = 0;
      for (let i=start; i<stop; i++) {
        res = Math.abs(this[i])>Math.abs(res) ? this[i] : res;
      }
      return res;
    }).concat(this.constructor.const(this.length-samps,0));
  }
  upsample(ratio) {
    const phase = this.constructor.of(0,1/ratio-Number.EPSILON).linear(this.length);
    return this.phasemaxbp(phase);
  }
  expand() {}
  // shrink() {}

  phaseincr(added=0, samps=false) {
    if (samps) {
      added /= this.length; // Note: this.length may be the half block size.
    }
    const incr = this.constructor.range(this.length).multiply(added);
    return this.add(incr);
  }
  // endregion
}

// Object.keys(units).forEach(v => {
//   Chroma[v] = function (...args) {
//     return this.initialize(v,...args);
//   };
// });

Util.extendWithSetState(Seq, Mono);

export default Mono;
export const mono = Util.createFactoryMethod(function (...args) {
  return Mono.initialize(...args);
}, Mono);