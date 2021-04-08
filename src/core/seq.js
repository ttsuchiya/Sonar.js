import Util from '../util';

const states = new WeakMap();

class Seq extends Array {
  constructor(...args) {
    super(...args);
    states.set(this, { type: 'Seq' });
  }
  get state() {
    return states.get(this);
  }
  set state(s) {
    states.set(this,s);
  }

  // region Utilities (static)
  static augment(name, fn) {
    this.prototype[name] = fn;
    Util.propagateProtoWrap(this, name);
    return this;
  }
  static alias(...args) {
    if (Util.argtype(args) === 'object') {
      Object.entries(args[0]).forEach(([src,tgt]) => {
        if (typeof(tgt)==='string' && !this.prototype.hasOwnProperty(tgt)) {
          this.prototype[tgt] = this.prototype[src];
          Util.propagateProtoWrap(this, tgt);
        }
      });
    } else if (args.length === 2) {
      const [src, tgt] = args;
      if (!this.prototype.hasOwnProperty(tgt)) {
        this.prototype[tgt] = this.prototype[src];
        Util.propagateProtoWrap(this, tgt);
      }
    }
    return this;
  }
  // endregion

  // region Formatters (static)
  static cast(v, ...args) {
    let src;
    if (
      v.state &&
      v.state.type === 'FFT' &&
      v.state.domain === 'time'
    ) {
      src = v[0];
    } else {
      src = this.flatten(v);
    }
    const res = this.empty(src.length);
    for (let i = 0; i < src.length; i++) {
      res[i] = src[i];
    }
    return res;
  }
  static clone(src) {
    const res = this.empty(src.length);
    for (let i = 0; i < src.length; i++) {
      res[i] = src[i];
    }
    if (src.state && src.state.type===res.state.type) {
      // TODO: Tempo.state.blocks not being copied.
      res.set(src.state);
    }
    return res;
  }
  static flatten(...args) {
    if (Util.isFlat(args)) return this.from(args);

    const argtype = Util.argtype(args);
    const res = this.from(Util.flatten(args));
    if (args.length===1) {
      if (args[0][0] && args[0][0].state) return res.set(args[0][0].state);
      else if (args[0].state) return res.set(args[0].state);
    } else if (argtype==='prefix' && args[1].state) {
      return res.set(args[1].state);
    }
    return res;

    // if (super.prototype.flat) {
    //   return super.from(args).flat(Infinity);
    // } else {
    //   const res = this.empty(args.length);
    //   for (let i = 0; i < args.length; i++) {
    //     res[i] = args[i];
    //   }
    //   return res.flat(Infinity);
    // }
  }
  // TODO: Do not flatten.
  static concat(...args) {
    args = Util.flatten(args);
    const res = this.empty(args.length);
    for (let i = 0; i < args.length; i++) {
      res[i] = args[i];
    }
    return res;
  }
  static mask(...args) {
    // Note: Don't spread -- always expect Seqs.
    return args.reduce((a,b) => a.mask(b));
  }
  // endregion

