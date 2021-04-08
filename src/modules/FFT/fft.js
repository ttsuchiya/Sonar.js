import EM from './fft.wasm.js';
import Sonar from './sonar.esm.js';
const { Seq, Poly } = Sonar;

let Module = null;
EM().then(result => Module=result);

class FFT extends Poly {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'FFT',
      domain: null,
      coordinates: null,

      // TODO: Currently unused.
      DC: false,
      mirror: true,
      radian: false,
      normalize: true,
      sampleRate: 44100
    });
  }
  static cast(obj, phase) {
    const s = obj.state;

    let isPoly;

    if (s.extends) {
      isPoly = s.extends === 'Poly';
    } else {
      isPoly = s.type === 'Poly';
    }

    if (isPoly) {
      if (obj.length >= 2) {
        return this.clone(obj);
      } else {
        return this.of(
          obj[0].clone(),
          phase ? phase : Seq.const(obj[0].length,0)
        )
      }
    } else {
      return this.of(
        obj.clone(),
        phase ? phase : Seq.const(obj.length,0)
      );
      // return this.from([obj,Seq.const(obj.length,0)]);
    }
  }
  domain(domain) {
    this.state.domain = domain;
    return this;
  }
  transform(forward=true, normalize=false) {
    if (!this.length) {
      throw new Error('Cannot transform an empty array.');
    }

    let rIn;

    if (Array.isArray(this[0])) {
      rIn = Seq.clone(this[0]);
    } else if (Array.isArray(this)) {
      rIn = Seq.clone(this);
    } else {
      throw new Error('The input needs to be a Seq or a 2D Poly.');
    }

    const len = rIn.length;
    let iIn = (this[1] && this[1].length === len) ? this[1] : Seq.const(len,0);

    const rInData = new Float32Array(rIn);
    const rInPtr = Module._malloc(rInData.byteLength);
    const rInView = new Float32Array(Module.HEAP32.buffer, rInPtr, rInData.length);
    rInView.set(rInData);

    const iInData = new Float32Array(iIn);
    const iInPtr = Module._malloc(iInData.byteLength);
    const iInView = new Float32Array(Module.HEAP32.buffer, iInPtr, iInData.length);
    iInView.set(iInData);

    const rOutData = new Float32Array(len);
    const rOutPtr = Module._malloc(rOutData.byteLength);
    const rOutView = new Float32Array(Module.HEAP32.buffer, rOutPtr, rOutData.length);
    rOutView.set(rOutData);

    const iOutData = new Float32Array(len);
    const iOutPtr = Module._malloc(iOutData.byteLength);
    const iOutView = new Float32Array(Module.HEAP32.buffer, iOutPtr, iOutData.length);
    iOutView.set(iOutData);

    const inverse = forward ? 0 : 1;
    Module.ccall(
      'transform',
      null,
      ['number','number','number','number','number','number'],
      [rInPtr,iInPtr,rOutPtr,iOutPtr,len,inverse]
    );
    Module._free(rInPtr);
    Module._free(iInPtr);
    Module._free(rOutPtr);
    Module._free(iOutPtr);

    const res = this.constructor.of(rOutView,iOutView);
    res.state.coordinates = 'cartesian';
    return res;
  }
  forward() {
    return this.transform(true);
  }
  inverse() {
    return this.transform(false);
  }
  synthesize(dc=false, mirror=true, radian=false) {
    if (!this.length) {
      throw new Error('Cannot transform an empty array.');
    }

    let mag;

    if (Array.isArray(this[0])) {
      mag = Seq.clone(this[0]);
    } else if (Array.isArray(this)) {
      mag = Seq.clone(this);
    } else {
      throw new Error('The input needs to be a Seq or a 2D Poly.');
    }

    const len = mag.length;
    let phase = (this[1] && this[1].length === len) ? Seq.clone(this[1]) : Seq.const(len,0);
    if (!radian) {
      phase = phase.radian();
    }

    if (mirror) {
      const magLeft = mag.slide(1,Math.floor(len/2)).divideby(2);
      const phaseLeft = phase.slide(1,Math.floor(len/2));

      // let magRight = magLeft.reverse();
      // let phaseRight = phaseLeft.reverse().multiply(-1);
      //
      // if (len%2 === 0) {
      //   magRight.shift();
      //   phaseRight.shift();
      // }

      let magRight, phaseRight;
      if (len%2 === 0) {
        magRight = new Array(magLeft.length-1);
        phaseRight = new Array(phaseLeft.length-1);
      } else {
        magRight = new Array(magLeft.length);
        phaseRight = new Array(phaseLeft.length);
      }
      // for (let i = 0; i < magRight.length; i++) {
      //   magRight[i] = magLeft[magLeft.length-1-i];
      //   phaseRight[i] = -phaseLeft[phaseLeft.length-1-i];
      // }
      for (let i = 0; i < magRight.length; i++) {
        magRight[magRight.length-1-i] = magLeft[i];
        phaseRight[phaseRight.length-1-i] = -phaseLeft[i];
      }

      // mag = Seq.concat(mag[0],magLeft,magRight);
      // phase = Seq.concat(phase[0],phaseLeft,phaseRight);

      for (let i = 0; i < magLeft.length; i++) {
        mag[1+i] = magLeft[i];
        phase[1+i] = phaseLeft[i];
      }
      for (let i = 0; i < magRight.length; i++) {
        mag[1+magLeft.length+i] = magRight[i];
        phase[1+phaseLeft.length+i] = phaseRight[i];
      }
    }
    if (!dc) mag[0] = 0;

    const magData = new Float32Array(mag.length);
    for (let i = 0; i < mag.length; i++) {
      magData[i] = mag[i];
    }

    const magPtr = Module._malloc(magData.byteLength);
    const magView = new Float32Array(Module.HEAP32.buffer, magPtr, magData.length);
    magView.set(magData);

    const phaseData = new Float32Array(phase.length);
    for (let i = 0; i < phase.length; i++) {
      phaseData[i] = phase[i];
    }

    const phasePtr = Module._malloc(phaseData.byteLength);
    const phaseView = new Float32Array(Module.HEAP32.buffer, phasePtr, phaseData.length);
    phaseView.set(phaseData);

    const realData = new Float32Array(mag.length);
    const realPtr = Module._malloc(realData.byteLength);
    const realView = new Float32Array(Module.HEAP32.buffer, realPtr, realData.length);
    realView.set(realData);

    const imagData = new Float32Array(mag.length);
    const imagPtr = Module._malloc(imagData.byteLength);
    const imagView = new Float32Array(Module.HEAP32.buffer, imagPtr, imagData.length);
    imagView.set(imagData);

    Module.ccall(
      'synthesize',
      null,
      ['number','number','number','number','number'],
      [magPtr,phasePtr,realPtr,imagPtr,len]
    );
    Module._free(magPtr);
    Module._free(phasePtr);
    Module._free(realPtr);
    Module._free(imagPtr);

    const res = this.constructor.of(realView,imagView);
    res.state.domain = 'time';
    res.state.coordinates = 'cartesian';
    return res;
  }
  analyze(normalize=true, fold=true, radian=false) {
    if (!this.length) {
      throw new Error('Cannot transform an empty array.');
    }

    let real;

    if (Array.isArray(this[0])) {
      real = Seq.clone(this[0]);
    } else if (Array.isArray(this)) {
      real = Seq.clone(this);
    } else {
      throw new Error('The input needs to be a Seq or a 2D Poly.');
    }

    const len = real.length;
    let imag = (this[1] && this[1].length === len) ? this[1] : Seq.const(len,0);

    const realData = new Float32Array(real);
    const realPtr = Module._malloc(realData.byteLength);
    const realView = new Float32Array(Module.HEAP32.buffer, realPtr, realData.length);
    realView.set(realData);

    const imagData = new Float32Array(imag);
    const imagPtr = Module._malloc(imagData.byteLength);
    const imagView = new Float32Array(Module.HEAP32.buffer, imagPtr, imagData.length);
    imagView.set(imagData);

    const magData = new Float32Array(len);
    const magPtr = Module._malloc(magData.byteLength);
    const magView = new Float32Array(Module.HEAP32.buffer, magPtr, magData.length);
    magView.set(magData);

    const phaseData = new Float32Array(len);
    const phasePtr = Module._malloc(phaseData.byteLength);
    const phaseView = new Float32Array(Module.HEAP32.buffer, phasePtr, phaseData.length);
    phaseView.set(phaseData);

    Module.ccall(
      'analyze',
      null,
      ['number','number','number','number','number'],
      [realPtr,imagPtr,magPtr,phasePtr,len]
    );
    Module._free(realPtr);
    Module._free(imagPtr);
    Module._free(magPtr);
    Module._free(phasePtr);

    let mag = Seq.clone(magView);
    let phase = Seq.clone(phaseView);

    if (fold) {
      mag = mag.put(Seq.range(Math.floor(len/2)+1,len),0);
      phase = phase.put(Seq.range(Math.floor(len/2)+1,len),0);
    }

    if (normalize && fold) {
      mag = mag.divideby(len/2);
    } else if (normalize) {
      mag = mag.divideby(len);
    } else if (fold) {
      mag = mag.multiply(2);
    }

    if (!radian) {
      phase = phase.divideby(2*Math.PI).modulo(1);
    }

    const res = this.constructor.of(mag,phase);
    res.state.domain = 'frequency';
    res.state.coordinates = 'polar';
    return res;
  }
  centroid(unit='freq') {
    // Note: After using analyze
    const mag = this[0].slide(1,Math.floor(this[0].length/2));
    const magSum = mag.sum();
    let res = 0;

    for (let i = 0; i < mag.length; i++) {
      const v = mag[i];
      res += (i+1)*v/magSum; // Note: [magSum] is interpreted as a number.
    }

    if (['freq','frequency',true].includes(unit)) {
      res *= this.state.sampleRate/this[0].length;
    } else if (['normal','normalize'].includes(unit)) {
      res /= this[0].length/2;
    }

    res = this.constructor.of(res);
    res.state.domain = 'feature';
    return res;
  }
  spread(unit='freq') {
    const mag = this[0].slide(1,Math.floor(this[0].length/2));
    const magSum = mag.sum();
    const centr = this.centroid('bin');
    let res = 0;

    for (let i = 0; i < mag.length; i++) {
      res += Math.pow((i+1)-centr,2)*mag[i]/magSum;
    }

    if (['freq','frequency',true].includes(unit)) {
      res *= this.state.sampleRate/this[0].length;
    } else if (['normal','normalize'].includes(unit)) {
      res /= this[0].length/2;
    }

    res = this.constructor.of(res);
    res.state.domain = 'feature';
    return res;
  }
  skewness(unit='bin') {
    const mag = this[0].slide(1,Math.floor(this[0].length/2));
    const magSum = mag.sum();
    const centr = this.centroid('bin');
    const std = this.spread('bin').sqrt();
    let res = 0;

    // Note: std using the FFT[Seq[]] format.
    if (std[0][0] !== 0) {
      for (let i = 0; i < mag.length; i++) {
        res += Math.pow(((i+1)-centr),3) * mag[i]/magSum;
      }
      res /= Math.pow(std,3);
    }

    if (['freq','frequency',true].includes(unit)) {
      res *= this.state.sampleRate/this[0].length;
    } else if (['normal','normalize'].includes(unit)) {
      res /= this[0].length/2;
    }

    res = this.constructor.of(res);
    res.state.domain = 'feature';
    return res;
  }
  kurtosis(unit='bin') {
    const mag = this[0].slide(1,Math.floor(this[0].length/2));
    const magSum = mag.sum();
    const centr = this.centroid('bin');
    const std = this.spread('bin').sqrt();
    let res = 0;

    // Note: std using the FFT[Seq[]] format.
    if (std[0][0] !== 0) {
      for (let i = 0; i < mag.length; i++) {
        res += Math.pow(((i+1)-centr),4) * mag[i]/magSum;
      }
      res /= Math.pow(std,4);
    }

    if (['freq','frequency',true].includes(unit)) {
      res *= this.state.sampleRate/this[0].length;
    } else if (['normal','normalize'].includes(unit)) {
      res /= this[0].length/2;
    }

    res = this.constructor.of(res);
    res.state.domain = 'feature';
    return res;
  }
  slope(unit='freq') {}
  decrease(unit='freq') {}
  rolloff(unit='freq', thresh=.95) {
    const mag = this[0].slide(1,Math.floor(this[0].length/2));
    const magSqSumThresh = mag.power(2).sum().multiply(thresh);
    let res = 0;

    for (let i = 0; i < mag.length; i++) {
      res += Math.pow(mag[i],2);
      if (res >= magSqSumThresh) {
        res = i+1;
        break;
      }
    }

    if (['freq','frequency',true].includes(unit)) {
      res *= this.state.sampleRate/this[0].length;
    } else if (['normal','normalize'].includes(unit)) {
      res /= this[0].length/2;
    }

    res = this.constructor.of(res);
    res.state.domain = 'feature';
    return res;
  }
  flux(prevFrame) {
    // Note: Assumes the use of analysis results.

    const mag = this[0];
    const prevMag = prevFrame[0];
    let res = 1 - mag.multiply(prevMag).sum() / (mag.power(2).sum().sqrt() * prevMag.power(2).sum().sqrt());
    res = this.constructor.of(res);
    res.state.domain = 'feature';
    return res;
  }
  MFCC() {

  }
  inharmonicity() {}
  harmonicdeviation() {}
  OEratio() {}

  cepstrum() {
    // Note: Expect time-domain signal.
    const k = this[0].length;
    const logMag = this.transform().cartopol()[0].divideby(k).log();
    return logMag.cast(this.constructor).transform(false);
  }
  lifter(n, mirror=false) {
    // Note: Expect time-domain signal.
    const k = this[0].length;
    const logMag = this.transform().cartopol()[0].divideby(mirror ? k : k/2).log();
    const cepstrum = logMag.cast(this.constructor).transform(false);

    const res = cepstrum[0].fill(0,n,k-n)
      .cast(this.constructor).transform()[0].divideby(k).powerof(Math.E);

    return mirror ? res : res.fill(0,k/2);
  }
  hilbert() {
    return this;
  }
  DCT() {
    const N = this[0].length;
    const mirrored = this[0].peek(v => v.concat(v.reverse()));
    return mirrored.cast(this.constructor)
      .transform()
      .transpose()
      .slice(0,N)
      .map((v,i) => {
        const coef = -Math.PI*i/(2*N);
        return (v[0]*Math.cos(coef) - v[1]*Math.sin(coef))
          * (i ? Math.sqrt(2/N) : 1/Math.sqrt(N)) / 2;
      }).cast(Seq);
  }
  IDCT() {
    const N = this[0].length;
    return this[0].map((v,i) => i ? v/Math.sqrt(2/N) : v*Math.sqrt(N))
      .peek(v => v.concat(0,v.at(Seq.range(-1,-N)).multiply(-1)))
      .map((v,i) => {
        const coef = -Math.PI*i/(2*N);
        return Seq.of(
          v*Math.cos(coef),
          -v*Math.sin(coef)
        )
      }).cast(Poly).transpose()
      .cast(this.constructor)
      .transform(false)[0]
      .slice(0,N)
      .divideby(N);
  }
  cartopol() {
    if (this.length !== 2 && !this.every(v => Array.isArray(v))) {
      throw new Error('');
    }

    if (this.state.coordinates === 'polar') {
      return this;
    } else {
      const res = this.clone();
      const real = this[0];
      const imag = this[1];

      for (let i = 0; i < real.length; i++) {
        res[0][i] = Math.sqrt(Math.pow(real[i],2)+Math.pow(imag[i],2));
        res[1][i] = Math.atan(imag[i]===0 ? 0 : imag[i]/real[i]);
      }

      res.state.coordinates = 'polar';
      return res;
    }
  }
  poltocar() {
    if (this.length !== 2 && !this.every(v => Array.isArray(v))) {
      throw new Error('');
    }

    if (this.state.coordinates === 'cartesian') {
      return this;
    } else {
      const res = this.clone();
      const mag = this[0];
      const phase = this[1];

      for (let i = 0; i < mag.length; i++) {
        res[0][i] = mag[i] * Math.cos(phase[i]);
        res[1][i] = mag[i] * Math.sin(phase[i]);
      }

      res.state.coordinates = 'cartesian';
      return res;
    }
  }
  radian() {
    if (this.length !== 2) {
      throw new Error('');
    }
    const res = this.clone();
    res[1] = res[1].radian();
    return res;
  }
  radiantophase() {}
  wrap() {}
  unwrap() {}

  // To be used with synthesize()
  increment(amount=0, radian=false, samps=false, mirror=true) {
    if (this.length !== 2 && !this.every(v => Array.isArray(v))) {
      throw new Error('');
    }

    // TODO: This does not clone the child seqs!!!
    const res = this.clone();
    const phase = res[1].clone();

    if (samps) {
      amount /= phase.length;
    }
    if (radian) {
      amount *= 2*Math.PI;
    }
    // const len = mirror ? phase.length/2+1 : phase.length;
    const len = phase.length;
    for (let i = 0; i < len; i++) {
      let p = phase[i];
      p = (p+i*amount)%1;
      phase[i] = p;
    }
    res[1] = phase;
    return res;
  }
}

export { FFT };