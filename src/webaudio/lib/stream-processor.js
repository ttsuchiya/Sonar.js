class StreamProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args);

    let opt = args[0].processorOptions;
    this.block = opt.block;
    this.hop = opt.hop;
    this.window = opt.window;
    this.duration = opt.duration;

    this.buffer = new Float32Array(this.block+this.hop);

    this.initTime = currentTime;
    this.initFrame = currentFrame;
    this.frame = null;
    this.currentHop = 0;

    this.port.onmessage = e => {
      this.overlapBlock(e.data.block)
    };

    this.requestBlock({
      phase: 0,
      cycle: 0,
    });
  }
  requestBlock(params) {
    this.port.postMessage(params);
  }
  overlapBlock(block) {
    for (let i = 0; i < this.block; i++) {
      this.buffer[this.hop+i] += block[i] * (this.window ? this.window[i] : 1);
    }
  }
  shiftBuffer() {
    let temp = new Float32Array(this.hop+this.block);
    for (let i = 0; i < this.block; i++) {
      temp[i] = this.buffer[this.hop+i];
    }
    this.buffer = temp;
  }
  process(inputs, outputs) {
    const output = outputs[0][0];

    this.frame = currentFrame-this.initFrame;
    let localFrame = this.frame % this.block;
    let localHop = this.frame % this.hop;
    let hop = Math.floor(this.frame/this.hop);

    if (this.currentHop !== hop) {
      this.currentHop = hop;
      this.shiftBuffer();

      this.requestBlock({
        phase: (currentTime-this.initTime)/this.duration,
        cycle: this.frame/this.block
      });
    }

    for (let i = 0; i < 128; i++) {
      output[i] = this.buffer[localHop+i];
    }

    return true;
  }
}

registerProcessor('stream-processor', StreamProcessor);