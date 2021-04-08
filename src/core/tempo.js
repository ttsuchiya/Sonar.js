import Seq from './seq';
import Poly from './poly';
import Util from '../util';

// TODO: Should it extend Poly?
class Tempo extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Tempo',
      extends: 'Seq',
      samples: 44100,
      bins: Math.pow(2,10),
      hop: null,
      overlap: 4,
      duration: 1,
      output: {
        samples: null,
        numBlocks: null,
        duration: null,
        blocks: null
      },
      phase: 0,
      index: 0,
      cycle: 0, // Note: Or "block phase."
      currentTime: 0,
      olmethod: 'OLA',
      win: null,
      winFn: (s) => Seq.hamming(s.bins),
      deframe: true,
      binSize: null, // TODO: Move to output
      processFn: (s) => {
        const out = Seq.const(s.bins,0);
        this.increment();
        return out;
      },
      autoGain: true,
      blocks: null
    });

    this.initialize();
    this.reset();
  }
  static process(fn) {
    return this.empty().process(fn);
  }
  // clone() {
  //   let newInstance = this.constructor.from(this);
  //   let newState = {};
  //
  //   // TODO: Deep copy
  //   Object.entries(this.state).forEach(([key,val]) => {
  //     newState[key] = val;
  //   });
  //   newInstance.state = newState;
  //   return newInstance;
  // }
  initialize() {
    const s = this.state;
    s.hop = Math.round(s.bins/s.overlap);
    s.output.numBlocks = Math.floor((s.samples*s.duration-s.bins)/s.hop)+2;
    s.output.samples = s.output.numBlocks*s.hop+(s.bins-s.hop);
    s.output.duration = s.output.samples/s.samples;
    s.output.oscFreq = 1/s.output.duration;
    s.binSize = s.samples/s.bins;
    s.win = s.winFn(s);
    return this;
  }
  reset() {
    const s = this.state;
    s.currentTime = 0;
    s.index = 0;
    s.phase = 0;
    s.cycle = 0;
    return this;
  }
  clear() {
    while (this.length) {
      this.pop();
    }
    this.state.blocks = null;
    return this;
  }
  increment() {
    const s = this.state;
    s.index++;
    s.currentTime += (s.hop/s.samples);
    // s.phase = s.currentTime/s.output.duration;
    s.phase = s.index/(s.output.numBlocks-1)*(1-Number.EPSILON);
    s.cycle = s.index/s.overlap;
    return this;
  }
  // TODO: Call it index()
  setIndex(index) {
    const s = this.state;
    s.index = index;
    s.currentTime = s.hop*s.index/s.samples;
    // s.phase = s.currentTime/s.output.duration;
    s.phase = s.index/(s.output.numBlocks-1)*(1-Number.EPSILON);
    s.cycle = s.index/s.overlap;
    return this;
  }
  samplerate(sr) {
    this.state.samples = sr;
    return this.initialize();
  }
  bins(samps) {
    this.state.bins = samps;
    return this.initialize();
  }
  hop(samps) {
    this.state.overlap = this.state.bins/samps;
    return this.initialize();
  }
  hopratio(ratio) {
    this.state.overlap = 1/ratio;
    return this.initialize();
  }
  overlap(ratio) {
    this.state.overlap = ratio;
    return this.initialize();
  }
  duration(dur) {
    this.state.duration = dur;
    return this.initialize();
  }
  numblocks(n) {
    const s = this.state;
    s.hop = Math.round(s.bins/s.overlap);
    s.output.numBlocks = n;
    s.output.samples = s.output.numBlocks*s.hop+(s.bins-s.hop);
    s.output.duration = s.output.samples/s.samples;
    s.output.oscFreq = 1/s.output.duration;
    s.binSize = s.samples/s.bins;
    s.win = s.winFn(s);
    return this;
  }
  nextpo2(n) {
    return this.numblocks(Math.pow(2,n+2)-3);
  }
  samples(samps) {
    const s = this.state;
    s.hop = Math.round(s.bins/s.overlap);
    if (samps%s.hop !== 0) {
      throw new Error('The target sample size has to be an integer multiple of the hop size.');
    }
    s.output.samples = samps;
    s.output.numBlocks = (samps-(s.bins-s.hop))/s.hop;
    s.output.duration = samps/s.samples;
    s.output.oscFreq = 1/s.output.duration;
    s.binSize = s.samples/s.bins;
    s.win = s.winFn(s);
    return this;
  }
  process(fn) {
    if (!fn) return this;
    this.state.processFn = (s,t) => {
      const out = fn(s,t);
      if (!out) {
        throw new Error('The process callback has to return a mono or a poly of length >= 1.');
      }
      this.increment();
      return out
    };
    return this;
  }
  windowfn(winFn) {
    this.state.winFn = (s) => winFn(s);
    return this.initialize();
  }
  // TODO: Inconsistent with the windowfn() behavior.
  // TODO: Pass an instance function here.
  overlapfn(name) {
    this.state.olmethod = name;
    return this;
  }
  deframe(bool=true) {
    this.state.deframe = bool;
    return this;
  }
  render(...args) {
    const s = this.state;
    const indices = Util.unspread(args);
    this.clear();

    if (indices.length === 0) {
      const blocks = new Poly(s.output.numBlocks);

      for (let i = 0; i < s.output.numBlocks; i++) {
        let renderedBlock = s.processFn(s,this).multiply(s.win);

        if (renderedBlock.state.type === 'FFT') {
          blocks[i] = renderedBlock[0];
        } else if ([renderedBlock.state.type,renderedBlock.state.extends].includes('Poly')) {
          blocks[i] = Seq.concat(renderedBlock);
        } else {
          blocks[i] = renderedBlock;
        }
      }

      s.blocks = blocks;
      let res = blocks[s.olmethod](s.overlap);

      if (s.deframe) {
        let olaMargin = Poly.of(s.win).copy(s.output.numBlocks).OLA(s.overlap);
        res = res.divideby(...olaMargin);
      }

      if (s.autoGain) {
        let hopRatio = s.hop/s.bins;
        for (let i = 0; i < res.length; i++) {
          this[i] = res[i] * hopRatio;
        }
      } else {
        for (let i = 0; i < res.length; i++) {
          this[i] = res[i];
        }
      }

      this.reset();
      return this;
    } else {
      const output = indices.map(i => {
        this.setIndex(i);
        return s.processFn(s,this).multiply(s.win);
      });
      this.reset();
      return output;
    }
  }
  trim() {
    const len = Math.round(this.get('duration') * this.get('samples'));
    const res = this.constructor.empty(len).set(this.state);
    for (let i = 0; i < len; i++) {
      res[i] = this[i];
    }
    return res;
  }
  // freqtophase(...args) {
  //   args = Util.unspread(args);
  //   return args.map(v => 2*(v/this.state.binSize-1)/this.state.bins);
  // }
  // freqtobin(...args) {
  //   args = Util.unspread(args);
  //   return args.map(v => Math.round(v/this.state.binSize-1));
  // }
  // linear(...args) {
  //   return this.constructor.clone(Mono.clone(this).linear(args));
  // }
  // step(...args) {
  //   return this.constructor.clone(Mono.clone(this).step(args));
  // }
  // read() {
  //
  // }
}

export default Tempo;

// TODO: May break if no function is given.
export const tempo = Util.createFactoryMethod(function (...args) {
  return Tempo.process(...args);
}, Tempo);