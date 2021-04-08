// TODO: Will there be multiple instances of this?
let block = null;
let hop = null;
let process = false;

class ClockProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);

    this._duration = 1;
    this._initTime = currentTime;
    this._cbDelta = 1;
    this._samps = 0;
    this._prevSamps = 0;
    this._intercept = false;
    this._stream = [];

    this.port.onmessage = e => {
      if (e.data.type === 'init') {
        this._initTime = e.data.initTime;
        this._duration = e.data.duration;
        this._cbDelta = e.data.cbDelta;
        this._intercept = e.data.intercept;
        block = e.data.block;
        hop = e.data.hop;
        process = e.data.process;
      }
    };
  }
  // static get parameterDescriptors() {
  //   return [{
  //     name: 'param',
  //     defaultValue: 0,
  //     minValue: 0,
  //     maxValue: 1,
  //     automationRate: 'a-rate'
  //   }]
  // }
  process(inputs, outputs, parameters) {
    if (inputs[0].length) {
      const stream = Array.from(inputs[0][0]);

      const inputLen = stream.length;
      this._samps = (this._samps+inputLen) % this._cbDelta;
      if (this._samps <= this._prevSamps) {
        let phase = (currentTime-this._initTime)/this._duration;
        if (phase >= 1) {
          phase = 1-Number.EPSILON;
        } else if (phase < 0) {
          phase = 0;
        }
        this.port.postMessage({
          type: 'phase',
          phase: phase
        });

        if (this._intercept) {
          if (this._samps === this._prevSamps) {
            this.port.postMessage({
              type: 'intercept',
              stream: stream
            });
          } else {
            this.port.postMessage({
              type: 'intercept',
              stream: this._stream
            });
            this._stream = stream;
          }
        }
      } else {
        if (this._intercept) {
          this._stream = this._stream.concat(stream);
        }
      }
      this._prevSamps = this._samps;
    }
    return true;
  }
}

registerProcessor('clock-processor', ClockProcessor);