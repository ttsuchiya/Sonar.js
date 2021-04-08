import Clock from './clock';
import Seq from "../core/seq";
import Util from '../util';
import WebAudio from './webaudio';

const actx = WebAudio.context;
let waveforms = [];

class Waveform extends Clock {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Waveform',
      extends: 'Seq',
      gain: 1,
      ksmps: 128,
      buffer: null,
      bsNode: null,
      ampNode: null,
      gainNode: null,
      declipNode: null,
      deferredUpdates: []
    });
  }
  static cast(v) {
    let res;
    if (v.state && [v.state.type,v.state.extends].includes('Mono')) {
      res = this.clone(v.values());
    } else {
      res = this.clone(v.flat(Infinity));
    }
    res.samples(res.length);
    return res;
  }
  // TODO: Just handle all the clock-based objects together.
  static stop() {
    waveforms.forEach(v => v.stop());
    waveforms = [];
  }
  static from(...args) {
    let res = super.clone(...args);
    return res.samples(res.length);
  }
  initialize() {
    super.initialize();
    const s = this.state;

    s.bsNode = actx.createBufferSource();
    s.ampNode = actx.createGain();
    s.gainNode = actx.createGain();
    s.declipNode = actx.createGain();

    s.buffer = actx.createBuffer(1,this.length,actx.sampleRate);
    let bufferView = s.buffer.getChannelData(0);
    for (let i = 0; i < this.length; i++) {
      bufferView[i] = this[i];
    }
    s.bsNode.buffer = s.buffer;

    // TODO: Default level not overridden by gain(n).play() in time?
    // play().gain(n) works fine?
    s.gainNode.gain.setValueAtTime(s.gain,actx.currentTime);

    let declipDur = 0.002;
    s.declipNode.gain.setValueCurveAtTime(new Float32Array([0,1]),actx.currentTime,declipDur);
    s.declipNode.gain.setValueCurveAtTime(new Float32Array([1,0]),actx.currentTime+s.duration-declipDur,declipDur);

    s.bsNode.connect(s.ampNode);
    s.ampNode.connect(s.gainNode);
    s.gainNode.connect(s.declipNode);
    s.declipNode.connect(actx.destination);
    return this;
  }
  start() {
    if (!waveforms.includes(this)) {
      waveforms.push(this);
    }
    super.start();
    this.state.bsNode.start(this.state.startTime);
    // this.state.bsNode.stop(this.state.nextStart);

    setTimeout(() => {
      this.state.deferredUpdates.forEach && this.state.deferredUpdates.forEach(entry => this.update(...entry));
      // this.state.deferredUpdates = [];
    });
    return this;
  }
  play() {
    this.initialize();
    this.start();
    return this;
  }
  stop() {
    super.stop();
    this.state.bsNode.disconnect();
    return this;
  }
  update(src, tgt) {
    const s = this.state;

    let [node,param] = tgt.split('.').slice(1);
    if (s[node]) {
      let elapsed = actx.currentTime-s.startTime;
      if (elapsed > s.duration) return;

      let phaseOffset = elapsed/s.duration;
      let samps = Math.floor(s.duration*actx.sampleRate*(1-phaseOffset)/s.ksmps);
      let phasor = Seq.of(phaseOffset,1-Number.EPSILON).linear(samps);

      s[node][param].cancelScheduledValues(0);

      if (src.length > samps) {
        s[node][param].setValueCurveAtTime(new Float32Array(src.phasestep(phasor)),actx.currentTime,s.duration-elapsed);
      } else {
        let mostRecent = null;
        src.forEach((v,i) => {
          let timeOffset = s.duration*(i/src.length)+s.startTime;
          if (timeOffset >= actx.currentTime) {
            s[node][param].setValueAtTime(v,timeOffset);
          } else {
            mostRecent = v;
          }
        });
        if (mostRecent !== null) {
          s[node][param].setValueAtTime(mostRecent,0);
        }
      }
    } else {
      let exists = s.deferredUpdates.map(v => v[1]).indexOf(tgt);
      if (exists === -1) {
        s.deferredUpdates.push([src,tgt]);
      } else {
        s.deferredUpdates.splice(exists,1,[src,tgt]);
      }
    }
    return this;
  }
  gain(...args) {
    args = Util.unspread(args);
    if (args.length === 1) args = args.concat(args[0]);
    this.update(args,'state.gainNode.gain');
    return this;
  }
  amplitude(...args) {
    args = Util.unspread(args);
    if (args.length === 1) args = args.concat(args[0]);
    this.update(args,'state.ampNode.gain');
    return this;
  }
  // TODO: Consolidate with the tick function.
  intercept(fn) {
    this.state.interceptorFn = fn;
    return this;
  }
  repeat(...args) {
    super.repeat(...args);
    this.state.repeatFn = this.play;
    return this;
  }
}

export default Waveform;
export const waveform = Util.createFactoryMethod(function (...args) {
  return Waveform.clone(Util.flatten(args));
}, Waveform);