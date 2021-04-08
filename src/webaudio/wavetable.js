import Waveform from './waveform';
import Seq from '../core/seq';
import Util from '../util';
import WebAudio from './webaudio';

const actx = WebAudio.context;
let wavetables = [];

class WaveTable extends Waveform {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'WaveTable',
      extends: 'Seq',
      frequency: Seq.of(440),
      amplitude: Seq.of(1)
    });
  }
  // static stop() {
    // wavetables.forEach(v => v.disconnect());
    // wavetables = [];
  // }
  static from(...args) {
    let res = super.from(...args);
    return res.duration(1);
  }
  play() {
    super.initialize();
    this.state.bsNode.loop = true;
    this.state.bsNode.playbackRate.setValueAtTime(440*this.length/actx.sampleRate,actx.currentTime);
    super.start();
    return this;
  }
  stop() {
    super.stop();
    return this;
  }
  amplitude(...args) {
    args = this.constructor.flatten(args);
    this.state.amplitude = args;
    super.amplitude(args);
    return this;
  }
  frequency(...args) {
    args = this.constructor.flatten(args);
    this.state.frequency = args;
    this.update(this.freqtopitch(args),'state.bsNode.playbackRate');
    return this;
  }
  freqtopitch(args) {
    if (args.length === 1) args = args.concat(args[0]);
    return args.map(v => v*this.length/actx.sampleRate);
  }
  waveform(...args) {
    args = Util.unspread(args);
    let bufferView = this.state.buffer.getChannelData(0);
    for (let i = 0; i < bufferView.length; i++) {
      bufferView[i] = args[i];
    }
    return this;
  }
  process() {}
  render() {
    let samps = Math.round(this.state.duration * actx.sampleRate);
    let amp = this.state.amplitude.linear(samps);
    return Waveform.clone(this.step(samps).FM(this.state.frequency.multiply(samps/actx.sampleRate)).multiply(amp));
  }
}

export default WaveTable;
export const wavetable = Util.createFactoryMethod(function (...args) {
  return WaveTable.clone(Util.flatten(args));
}, WaveTable);