import Seq from '../core/seq';
import WebAudio from './webaudio';
import Util from '../util';

const actx = WebAudio.context;
const workletAvailable = WebAudio.workletAvailable;

let clocks = [];

// TODO: Should it extend Poly? Or the WebAudio module?
class Clock extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Clock',
      extends: 'Seq',
      oscNode: null,
      worklet: null,
      spNode: null,
      bpm: 60,
      delay: 0,
      duration: 1,
      phase: 0,
      stream: null,
      tickFn: () => {},
      tockFn: () => {},
      processFn: null,
      delta: 512,
      block: 1024,
      hop: 256,
      repeatCount: 1,
      index: 0,
      startTime: null,
      nextStart: null,
      repeatFn: this.start.bind(this)
    });
  }
  static setAudioWorklet(path) {
    console.log(`AudioWorklet available: ${workletAvailable}`);
    if (workletAvailable) {
      return actx.audioWorklet.addModule(path);
    }
  }
  static start() {

  }
  static stop() {
    clocks.forEach(c => c.terminate());
    clocks = [];
  }
  static for(dur) {
    if (dur) {
      return this.empty().duration(dur);
    } else {
      return this.empty();
    }
  }
  static frequency(freq) {
    return this.empty().frequency(freq);
  }
  static samples(samps) {
    return this.empty().samples(samps);
  }
  static tick(fn) {
    if (typeof(fn) === 'undefined') fn = () => {};
    return this.empty().tick(fn);
  }
  static tock(fn) {
    return this.empty().tock(fn);
  }
  initialize() {
    const s = this.state;
    s.oscNode = null;
    s.worklet = null;
    s.spNode = null;
    s.repeatCount = 1;
    s.index = 0;
    s.phase = 0;
    s.startTime = null;
    s.nextStart = null;
    return this;
  }
  clone() {
    const res = super.clone();
    return res.initialize();
  }
  start() {
    const s = this.state;

    if (s.repeatCount === 0) {
      return this;
    }

    if (s.index === 0) {
      clocks.push(this);
    }

    s.tockFn(s,this);
    s.index++;

    s.startTime = s.nextStart ? s.nextStart : actx.currentTime + s.delay;

    s.oscNode = actx.createOscillator();
    s.oscNode.onended = () => {
      if (s.onendedFn) {
        s.onendedFn(this);

        if (s.repeatCount === 0) {
          s.onendedFn = null;
        }

        // TODO: Clear onendedFn if stopped by user during playback? (Otherwise it gets triggered after the planned duration.)
      }

      this.stop();

      if (--s.repeatCount > 0) {
        s.repeatFn();
      } else if (s.repeatCount === 0) {
        if (clocks.includes(this)) {
          clocks.splice(clocks.indexOf(this),1);
        }
      }
    };
    if (workletAvailable) {
      s.worklet = new AudioWorkletNode(actx, 'clock-processor');
      s.worklet.port.postMessage({
        type: 'init',
        initTime: s.startTime,
        duration: s.duration,
        cbDelta: s.delta,
        block: s.block,
        hop: s.hop,
        process: !!s.processFn,
        intercept: !!s.interceptorFn
      });

      if (s.interceptorFn) {
        s.worklet.port.onmessage = e => {
          if (e.data.type === 'phase') {
            s.phase = e.data.phase;
            s.tickFn(s,this);
          } else if (e.data.type === 'intercept') {
            s.stream = Seq.concat(e.data.stream);
            if (s.stream.length === s.delta) {
              s.interceptorFn(s,this);
            }
          }
        };

        let mute = actx.createGain();
        mute.gain.setValueAtTime(0,0);
        s.oscNode.connect(mute);
        mute.connect(actx.destination);
        s.bsNode.connect(s.worklet);
      } else {
        s.worklet.port.onmessage = e => {
          s.phase = e.data.phase;
          s.tickFn(s,this);
        };
        s.oscNode.connect(s.worklet);
      }

      s.worklet.connect(actx.destination);
    } else {
      let initTime = actx.currentTime;
      s.spNode = actx.createScriptProcessor(s.delta,1,1);

      if (s.interceptorFn) {
        s.spNode.onaudioprocess = e => {
          s.phase = (actx.currentTime-initTime)/s.duration;
          s.stream = Seq.clone(e.inputBuffer.getChannelData(0));
          s.interceptorFn(s.stream,this);
          s.tickFn(s,this);
        };
        let mute = actx.createGain();
        mute.gain.setValueAtTime(0,0);
        s.oscNode.connect(mute);
        mute.connect(actx.destination);
        s.bsNode.connect(s.spNode);
      } else {
        s.spNode.onaudioprocess = e => {
          let phase = (actx.currentTime-initTime)/s.duration;
          if (phase >= 1) {
            phase = 1-Number.EPSILON;
          } else if (phase < 0) {
            phase = 0;
          }
          s.phase = phase;
          s.tickFn(s,this);
        };
        s.oscNode.connect(s.spNode);
      }

      s.spNode.connect(actx.destination);
    }

    s.oscNode.start(s.startTime);

    if (Number.isFinite(s.duration)) {
      s.nextStart = s.startTime+s.duration;
      s.oscNode.stop(s.nextStart);
    }
    return this;
  }
  stop() {
    const s = this.state;
    s.oscNode.disconnect();

    if (workletAvailable) {
      s.worklet.disconnect();
    }
    if (s.spNode) {
      s.spNode.disconnect();
      s.spNode.onaudioprocess = null;
    }

    return this;
  }
  terminate() {
    this.state.repeatCount = 0;
    this.stop();
    return this;
  }
  BPM(bpm) {
    this.state.bpm = bpm;
    return this;
  }
  delay(delay) {
    this.state.delay = delay;
    return this;
  }
  duration(dur) {
    this.state.duration = dur;
    this.state.frequency = 1/dur;
    return this;
  }
  frequency(freq) {
    this.state.frequency = freq;
    this.state.duration = 1/freq;
    return this;
  }
  samples(samps) {
    this.state.duration = samps / actx.sampleRate;
    return this;
  }
  repeat(count) {
    this.state.repeatCount = count ? count : Number.MAX_SAFE_INTEGER;
    return this;
  }
  tick(fn) {
    this.state.tickFn = fn;
    return this;
  }
  delta(samps) {
    this.state.delta = samps;
    this.state.block = samps;
    this.state.hop = samps;
    return this;
  }
  block(samps) {
    this.state.block = samps;
    return this;
  }
  hop(samps) {
    this.state.hop = samps;
    return this;
  }
  process(fn) {
    this.state.processFn = fn;
    return this;
  }
  tock(fn) {
    this.state.tockFn = fn;
    return this;
  }
  onended(fn) {
    this.state.onendedFn = fn;
    return this;
  }
  connect(audioNode) {
    return this;
  }
}

export default Clock;
export const clock = Util.createFactoryMethod(function (...args) {
  return Clock.tick(...args);
}, Clock);