  // region Generators (static)
  static empty(len=0) {
    return new this.prototype.constructor(~~len);
  }
  static const(...args) {
    args = Util.flatten(args);
    const [len,val] = Util.mapParams(args, [
      ['length', 0],
      ['value', 0]
    ]);
    const res = this.empty(len);
    for (let i = 0; i < len; i++) {
      res[i] = val;
    }
    return res;
  }
  static range(...args) {
    args = Util.flatten(args);
    let [start,stop,step] = Util.mapVariadicParams(args, [
      ['start', 0],
      ['stop', 1],
      ['step', 1]
    ], [
      ['stop'],
      ['start', 'stop'],
      ['start', 'stop', 'step']
    ]);

    const len = Math.ceil(stop>start ? (stop-start)/step : (start-stop/step));
    step = start>stop ? -step : step;
    const res = this.empty(len);
    for (let i = 0; i < len; i++) {
      res[i] = i * step + start;
    }
    return res;
  }
  static line(...args) {
    args = Util.flatten(args);
    const [len,start,stop] = Util.mapParams(args, [
      ['length', 2],
      ['start', 0],
      ['stop', 1]
    ]);
    const step = (stop-start)/(len-1);
    const res = this.empty(len);
    for (let i = 0; i < len; i++) {
      res[i] = start + i*step;
    }
    return res;
  }
  static phasor(...args) {
    args = Util.flatten(args);
    let [len,freq,shift,wrap] = Util.mapParams(args, [
      ['length', 1],
      ['frequency', 1],
      ['shift', 0],
      ['wrap', true]
    ]);

    len = ~~len;
    const res = this.empty(len);
    const max = wrap ? 1-(Number.EPSILON*2) : 1; // Note: (1-Number.EPSILON).modulo(1) is unstable.
    const div = len > 1 ? len : 2;
    if (freq < 0) {
      freq = Math.abs(freq);
      for (let i = 0; i < len; i++) {
        res[i] = (len-1-i)*(freq*max/(div-1))+shift;
      }
    } else {
      for (let i = 0; i < len; i++) {
        res[i] = i*(freq*max/(div-1))+shift;
      }
    }
    return wrap ? res.modulo(1) : res;
  }
  static pframe(...args) {
    args = Util.flatten(args);
    // Order: len, phase, width?
    const [len,phase,width] = Util.mapParams(args, [
      ['length', 2],
      ['phase', 0.5],
      ['width', 0.1]
    ]);
    const hw = width/2;
    const center = phase*(1-width)+hw;
    return this.range(len).rescale(center-hw,center+hw);
  }
  static random(...args) {
    args = Util.flatten(args);
    const [len,min,max] = Util.mapVariadicParams(args, [
      ['length', 1],
      ['minimum', 0],
      ['maximum', 1]
    ], [
      ['length'],
      ['length', 'maximum'],
      ['length', 'minimum', 'maximum']
    ]);
    const res = this.empty(len);
    for (let i = 0; i < len; i++) {
      res[i] = Math.random()*(max-min)+min;
    }
    return res;
  }
  static randint(...args) {
    args = Util.flatten(args);
    const [len,min,max] = Util.mapVariadicParams(args, [
      ['length', 1],
      ['minimum', 0],
      ['maximum', 2]
    ], [
      ['length'],
      ['length', 'maximum'],
      ['length', 'minimum', 'maximum']
    ]);
    const res = this.empty(len);
    for (let i = 0; i < len; i++) {
      res[i] = Math.floor(Math.random()*(max-min)+min);
    }
    return res;
  }
  static prime(...args) {
    args = Util.flatten(args);
    let res;

    let [len,min,max] = [1,null,null];
    switch (args.length) {
      case 1:
        len = args[0];

        res = this.of(2);
        let cur = 3;

        for (let i=(min?0:1); i<len; i++) {
          while (res.some(v => cur%v === 0)) {
            cur++;
          }
          res.push(cur);
          if (min && cur<min) {
            i--;
          }
        }
        return res;
      case 2:
        [min,max] = args;
        if (min<2) min = 2;

        res = this.range(max+1);
        let rt = Math.sqrt(max);
        for (let i=2; i<=rt; i++) {
          for (let j=i*i; j<=max; j+=i) {
            res[j] = 0;
          }
        }
        return res.filter(v => v>=min);
      default:
        return this.of(2);
    }
  }
  static fibonacci(len=2) {
    const res = this.of(0,1);
    for (let i = 2; i <= len; i++) {
      res.push(res[i-1]+res[i-2]);
    }
    return res;
  }
  static hamming(...args) {
    args = Util.flatten(args);
    const [len,alpha,beta] = Util.mapParams(args, [
      ['length', 1],
      ['alpha', 0.54],
      ['beta', 0.46]
    ]);
    const res = this.empty(len);
    const phase = this.of(0,1).linear(len);
    for (let i = 0; i < len; i++) {
      res[i] = alpha-beta*Math.cos(2*Math.PI*phase[i]);
    }
    return res;
  }
  static normal(...args) {
    args = Util.flatten(args);
    const [len,mean,variance] = Util.mapParams(args, [
      ['length', 2],
      ['mean', 0],
      ['variance', 1]
    ]);
    return this.of(-Math.PI,Math.PI).linear(len).normal(mean,variance);
  }
  static lognormal(...args) {
    args = Util.flatten(args);
    const [len,mean,std] = Util.mapParams(args, [
      ['length', 2],
      ['mean', 0],
      ['variance', 1]
    ]);
    return this.of(Number.EPSILON,6).linear(len).lognormal(mean,std);
  }
  static logistic(...args) {
    args = Util.flatten(args);
    const [len,L,k,mid] = Util.mapParams(args, [
      ['length', 2],
      ['L', 1],
      ['k', 1],
      ['mid', 0]
    ]);
    return this.of(-6,6).linear(len).logistic(L,k,mid);
  }
  // endregion

  // region Utilities
  set(...args) {
    const type = Util.argtype(args);
    if (args[0] && args[0].state) {
      // TODO: Deep copy?
      // this.state = Util.deepCopy(args[0].state);
      Object.assign(this.state, args[0].state);
    } else if (type==='object') {
      // TODO: Deep copy?
      Object.assign(this.state, args[0]);
    } else if (type==='prefix' || type==='array') {
      const [key,val] = args;
      this.state[key] = val;
    } else if (type==='empty') {
      return this.constructor.from(this);
    }
    return this;
  }
  get(key) {
    return key ? this.state[key] : this.state;
  }
  clone() {
    return this.constructor.clone(this);
  }
  values(...args) {
    if (args.length) {
      const res = new this.constructor(args.length);
      for (let i = 0; i < args.length; i++) {
        res[i] = args[i];
      }
      return res.set(this.state);
    } else {
      const res = new this.constructor(this.length);
      for (let i = 0; i < this.length; i++) {
        res[i] = this[i];
      }
      return res;
    }
  }
  empty() {
    const res = new this.constructor();
    return res.set(this.state);
  }
  // TODO: Copy-state method
  // TODO: Cast to Array
  cast(type, ...args) {
    // Note: type can be either the class or the factory-method object.
    const cons = type.prototype.constructor;
    if (cons.cast) {
      return cons.cast(this, ...args);
    } else {
      return this.constructor === cons ? this : cons.clone(this);
    }
  }
  encapsulate(type) {
    return type.prototype.constructor.of(this);
  }
  // endregion

