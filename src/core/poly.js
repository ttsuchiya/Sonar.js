import Seq from './seq';
import Mono from './mono';
import Util from '../util';

class Poly extends Mono {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Poly',
      extends: 'Mono'
    });
  }
  static cast(array) {
    const res = this.empty(array.length);
    for (let i = 0; i < array.length; i++) {
      res[i] = array[i];
    }
    return res;
  }
  // TODO: Do not override the Array method.
  // Note: Without this, FFT.of(Float32Array) may not auto convert the child arrays.
  static of(...args) {
    args = args.map(v => {
      // The latter check is for typed arrays.
      if (Array.isArray(v) || v.constructor.name.endsWith('Array')) {
        // TODO: Handle non-mono or non-poly types.
        if (!v.state) {
          return Mono.clone(v);
        } else {
          return v;
        }
      } else {
        return Mono.of(v);
      }
    });
    return super.of(...args);
  }
  static flatten2(...args) {
    let res = this.empty();

    for (let i = 0; i < args.length; i++) {
      const v = args[i];

      if (Array.isArray(v)) {
        if (!v.some(Array.isArray)) {
          if (v.state && [v.state.type,v.state.extends].includes('Seq')) {
            res.push(v);
          } else {
            res.push(Seq.clone(v));
          }
        } else {
          res = this.concat(res,this.flatten2(...v));
        }
      } else {
        res.push(Seq.of(v));
      }
    }
    return res;
  }
  static clone(mat) {
    const res = this.empty(mat.length);
    for (let i = 0; i < mat.length; i++) {
      res[i] = mat[i];
    }
    if (mat.state && mat.state.type===res.state.type) {
      res.set(mat.state);
    }
    return res;
  }
  // TODO: Tends to break if args are not matrices.
  static concat(...args) {
    // args = Util.unspread(args);
    let res = this.empty();
    args.forEach(v => {
      res = res.concat(this.clone(v));
    });
    return res;
  }
  static timeslinear(...args) {
    // Note: Don't unspread -- always expect matrices as input.
    if (args.length === 1) {
      return args[0];
    }
    const maxNumVec = Seq.clone(args.map(m => m.length)).max()[0];
    const maxVecLen = Seq.clone(args.map(m => Seq.clone(m.map(v => v.length)).max()[0])).max()[0];

    const vLenFixed = args.map(m => m.map(v => v.linear(maxVecLen)));
    const vNumFixed = vLenFixed.map(m => {
      if (m.length !== maxVecLen) {
        return m.phase(Seq.phasor(maxNumVec));
      } else {
        return m;
      }
    });

    return vNumFixed.reduce((a,b) => {
      return a.map((v,i) => v.multiply(b[i]));
    });
  }
  static timesstep(...args) {
    // Note: Don't unspread -- always expect matrices as input.
    if (args.length === 1) {
      return args[0];
    }
    const maxNumVec = Seq.clone(args.map(m => m.length)).max()[0];
    const maxVecLen = Seq.clone(args.map(m => Seq.clone(m.map(v => v.length)).max()[0])).max()[0];

    const vLenFixed = args.map(m => m.map(v => v.step(maxVecLen)));
    const vNumFixed = vLenFixed.map(m => {
      if (m.length !== maxVecLen) {
        return m.phasestep(Seq.phasor(maxNumVec));
      } else {
        return m;
      }
    });

    return vNumFixed.reduce((a,b) => {
      return a.map((v,i) => v.multiply(b[i]));
    });
  }
  clone() {
    return this.slice().set(this.state); // TODO: Might break.
  }
  insert(index, val) {
    const indices = Array.isArray(index) ? Seq.clone(index) : Seq.of(index);
    const vals = this.constructor.flatten2(val);
    const indicesMap = indices.map((v,i) => [v,i]);
    const desc = indicesMap.sort((a,b) => b[0]-a[0]);
    let res = this.clone();

    for (let i = 0; i < desc.length; i++) {
      res = res.splice(desc[i][0],0,vals[desc[i][1]%vals.length]);
    }
    return res;
  }
  concat(...args) {
    args = this.constructor.from(...args);
    return super.concat.call(this,args);
  }
  flat() {
    return super.flat.call(this).cast(super.constructor);
  }
  transpose() {
    const lens = Seq.empty(this.length);
    for (let i = 0; i < this.length; i++) {
      lens[i] = this[i].length;
    }
    const maxLen = lens.max()[0];
    const res = this.constructor.empty(maxLen);
    for (let i = 0; i < maxLen; i++) {
      res[i] = new Seq();
    }
    for (let i = 0; i < this.length; i++) {
      for (let j = 0; j < this[i].length; j++) {
        res[j][i] = this[i][j];
      }
    }

    return res;
  }
  removeNaNrows() {
    return this.transpose().filter(v => v.every(x => !Number.isNaN(Number.parseFloat(x)))).transpose();
  }
  at(...args) {
    // let indices = Util.unspread(args);
    const indices = Seq.flatten(args);
    return Poly.clone(indices.modulo(this.length).map(i => this[i]));
  }
  // Note: Queries from all rows with modulo.
  column(...args) {
    const indices = Util.flatten(args);
    const res = this.constructor.empty(indices.length);

    for (let i = 0; i < indices.length; i++) {
      res[i] = Seq.empty(this.length);
      for (let j = 0; j < this.length; j++) {
        res[i][j] = this[j][indices[i]%this[j].length];
      }
    }
    return res;
  }
  phase(...args) {
    args = Util.unspread(args);

    // TODO: Experimental! Watch out for the overhead.
    for (let i = 0; i < args.length; i++) {
      if (typeof(args[i].phase)==='number' && !Number.isNaN(args[i].phase)) {
        args[i] = args[i].phase;
      }
    }

    // Note: multiply(1-EPSILON) is questionable.
    const wrappedPhase = args.multiply(1-Number.EPSILON).modulo(1);

    // Note: cons.clone somehow breaks with Poly child classes.
    const res = this.constructor.empty(wrappedPhase.length);
    for (let i = 0; i < wrappedPhase.length; i++) {
      if (this.length ===1) {
        res[i] = this[0];
      } else {
        const fracIndex = wrappedPhase[i]*(this.length-1);
        const int = Math.floor(fracIndex);
        const frac = fracIndex - int;
        const cres = this[int].constructor.empty(this[int].length);
        for (let j = 0; j < this[int].length; j++) {
          cres[j] = this[int][j]*(1-frac)+this[int+1][j%this[int+1].length]*frac;
        }
        res[i] = cres;
      }
    }
    return res;
  }
  phasemix(...args) {
    // TODO: Use Seq.flatten?
    args = Util.unspread(args);
    // Note: multiply(1-EPSILON) is questionable.
    const wrappedPhase = args.multiply(1-Number.EPSILON).modulo(1);
    return this.constructor.clone(wrappedPhase.map(v => {
      if (this.length ===1) return this[0];
      const fracIndex = v*(this.length-1);
      const int = Math.floor(fracIndex);
      const frac = fracIndex - int;
      return this[int].multiply(1-frac).mix(this[int+1].multiply(frac));
    }));
  }
  phasestep(...args) {
    // TODO: Use Seq.flatten?
    args = Util.unspread(args);

    // TODO: Experimental! Watch out for the overhead.
    for (let i = 0; i < args.length; i++) {
      if (typeof(args[i].phase)==='number' && !Number.isNaN(args[i].phase)) {
        args[i] = args[i].phase;
      }
    }

    return this.constructor.clone(args).map(v => {
      const index = Util.modulo(Math.floor(v*(1-Number.EPSILON)*this.length),this.length);
      return this[index];
    });
  }
  scan() {}
  scanstep() {}
  product() {
    const lens = this.map(v => v.length).cast(Seq);
    if (!lens.every(v => v === lens[0])) {
      throw new Error('The length of the seqs must be the same.');
    }

    const res = Seq.const(lens[0],1);
    for (let i = 0; i < this.length; i++) {
      for (let j = 0; j < lens[0]; j++) {
        res[j] *= this[i][j];
      }
    }
    return res;
  }
  prodlinear() {
    if (this.length === 1) {
      return this[0];
    }
    const maxLen = this.map(v => v.length).cast(Seq).max()[0];
    return this
      .map(v => v.cast(Seq).linear(maxLen))
      .reduce((a,b) => a.multiply(b));
  }
  prodstep() {
    if (this.length === 1) {
      return this[0];
    }
    const maxLen = this.map(v => v.length).cast(Seq).max()[0];
    return this
      .map(v => v.cast(Seq).step(maxLen))
      .reduce((a,b) => a.multiply(b));
  }
  linear(...args) {
    return this.phase(Seq.of(0,1).linear(...args));
  }
  step(...args) {
    return this.phasestep(Seq.of(0,1).linear(...args));
  }
  linearmax() {
    if (this.length === 1) {
      return this;
    }
    const maxLen = this.map(v => v.length).cast(Seq).max()[0];
    return this.map(v => v.linear(maxLen));
  }
  stepmax() {
    if (this.length === 1) {
      return this;
    }
    const maxLen = this.map(v => v.length).cast(Seq).max()[0];
    return this.map(v => v.step(maxLen));
  }
  sum() {
    if (this.length === 1) {
      return this;
    } else if (this.every(v => v.length === this[0].length)) {
      const res = this[0].constructor.empty(this[0].length);
      for (let i = 0; i < this[0].length; i++) {
        res[i] = 0;
        for (let j = 0; j < this.length; j++) {
          res[i] += this[j][i];
        }
      }
      return this.constructor.of(res);
    } else {
      const transposed = this.transpose();
      const summed = this.constructor.empty(transposed.length);
      for (let i = 0; i < transposed.length; i++) {
        summed[i] = transposed[i].sum();
      }
      return summed.transpose();
    }
  }
  mixdown() {
    const len = this.length;
    return this.sum()[0].divideby(len);
  }
  mask() {
    if (this.length === 1) {
      return this[0];
    }
    return Seq.mask(...this);
  }
  times(...args) {
    args = this.constructor.flatten2(args);
    let res = new this.constructor();

    if (this.length > args.length) {
      for (let i = 0; i < this.length; i++) {
        res.push(this[i].multiply(args[i%args.length]));
      }
    } else {
      for (let i = 0; i < args.length; i++) {
        res.push(this[i%this.length].multiply(args[i]));
      }
    }
    return res;
  }
  rescale(...args) {
    // TODO: Use Seq.flatten?
    args = Util.unspread(args);
    const [min,max,dmin,dmax] = args.concat([0,1,this.minall()[0],this.maxall()[0]].slice(args.length));
    const res = new this.constructor(this.length);
    for (let i = 0; i < this.length; i++) {
      res[i] = this[i].rescale(min,max,dmin,dmax);
    }
    return res;
  }
  minall(checkNaN=false) {
    let res = Number.MAX_VALUE;
    if (checkNaN) {
      for (let i = 0; i < this.length; i++) {
        for (let j = 0; j < this[i].length; j++) {
          if (!Number.isNaN(this[i][j]) && this[i][j] < res) res = this[i][j];
        }
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        for (let j = 0; j < this[i].length; j++) {
          if (this[i][j] < res) res = this[i][j];
        }
      }
    }
    return Seq.of(res);
  }
  maxall(checkNaN=false) {
    let res = Number.MIN_VALUE;
    if (checkNaN) {
      for (let i = 0; i < this.length; i++) {
        for (let j = 0; j < this[i].length; j++) {
          if (!Number.isNaN(this[i][j]) && this[i][j] > res) res = this[i][j];
        }
      }
    } else {
      for (let i = 0; i < this.length; i++) {
        for (let j = 0; j < this[i].length; j++) {
          if (this[i][j] > res) res = this[i][j];
        }
      }
    }
    return Seq.of(res);
  }

  // TODO: This is a weird way of setting the overlap ratio.
  OLA(overlap=2) {
    // TODO: Throw error for overlap <= 0.
    if (overlap <= 0) {
      throw new Error('Overlap ratio error.');
    }
    const block = this[0].length;
    const hop = Math.floor(block/overlap);
    const len = hop*(this.length-1)+block;
    const res = Seq.const(len, 0);

    for (let i = 0; i < this.length; i++) {
      const x = this[i];
      for (let j = 0; j < x.length; j++) {
        res[i*hop+j] += x[j];
      }
    }
    return res;
  }
  OLM(overlap=2) {
    const block = this[0].length;
    const hop = Math.floor(block/overlap);
    const len = hop*(this.length-1)+block;
    const res = Seq.const(len, 0);

    // TODO: No forEach.
    this.forEach((x,i) => {
      x.forEach((y,j) => {
        let v = res[i*hop+j];
        res[i*hop+j] = Math.abs(v)>Math.abs(y) ? v : y;
      });
    });
    return res;
  }

  pOLA(...args) {}
  pOLM(...args) {}

  copy(...args) {
    args = Seq.flatten(args);
    const res = new this.constructor();
    let index = 0;
    args.forEach(v => {
      for (let i=0; i < v*this.length; i++) {
        res.push(this[index]);
        index = (index+1) % this.length;
      }
    });
    return res;
  }
}

