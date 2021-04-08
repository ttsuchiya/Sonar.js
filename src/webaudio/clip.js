import Seq from '../core/seq';
import Poly from '../core/poly';
import Unit from '../core/unit';
import Transport from '../experimental/transport';
import WebAudio from './webaudio';
import Util from '../util';

const actx = WebAudio.context;

let clips = [];

class Clip extends Poly {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Clip',
      extends: 'Poly',
      BPM: null,
      rate: 1,
      beats: [0],
      offsets: [0],
      offsetFn: null,
      buzz: [1],
      duration: null,
      nodes: {
        bsns: []
      }
    });
  }
  static cast(src, ...args) {
    if (src.state) {
      const state = src.state;
      if ([state.type,state.extends].includes('Poly')) {
        return this.from(src);
      } else {
        return this.of(src);
      }
    }
  }
  static stopall() {
    clips.forEach(v => v.stop());
    clips = [];
  }
  BPM(bpm) {
    this.set('BPM',bpm);
    return this;
  }
  rate(rate) {
    this.state.rate = rate;
    return this;
  }
  samples(samps) {
    return this.set('BPM', actx.sampleRate/samps);
  }
  time() {}

  offset(...args) {
    this.state.offsets = Seq.flatten(args);
    return this;
  }

  buzz(...args) {
    return this;
  }
  duration() {
    return this;
  }
  intervals(...args) {
    this.state.beats = Unit.flatten(args).inttobeat();
    return this;
  }
  beats(...args) {
    this.state.beats = Seq.flatten(args);
    return this;
  }
  pan(...args) {
    args = Util.flatten(args);
    this.forEach((v,i) => {
      v.set('pan',args[i%args.length]);
    });
    return this;
  }
  // Note: Overrides seq.repeat
  // repeat() {}

  play() {
    clips.push(this);

    const s = this.state;
    const t = Transport.state;

    for (let ch = 0; ch < this.length; ch++) {
      const buffer = actx.createBuffer(1,this[ch].length,actx.sampleRate);
      const view = buffer.getChannelData(0);
      for (let i = 0; i < this[ch].length; i++) {
        view[i] = this[ch][i];
      }

      const BPM = s.BPM ? s.BPM : (t.active ? t.BPM : 60);
      let now = null;

      // TODO: Should it rely on transport or not?
      if (t.active) {
        const interval = 60 / BPM;
        const rem = actx.currentTime % interval;
        now = actx.currentTime - rem + interval;
      } else {
        now = actx.currentTime;
      }

      s.beats.forEach((v,i) => {
        const bsn = actx.createBufferSource();
        bsn.buffer = buffer;

        if (actx.createStereoPanner) {
          const pan = actx.createStereoPanner();
          bsn.connect(pan);
          pan.connect(actx.destination);
          if (this[ch].get('pan')) {
            pan.pan.setValueAtTime(this[ch].get('pan'),0);
          }
        } else {
          const left = actx.createGain();
          const right = actx.createGain();
          const merger = actx.createChannelMerger(2);
          bsn.connect(left);
          bsn.connect(right);
          left.connect(merger,0,0);
          right.connect(merger,0,1);
          merger.connect(actx.destination);
        }
        const offset = s.offsets[i%s.offsets.length];
        const beat = v + offset;
        bsn.start(now + beat*60/(BPM*s.rate));
        s.nodes.bsns.push(bsn);
      });
    }
    return this;
  }

  start() {
    const s = this.state;

    this.forEach(v => {
      const bsn = actx.createBufferSource();
      bsn.connect(actx.destination);
      bsn.start(actx.currentTime + v*60/s.BPM);
      s.nodes.bsns.push(bsn);
    });
    return this;
  }
  stop() {
    const s = this.state;
    s.nodes.bsns.forEach(v => v.disconnect());
    s.nodes.bsns = [];
    return this;
  }

  // tick() {}
  // tock() {}
  // render() {}
}

export default Clip;
export const clip = Util.createFactoryMethod(function (...args) {
  return Clip.clone(Util.flatten(args));
}, Clip);