  // region Accessors
  at(...args) {
    const indices = Util.flatten(args);
    const res = new this.constructor(indices.length);

    for (let i = 0; i < indices.length; i++) {
      const v = Util.modulo(indices[i],this.length);

      if (Number.isInteger(v)) {
        res[i] = this[v];
      } else {
        res[i] = this.phase2(v/(this.length-1))[0];
      }
    }
    return res;
  }
  put(index, val) {
    const res = this.clone();
    const indices = Util.type(index)==='array' ? index : [index];
    const vals =  Util.type(val)==='array' ? val : [val];

    for (let i = 0; i < indices.length; i++) {
      const j = Util.modulo(indices[i],res.length);
      res[j] = vals[i%vals.length];
    }
    return res;
  }
  take(index, fn) {
    const indices = Util.type(index)==='array' ? index : [index];
    const res = this.at(indices).map(fn);

    if (res) {
      return this.put(indices,res);
    } else {
      return this;
    }
  }
  slide(pos, size=1) {
    const indices = this.constructor.range(pos,pos+size);
    return this.at(indices);
  }
  peek(fn) {
    const res = fn(this.clone());

    if (Util.type(res) === 'empty') {
      return this;
    }

    if (res.constructor.name === 'Array') {
      return Util.nestedArrayToTypedLists(res, this.constructor);
    } else if (!res.state || !res.state.type) {
      return this.constructor.of(res);
    } else if (typeof(res.clone)!=='function') {
      // TODO: Not sure if this is good.
      return this.clone();
    } else {
      return res;
    }
  }
  poke(fn) {
    const res = fn(this);

    if (Util.type(res) === 'empty') {
      return this;
    }
    if (res.constructor.name === 'Array') {
      return Util.nestedArrayToTypedLists(res, this.constructor);
    } else if (!res.state || !res.state.type) {
      return this.constructor.of(res);
    } else if (typeof(res.clone)!=='function') {
      // TODO: Not sure if this is good.
      return this.clone();
    } else {
      return res;
    }
  }
  with(type, fn) {
    const res = fn(this.cast(type));

    if (res) {
      return res.cast(this.constructor);
    } else {
      return this;
    }
  }
  apply(type, name, ...args) {
    const res = this.cast(type)[name](...args);
    if (res) {
      return res.cast(this.constructor);
    } else {
      return this;
    }
  }
  do(index, fn) {
    const indices = Array.isArray(index) ? index : [index];
    const res = fn(this.at(indices));

    if (res) {
      return this.put(indices,res);
    } else {
      return this;
    }
  }
  insert(index, val) {
    const indices = Array.isArray(index) ? index : [index];
    const vals = Array.isArray(val) ? val : [val];
    const indicesMap = indices.map((v,i) => [v,i]);
    const desc = indicesMap.sort((a,b) => b[0]-a[0]);
    let res = this.clone();

    for (let i = 0; i < desc.length; i++) {
      res = res.splice(desc[i][0],0,vals[desc[i][1]%vals.length]);
    }
    return res;
  }
  drop(...args) {
    args = Seq.flatten(args).unique();
    const res = this.constructor.empty(this.length-args.length);

    let idx = 0;
    for (let i = 0; i < this.length; i++) {
      if (!args.includes(i)) res[idx++] = this[i];
    }

    return res;
  }
  remove(...args) {
    args = this.constructor.flatten(args);
    const argtype = Util.argtype(args);

    let res = this.constructor.empty();
    if (argtype === 'array') {
      args = args.unique();
      for (let i = 0; i < this.length; i++) {
        if (!args.includes(this[i])) res.push(this[i]);
      }
    } else if (argtype === 'function') {
      for (let i = 0; i < this.length; i++) {
        if (!args[0](this[i],this)) res.push(this[i]);
      }
    }
    return res;
  }
  // TODO: Possibly redundant with map
  replace(tgt, val) {
    tgt = Util.flatten([tgt]);
    const argtype = Util.argtype(tgt);

    if (argtype === 'array') {
      for (let i = 0; i < this.length; i++) {
        // TODO
      }
    } else if (argtype === 'function') {

    }

    return this;
  }
  // endregion