const chunkFn = Seq.prototype.chunk;
Seq.prototype.chunk = function (...args) {
  return chunkFn.apply(this,args).cast(Poly);
};

const polyProperties = Object.getOwnPropertyNames(Poly.prototype);

// TODO: This needs a revision.
const operableOnPoly = [
  'constructor','state','set','get',
  'clone','values','empty','cast','encapsulate',
  'peek','poke',
  'cast','encap','flatten',
  'slide','with','apply','put','take','do','insert','drop','remove','pframe','pframestep','pslide','pslidestep','chunk','size','unique','reverse','sort','sortby','shuffle','rotate','pshift',
  'slice','splice','prepend','append'
];

Object.getOwnPropertyNames(Mono.prototype).forEach(name => {
  if (name !== 'state' && !polyProperties.includes(name) && !operableOnPoly.includes(name)) {
    Poly.prototype[name] = function (...args) {
      // return this.map(v => v[name] ? v[name](...args) : v);
      const res = this.clone();
      for (let i = 0; i < res.length; i++) {
        res[i] = Util.type(res[i][name]) === 'function' ? res[i][name](...args) : res[i];
      }
      return res;
    }
  }
});

const defaultProps = Object.getOwnPropertyNames(Poly).concat(['augment','alias','empty']);

(new Set([
  ...Object.getOwnPropertyNames(Seq),
  ...Object.getOwnPropertyNames(Mono)
])).forEach(name => {
  if (!defaultProps.includes(name)) {
    Poly[name] = function (...args) {
      // TODO: Handle object literals.
      args = Poly.flatten2(args.map(v => [v]));
      const maxArgLen = args.map(v => v.length).cast(Seq).max()[0];
      const res = new this(maxArgLen);

      for (let i = 0; i < maxArgLen; i++) {
        res[i] = Mono[name](...args.column(i)[0]);
      }
      return res;
    };
  }
});

export default Poly;
export const poly = Util.createFactoryMethod(function (...args) {
  return Poly.of(...args);
}, Poly);