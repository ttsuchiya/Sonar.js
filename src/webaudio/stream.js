import Seq from '../core/seq';
import WebAudio from './webaudio';
import Util from '../util';

const actx = WebAudio.context;
const workletAvailable = WebAudio.workletAvailable;

let streams = [];

class Stream extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Stream',
      extends: 'Seq',
      processFn: (s) => {},
      nodes: {
        osc: null,
        worklet: null,
        atten: null
      },
      duration: 1,
      block: 1024,
      hop: 512,
      window: null,
      autoGain: true,
      sync: false
    })
  }
  static setAudioWorklet(path) {
    console.log(`AudioWorklet available: ${workletAvailable}`);
    if (workletAvailable) {
      return actx.audioWorklet.addModule(path);
    }
  }
  static process(fn) {
    return (new this()).process(fn);
  }
  static stopall() {
    streams.forEach(v => v.stop());
    streams = [];
  }
  process(fn) {
    this.set('processFn', (...args) => {
      const out = fn(...args);
      if (!out) {
        throw new Error('...');
      }
      return out;
    });
    return this;
  }
  play() {
    streams.push(this);
    const s = this.state;

    s.nodes.osc = actx.createOscillator();
    s.nodes.osc.onended = () => {
      this.stop();
    };

    s.nodes.atten = actx.createGain();
    s.nodes.atten.gain.setValueAtTime(s.autoGain ? s.hop/s.block : 1, 0);

    if (workletAvailable) {
      s.nodes.worklet = new AudioWorkletNode(actx, 'stream-processor',{
        processorOptions: {
          block: s.block,
          hop: s.hop,
          duration: s.duration,
          window: s.window
        }
      });

      s.nodes.worklet.port.onmessage = e => {
        this.set('phase', e.data.phase);
        this.set('cycle', e.data.cycle);

        s.nodes.worklet.port.postMessage({
          block: s.processFn(s,this)
        });
      };

      s.nodes.osc.connect(s.nodes.worklet);
      s.nodes.worklet.connect(s.nodes.atten);
      s.nodes.atten.connect(actx.destination);
    }
    s.nodes.osc.start(WebAudio.now);
    s.nodes.osc.stop(WebAudio.now + this.get('duration'));

    return this;
  }
  stop() {
    const s = this.state;
    s.nodes.osc.disconnect();
    s.nodes.worklet.disconnect();
    s.nodes.atten.disconnect();
    return this;
  }
}

['block','hop','duration','window'].forEach(prop => {
  Stream.prototype[prop] = function (val) {
    return this.set(prop, val);
  }
});

export default Stream;

// TODO: May break if no function is given.
export const stream = Util.createFactoryMethod(function (...args) {
  return Stream.process(...args);
}, Stream);