  // region Interpolations
  phase(...args) {
    // args = this.constructor.flatten(args);
    //
    // // TODO: Experimental! Watch out for the overhead.
    // for (let i = 0; i < args.length; i++) {
    //   if (typeof(args[i].phase)==='number' && !Number.isNaN(args[i].phase)) {
    //     args[i] = args[i].phase;
    //   }
    // }
    args = Util.flatten(args);

    const res = new this.constructor(args.length);

    // Note: multiply(1-EPSILON) is questionable.
    if (!this.length) {
      return this;
    } else if (this.length === 1) {
      for (let i = 0; i < args.length; i++) {
        res[i] = this[i];
      }
    } else {
      for (let i = 0; i < args.length; i++) {
        const wrappedPhase = Util.modulo(args[i]*(1-Number.EPSILON),1);
        const fracIndex = wrappedPhase*(this.length-1);
        const int = ~~fracIndex;
        const frac = fracIndex - int;
        res[i] = this[int]*(1-frac) + this[int+1]*frac;
      }
    }

    return res;
  }
  phase2(...args) {
    args = this.constructor.flatten(args);

    let wrappedPhase = new Array(args.length);
    for (let i = 0; i < args.length; i++) {
      const v = args[i];
      if (Number.isInteger(v) && v !== 0) {
        wrappedPhase[i] = 1;
      } else {
        wrappedPhase[i] = Util.modulo(v,1);
      }
    }

    const res = new this.constructor(wrappedPhase.length);
    for (let i = 0; i < wrappedPhase.length; i++) {
      if (wrappedPhase[i] === 1) {
        res[i] = this[this.length-1];
      } else {
        const fracIndex = wrappedPhase[i]*(this.length-1);
        const int = Math.floor(fracIndex);
        const frac = fracIndex - int;
        res[i] = this[int]*(1-frac) + this[int+1]*frac;
      }
    }
    return res;
  }
  // TODO: Call it pstep
  phasestep(...args) {
    args = this.constructor.flatten(args);

    // TODO: Experimental! Watch out for the overhead.
    for (let i = 0; i < args.length; i++) {
      if (!Number.isNaN(Number.parseFloat(args[i].phase))) {
        args[i] = args[i].phase;
      }
    }

    // TODO: Copy state?
    const res = new this.constructor(args.length);
    for (let i = 0; i < args.length; i++) {
      const index = Util.modulo(Math.floor(args[i]*(1-Number.EPSILON)*this.length), this.length);
      res[i] = this[index];
    }
    return res;
  }
  phasemax(...args) {
    args = this.constructor.flatten(args);

    // TODO: Use for-loop.
    return args.map(v => {
      let fracIndex = v*(this.length-1);
      let int = Math.floor(fracIndex);
      let a = this[int];
      let b = int===this.length-1 ? 0 : this[int+1];
      return Math.max(a,b);
    });
  }
  phasemaxbp(...args) {
    args = this.constructor.flatten(args);

    // TODO: Use for-loop.
    return args.map(v => {
      const fracIndex = v * (this.length - 1);
      const int = Math.floor(fracIndex);
      const a = this[int];
      const b = int===this.length - 1 ? 0 : this[int+1];
      return Math.abs(a)>Math.abs(b) ? a : b;
    });
  }
  pframe(phase, width=0.1, len=null) {
    // TODO: Experimental! Watch out for the overhead.
    if (typeof(phase.phase)==='number' && !Number.isNaN(phase.phase)) {
      phase = phase.phase;
    }

    if (len) {
      const pf = Seq.pframe(len,phase,width);
      return this.phase(pf);
    } else {
      const hw = width/2;
      const center = phase*(1-width)+hw;
      const [start,end] = [Math.round((center-hw)*this.length),Math.round((center+hw)*this.length)];
      return this.at(Seq.range(start,end));
    }
  }
  pframestep(phase, width=0.1, len=null) {
    // TODO: Experimental! Watch out for the overhead.
    if (typeof(phase.phase)==='number' && !Number.isNaN(phase.phase)) {
      phase = phase.phase;
    }

    if (len) {
      const pf = Seq.pframe(len,phase*(1-Number.EPSILON),width);
      return this.phasestep(pf);
    } else {
      return this.pframe(phase,width);
    }
  }
  pslice(start, end) {
    let startIdx = Math.round(start * this.length);
    let endIdx = Math.round(end * this.length);
    return this.at(Seq.range(startIdx,endIdx));
  }
  pslide(phase, len=1) {
    let start = Math.round(phase * this.length);
    return this.slide(start, len);
  }
  pwrite(phase, val) {
    const res = this.clone();
    const phases = Array.isArray(phase) ? phase : [phase];
    const vals = Array.isArray(val) ? val : [val];

    for (let i = 0; i < phases.length; i++) {
      const j = Util.modulo(Math.round(phases[i]*(res.length-1)),res.length);
      res[j] = vals[i%vals.length];
    }

    return res;
  }
  pinsert(phase, val) {

  }
  phaseof(val) {
    const res = this.constructor.empty();
    if (Array.isArray(val)) {
      val = val[0];
    }

    for (let i = 0; i < this.length-1; i++) {
      let [start,stop,range] = [this[i],this[i+1],this[i+1]-this[i]];

      if ((start <= val && val < stop) || (stop < val && val <= start)) {
        let phase = ((val-start)/range+i)/(this.length-1);
        res.push(phase);
      } else if (range === 0 && start === val) {
        let phase = i/(this.length-1);
        res.push(phase);
      } else if (val === stop && i+2 === this.length) {
        res.push(1);
      }
    }
    return res;
  }
  pmap(fn) {
    const res = new this.constructor(this.length);
    if (this.length === 1) {
      res[0] = fn(this[i],0,this);
    } else {
      for (let i = 0; i < this.length; i++) {
        res[i] = fn(this[i],i/(this.length-1),this);
      }
    }
    return res;
  }
  peach(fn) {
    if (this.length === 1) {
      fn(this[i],0,this);
    } else {
      for (let i = 0; i < this.length; i++) {
        fn(this[i],i/(this.length-1),this);
      }
    }
    return this;
  }
  interpolate(...args) {
    args = Util.flatten(args);
    const argtype = Util.argtype(args);
    if (argtype === 'array') {
      return this.linear(...args);
    } else if (argtype === 'prefix') {
      const [prefix, ...vals] = args;
      if (['linear','step','squeeze'].includes(prefix)) {
        return this[prefix](...vals);
      }
    }
    return this;
  }
  stretch(...args) {
    args = Util.flatten(args);
    const argtype = Util.argtype(args);
    if (argtype === 'array') {
      return this.linear(...this.constructor.cast(args).multiply(this.length));
    } else if (argtype === 'prefix') {
      const [prefix, ...vals] = args;
      if (['linear','step','squeeze'].includes(prefix)) {
        return this[prefix](...this.constructor.cast(vals).multiply(this.length));
      }
    }
    return this;
  }
  linear(...args) {
    args = Util.flatten(args);
    if (args.length === 1) {
      if (args[0] === this.length) {
        return this;
      } else if (this.length === 1) {
        return this.step(args);
      }
    }

    let totalLen = 0;
    for (let i = 0; i < args.length; i++) {
      totalLen += args[i];
    }

    let phase = this.constructor.empty(Math.round(totalLen));
    let idx = 0;
    for (let i = 0; i < args.length; i++) {
      const p = this.constructor.range(args[i]);
      for (let j = 0; j < args[i]; j++) {
        phase[idx+j] = p[j]/(p.length-1)/args.length+(i/args.length);
      }
      idx += args[i];
    }

    // TODO: Very long arguments can break in Chrome and Safari (Sep 17, 2020)
    // return this.phase2(...phase);
    return this.phase2(phase);
  }
  step(...args) {
    args = Util.flatten(args);
    if (!args.length || args.length === 1 && args[0] === this.length) {
      return this;
    }
    const res = new this.constructor(args.reduce((a,b) => ~~a+b));
    const range = this.length/args.length;
    let idx = 0;
    for (let i = 0; i < args.length; i++) {
      for (let j = 0; j < args[i]; j++) {
        res[idx++] = this[~~(j/args[i]*range+range*i)]
      }
    }
    return res;
  }
  squeeze(...args) {
    args = this.constructor.flatten(args);
    if (args.length === 1 && args[0] === this.length) {
      return this;
    }
    let seg = Math.round(this.length/args.length);
    return this.constructor.concat(args.map((tgtLen,i) => {
      tgtLen = Math.round(tgtLen);
      let start = i*seg, stop = (i+1)*seg;
      let chunk = this.slice(start,stop);

      if (tgtLen < seg) {
        let stepSize = seg/tgtLen;
        return this.constructor.range(tgtLen).map(v => {
          let start = Math.round(v*stepSize);
          let stop = Math.round((v+1)*stepSize);
          let res = 0;
          for (let i=start; i<stop; i++) {
            if (Math.abs(chunk[i])>Math.abs(res)) res = chunk[i];
          }
          return res;
        });
      } else if (tgtLen > seg) {
        return chunk.step(tgtLen);
      } else {
        return chunk;
      }
    }));
  }
  FM(...args) {
    args = this.constructor.flatten(args);
    return this.phase2(...args.divideby(args.length).accumulate().interpolate('linear',this.length));
  }
  // skew() {}
  // endregion

  // region List Operations
  size() {
    return this.constructor.of(this.length);
  }
  unique() {
    return this.constructor.from(new Set(this));
  }
  reverse() {
    return Array.prototype.reverse.call(this.clone());
  }
  fill(...args) {
    return Array.prototype.fill.apply(this.clone(),args);
  }
  splice(...args) {
    const res = this.clone();
    Array.prototype.splice.call(res,...args);
    return res;
  }
  sort(fn) {
    if (fn) {
      return Array.prototype.sort.call(this.clone(),fn);
    } else {
      return Array.prototype.sort.call(this.clone(),(a,b)=>a-b);
    }
  }
  sortby(fn, ascending=true) {
    const iteratee = this.map((v,i) => {
      return {
        val: fn(v,i),
        idx: i
      };
    }).sort((a,b) => ascending ? a.val-b.val : b.val-a.val)
      .map(v => v.idx);

    return this.at(iteratee);
  }
  shuffle() {
    // TODO: [a,b] always results in [b,a]
    const res = this.clone();
    for (let i = this.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*i);
      const temp = res[i];
      res[i] = res[j];
      res[j] = temp;
    }
    return res;
  }
  repeat(...args) {
    args = this.constructor.flatten(args);

    if (args.every(v => Number.isInteger(v))) {
      let res = this.constructor.empty();
      let src = this.values();
      args.forEach(v => {
        for (let i = 0; i < v; i++) {
          res = res.concat(src);
        }
      });
      return res;
    } else {
      // Note: Does resampling & FM.
      // Resample the source according to the sampling theorem.
      const absMaxFreq = args.absmax();
      const len = Math.ceil(this.length*absMaxFreq);
      return this.phasestep(args.divideby(args.length).accumulate().phase(this.constructor.phasor(len)));
    }
  }
  pOLA(...args) {
    const p = this.constructor.flatten(args);
    const range = p.max()[0]-p.min()[0];
    const len = ~~(this.length*(range+1));
    const res = this.constructor.const(len,0);
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < this.length; j++) {
        const offset = ~~(p[i]*this.length);
        res[offset+j] += this[j];
      }
    }
    return res;
  }
  // pOLA(...args) {
  //   args = Util.flatten(args);
  //   const argtype = Util.argtype(args);
  //   if (argtype === 'array') {
  //     const p = this.constructor.from(args);
  //     const range = p.max()[0]-p.min()[0];
  //     const len = ~~(this.length*(range+1));
  //     const res = this.constructor.const(len,0);
  //     for (let i = 0; i < p.length; i++) {
  //       for (let j = 0; j < this.length; j++) {
  //         const offset = ~~(p[i]*this.length);
  //         res[offset+j] += this[j];
  //       }
  //     }
  //     return res;
  //   } else if (argtype === 'prefix' && Util.type(args[0])==='function') {
  //
  //   }
  // }
  pOLM(...args) {
    const p = this.constructor.flatten(args);
    const range = p.max()[0]-p.min()[0];
    const len = ~~(this.length*(range+1));
    const res = this.constructor.const(len,0);
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < this.length; j++) {
        const offset = ~~(p[i]*this.length);
        const v = res[offset+j];
        res[offset+j] = Math.abs(v) > Math.abs(this[j]) ? v : this[j];
      }
    }
    return res;
  }
  rotate(steps=0) {
    const len = this.length;
    steps = ((steps%len)+len)%len;
    const res = this.constructor.empty(len);
    for (let i = 0; i < len-steps; i++) {
      res[i] = this[steps+i];
    }
    for (let i = 0; i < steps; i++) {
      res[(len-steps)+i] = this[i];
    }
    return res;
  }
  pshift(phase) {
    return this.rotate(Math.floor(phase*(this.length)));
  }
  psync(stateObj) {
    return this.pshift(stateObj.cycle ? stateObj.cycle : 0);
  }
  chunk(size, slide, zeropad=false) {
    if (!slide) {
      slide = size;
    }

    const numChunks = Math.ceil((this.length-(size-slide))/(slide));
    const res = new this.constructor(numChunks);

    for (let i = 0; i < numChunks; i++) {
      res[i] = this.slice(i*slide,i*slide+size);
    }

    if (zeropad) {
      const lastChunkLen = res[numChunks-1].length;
      res[numChunks-1] = res[numChunks-1].concat(this.constructor.const(size-lastChunkLen,0));
    }
    return res;
  }
  flat(depth=Infinity) {
    if (Array.prototype.flat) {
      return Array.prototype.flat.call(this, depth);
    } else {
      return this.constructor.from(Util.flatten(this, depth));
    }
  }
  prepend(...args) {
    const res = new this.constructor();
    for (let i = 0; i < args.length; i++) {
      res[i] = args[i];
    }
    for (let i = 0; i < this.length; i++) {
      res[args.length+i] = this[i];
    }
    return res;
  }
  append(...args) {
    const res = new this.constructor();
    for (let i = 0; i < this.length; i++) {
      res[i] = this[i];
    }
    for (let i = 0; i < args.length; i++) {
      res[this.length+i] = args[i];
    }
    return res;
  }
  mask(...args) {
    args = Util.flatten(args);
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      let a = this[i], b = args[i%args.length];
      res[i] = Math.abs(a)>Math.abs(b) ? a : b;
    }
    return res;
  }
  zeropad(arg) {
    const type = Util.type(arg);
    if (type==='function') return this.zeropad(arg(this));

    const len = type==='number' ? arg : this.length;

    const res = this.constructor.empty(this.length+len);
    for (let i = 0; i < this.length; i++) res[i] = this[i];
    for (let i = 0; i < len; i++) res[this.length+i] = 0;
    return res;
  }
  // endregion

  // region Arithmetic
  add(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => a+b, args);
  }
  addonce(...args) {
    args = Util.flatten(args);
    let long, short;
    if (this.length > args.length) {
      long = this;
      short = args;
    } else {
      long = args;
      short = this;
    }

    const res = new this.constructor(long.length);
    let i = 0;
    while (i < short.length) {
      res[i] = short[i] + long[i];
      i++;
    }
    while (i < long.length) {
      res[i] = long[i];
      i++;
    }
    return res;
  }
  subtract(...args) {
    args = Util.flatten(args);
    return  Util.iterate(this, (a, b) => a-b, args);
  }
  subtractfrom(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => b-a, args);
  }
  multiply(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => a*b, args);
  }
  divideby(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => a/b, args);
  }
  divide(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => b/a, args);
  }
  reciprocal() {
    return Util.iterate(this, v => v===0 ? Number.NaN : 1/v);
  }
  power(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => Math.pow(a,b), args);
  }
  powerof(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => Math.pow(b,a), args);
  }
  modulo(...args) {
    args = Util.flatten(args);
    return Util.iterate(this, (a, b) => Util.modulo(a,b), args);
  }
  sum(checkNaN=false) {
    let res = 0;
    if (checkNaN) {
      for (let i = 0; i < this.length; i++) {
        res += Number.isNaN(this[i]) ? 0 : this[i];
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        res += this[i];
      }
    }
    return this.constructor.of(res);
  }
  accumulate() {
    // Note: With a preceding 0.
    const res = new this.constructor(this.length+1);
    res[0] = 0;
    for (let i = 1; i < this.length+1; i++) {
      res[i] = res[i-1]+this[i-1];
    }
    return res;
  }
  diff(deg=1) {
    const res = new this.constructor(this.length-deg);
    for (let i = 0; i < (this.length-1); i++) {
      res[i] = this[i+1]-this[i];
    }
    return res;
  }
  min(checkNaN=false) {
    let res = Number.MAX_VALUE;
    if (checkNaN) {
      for (let i = 0; i < this.length; i++) {
        if (!Number.isNaN(Number.parseFloat(this[i])) && this[i] < res) {
          res = this[i];
        }
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        if (this[i] < res) res = this[i];
      }
    }
    return this.constructor.of(res);
  }
  max(checkNaN=false) {
    let res = Number.MIN_VALUE;
    if (checkNaN) {
      for (let i = 0; i < this.length; i++) {
        if (!Number.isNaN(Number.parseFloat(this[i])) && this[i] > res) {
          res = this[i];
        }
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        if (this[i] > res) res = this[i];
      }
    }
    return this.constructor.of(res);
  }
  absmax(checkNaN=false) {
    let res = Number.MIN_VALUE;
    if (checkNaN) {
      for (let i = 0; i < this.length; i++) {
        res = !Number.isNaN(Number.parseFloat(this[i])) && Math.abs(this[i]) > Math.abs(res) ? this[i] : res;
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        res = Math.abs(this[i]) > Math.abs(res) ? this[i] : res;
      }
    }
    return this.constructor.of(res);
  }
  mean(checkNaN=false) {
    if (checkNaN) {
      return this.sum().divideby(this.filter(v => !Number.isNaN(v)).length);
    } else {
      return this.sum().divideby(this.length);
    }
  }
  variance() {
    const mean = this.mean()[0];
    const res = Util.iterate(this, v => Math.pow(mean-v,2));
    return res.sum().divideby(this.length-1);
  }
  deviation() {
    return this.variance().power(1/2);
  }
  // endregion

  // region Scaling
  rescale(...args) {
    let [min,max,dmin,dmax,checkNaN] = args.concat([0,1,this.min()[0],this.max()[0],false].slice(args.length));
    if (dmax===dmin) {
      dmax = this[0]+0.5;
      dmin = this[0]-0.5;
    }
    let res = new this.constructor(this.length);

    if (checkNaN) {
      let includesNaN = false;
      for (let i = 0; i < this.length; i++) {
        if (typeof(this[i])!=='number' || Number.isNaN(this[i])) {
          includesNaN = true;
          break;
        }
      }

      if (includesNaN) {
        for (let i = 0; i < this.length; i++) {
          const v = this[i];
          res[i] = Number.isNaN(Number.parseFloat(v)) ? v : (v-dmin)/(dmax-dmin)*(max-min)+min;
        }
      } else {
        for (let i = 0; i < this.length; i++) {
          const v = this[i];
          res[i] = (v-dmin)/(dmax-dmin)*(max-min)+min;
        }
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        const v = this[i];
        res[i] = (v-dmin)/(dmax-dmin)*(max-min)+min;
      }
    }
    return res;
  }
  fullscale(gain=1, zeromean=false) {
    const absMax = Math.abs(this.absmax());
    if (absMax < 1e-200) {
      return this.fill(0);
    } else {
      return this.multiply(gain/absMax);
    }
  }
  softmax() {
    return this.divideby(this.sum());
  }
  meannormalize() {
    const [mean,min,max] = [this.mean()[0],this.min()[0],this.max()[0]];

    // TODO: Copy state.
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = (this[i]-mean)/(max-min);
    }
    return res;
  }
  zscore() {
    const [mean,std] = [this.mean()[0],this.deviation()[0]];

    // TODO: Copy state.
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = (this[i]-mean)/std;
    }
    return res;
  }
  expscale(...args) {
    const fn = (v,i) => {
      let factor = args[i%args.length];
      if (factor <= 1) factor = 1+Number.EPSILON;
      return (Math.exp(v*Math.log(factor))-1)/(factor-1);
    };
    const [dmin,dmax] = [this.min()[0],this.max()[0]];
    const res = this.constructor.empty(this.length);

    if (dmin<0 || dmax>1) {
      const rescaled = this.rescale(0,1);
      for (let i = 0; i < rescaled.length; i++) {
        res[i] = fn(rescaled[i],i);
      }
      return res.rescale(dmin,dmax);
    } else {
      for (let i = 0; i < this.length; i++) {
        res[i] = fn(this[i],i);
      }
      return res;
    }
  }
  logscale(...args) {
    const fn = (v,i) => {
      let factor = args[i%args.length];
      if (factor <= 1) factor = 1+Number.EPSILON;
      return Math.log(v*(factor-1)+1)/Math.log(factor);
    };
    const [dmin,dmax] = [this.min()[0],this.max()[0]];

    if (dmin<0 || dmax>1) {
      return this.rescale(0,1).map(fn).rescale(dmin,dmax);
    } else {
      return this.map(fn);
    }
  }
  denormalize() {
    return this.rescale(this.min()[0]+Number.EPSILON,this.max()[0]);
  }
  // endregion

  // region Statistical
  median() {
    return this.sort().phase(0.5);
  }
  range() {
    return this.constructor.of(this.max()-this.min());
  }
  extent() {
    return this.constructor.of(this.min(),this.max());
  }
  midrange() {
    return this.constructor.concat(this.min(),this.max()).mean();
  }
  centroid(phase=true) {
    const sum = this.sum();
    let res = 0;
    for (let i = 0; i < this.length; i++) {
      res += i*this[i]/sum;
    }
    if (phase) {
      res /= this.length-1;
    }
    return this.constructor.of(res);
  }
  spread(phase=true) {
    const sum = this.sum();
    const centr = this.centroid(false);
    let res = 0;

    for (let i = 0; i < this.length; i++) {
      res += Math.pow(i-centr,2)*this[i]/sum;
    }
    if (phase) {
      res /= this.length-1;
    }
    return this.constructor.of(res);
  }
  skewness(phase=true) {
    const sum = this.sum();
    const centr = this.centroid(false);
    const std = this.spread(false).sqrt();
    let res = 0;


    return this;
  }
  kurtosis(phase=true) {
    return this;
  }
  RMS() {
    return this.power(2).mean().sqrt();
  }
  MSE(...args) {
    return this.subtract(args).power(2).mean();
  }
  // endregion

  // region Numeric
  normal(...args) {
    const [mean,variance] = args.concat([this.mean()[0],this.variance()[0]/Math.PI].slice(args.length));

    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = Math.exp(-Math.pow(this[i]-mean,2)/(2*variance))/Math.sqrt(2*Math.PI*variance);
    }
    return res;
  }
  lognormal(...args) {
    const [mean,std] = args.concat([this.mean()[0],this.deviation()[0]].slice(args.length));

    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      const v = this[i];
      res[i] = Math.exp(-Math.pow(Math.log(v)-mean,2)/2*Math.pow(std,2))/(v*std*Math.sqrt(2*Math.PI));
    }
    return res;
  }
  logistic(...args) {
    const [L,k,mid] = args.concat([1,1,0].slice(args.length));

    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = L/(1+Math.exp(-k*(this[i]-mid)));
    }
    return res;
  }
  radian() {
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = this[i]*2*Math.PI;
    }
    return res;
  }
  demodulate(...args) {
    return this.multiply(...args.denormalize().power(-1));
  }
  // endregion
}

// region JS Math methods
Object.getOwnPropertyNames(Math).forEach(name => {
  if (!Object.getOwnPropertyNames(Seq.prototype).includes(name)) {
    Seq.prototype[name] = function () {
      // return this.map(Math[name]);
      const res = new this.constructor(this.length);
      for (let i = 0; i < this.length; i++) {
        res[i] = Math[name](this[i]);
      }
      return res;
    }
  }
});

['sin','cos','tan'].forEach(fn => {
  Seq[fn] = function (...args) {
    const [len,freq,phase,shift] = Util.mapParams(args, [
      ['length',1],
      ['frequency',1],
      ['phase',0],
      ['shift',0]
    ]);
    return this.phasor(len,freq,phase-Math.abs(freq)*shift).radian()[fn]();
  };
});

['sinh','cosh','tanh','atan'].forEach(fn => {
  Seq[fn] = function (...args) {
    const [len,min,max] = Util.mapParams(args, [
      ['length',1],
      ['minimum',-Math.PI],
      ['maximum',Math.PI]
    ]);
    return this.of(min,max).linear(len)[fn]();
  };
});

['asin','acos'].forEach(fn => {
  Seq[fn] = function (...args) {
    const [len,freq,shift] = Util.mapParams(args, [
      ['length',1],
      ['frequency',1],
      ['shift',0]
    ]);
    return this.phasor(len,freq,shift).rescale(-1,1)[fn]();
  };
});
// endregion

// TODO: Remove the use of this method.
Util.unspread = (args) => {
  if (typeof(args) === 'undefined') {
    return new Seq();
  } else if (args.length===1) {
    // TODO: state can be undefined.
    if (args[0].state && (['Seq','Mono','Poly'].includes(args[0].state.type) || (['Seq','Mono','Poly'].includes(args[0].state.extends)))) {
      return args[0];
    } else if (['Array','Set'].includes(args[0].constructor.name)) {
      return Seq.clone(args[0]);
    } else {
      return Seq.of(args[0]);
    }
  } else {
    return Seq.clone(args);
  }
};

export default Seq;
export const seq = Util.createFactoryMethod(function (...args) {
  return Seq.from(Util.nestedArrayToTypedLists(args, Seq));
}, Seq);