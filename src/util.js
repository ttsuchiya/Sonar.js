function paramEntries(params) {
  const keys = new Array(params.length);
  const vals = new Array(params.length);
  for (let i = 0; i < params.length; i++) {
    keys[i] = params[i][0];
    vals[i] = params[i][1];
  }
  return [keys, vals];
}

const Util = {
  type(val) {
    if (val === undefined || val === null) return 'empty';

    const type = typeof (val);
    if (type==='number' && Number.isNaN(val)) {
      return 'NaN'
    } else if (type==='function' && val.constructor.name==='GeneratorFunction') {
      return 'generator';
    } else if (type==='object') {
      if (Array.isArray(val)) return 'array';
      else if (typeof (val[Symbol.iterator])==='function') return 'iterator';
      else return type;
    } else {
      return type;
    }
  },
  empty(val) {
    return val===null || val===undefined;
  },
  argtype(args) {
    if (this.type(args)==='empty' || !args.length) {
      return 'empty';
    } else if (args.length !== 1) {
      const [t1, t2] = [this.type(args[0]), this.type(args[1])];
      if (['string','object','function'].includes(t1) && t1!==t2) return 'prefix';
      else return 'array';
    } else {
      const type = this.type(args[0]);
      return ['string','object','function'].includes(type) ? type : 'array';
    }
  },
  flatten(list=[], depth=Infinity) {
    if (depth && this.isFlat(list)) return list;

    const res = new list.constructor(this.countNested(list, depth));
    let idx = 0;

    for (let i = 0; i < list.length; i++) {
      if (this.type(list[i]) === 'array' && depth) {
        const child = this.flatten(list[i], depth-1);
        for (let j = 0; j < child.length; j++) {
          res[idx++] = child[j];
        }
      } else {
        res[idx++] = list[i];
      }
    }
    return res;
  },
  isFlat(list) {
    for (let i = 0; i < list.length; i++) {
      if (this.type(list[i]) === 'array') return false;
    }
    return true;
  },
  nested(list) {
    for (let i = 0; i < list.length; i++) {
      if (this.type(list[i]) === 'array') return true;
    }
    return false;
  },
  countNested(list, depth=Infinity) {
    let res = 0;
    for (let i = 0; i < list.length; i++) {
      if (this.type(list[i]) === 'array' && depth) res += this.countNested(list[i], depth-1);
      else res++;
    }
    return res;
  },
  mapParams(args, params) {
    const argtype = this.argtype(args);
    const [keys, vals] = paramEntries(params);

    if (argtype === 'array') {
      for (let i = 0; i < keys.length; i++) {
        if (this.type(args[i])!=='empty') vals[i] = args[i];
      }
    } else if (argtype === 'object') {
      for (let i = 0; i < keys.length; i++) {
        const val = args[0][keys[i]];
        if (this.type(val) !== 'empty') vals[i] = val;
      }
    }
    return vals;
  },
  mapVariadicParams(args, params, orders) {
    const argtype = this.argtype(args);
    const [keys, vals] = paramEntries(params);

    if (argtype === 'array') {
      if (orders[args.length-1]) {
        for (let i = 0; i < orders[args.length-1].length; i++) {
          const key = orders[args.length-1][i];
          if (this.type(args[i])!=='empty') vals[keys.indexOf(key)] = args[i];
        }
      }
    } else if (argtype === 'object') {
      for (let i = 0; i < keys.length; i++) {
        const val = args[0][keys[i]];
        if (this.type(val) !== 'empty') vals[i] = val;
      }
    }
    return vals;
  },
  deepCopy(val) {
    const type = this.type(val);
    if (type === 'array') {
      const res = new val.constructor(val.length);
      for (let i = 0; i< val.length; i++) {
        res[i] = this.deepCopy(val[i]);
      }
      return res;
    } else if (type === 'object') {
      const res = {};
      Object.entries(val).forEach(([key,val]) => {
        if (typeof(val) === 'object' && val !== null) {
          res[key] = this.deepCopy(val);
        } else {
          res[key] = val;
        }
      });
      return res;
    } else {
      return val;
    }
  },
  // Note: This is implemented in seq.js.
  // Note 2: Probably will be redundant.
  unspread(args) {
    return args;
  },
  modulo(v,m) {
    return ((v%m)+m)%m;
  },
  nestedArrayToTypedLists(array, type) {
    const res = new type(array.length);

    for (let i = 0; i < array.length; i++) {
      if (array[i].constructor.name === 'Array') {
        res[i] = this.nestedArrayToTypedLists(array[i], type);
      } else {
        res[i] = array[i];
      }
    }
    return res;
  },
  iterate(list, fn, args) {
    const res = new list.constructor(list.length);
    if (args) {
      if (args.length < list.length) {
        for (let i = 0; i < list.length; i++) {
          res[i] = fn(list[i], args[i%args.length]);
        }
      } else {
        for (let i = 0; i < list.length; i++) {
          res[i] = fn(list[i], args[i]);
        }
      }
    } else {
      for (let i = 0; i < list.length; i++) {
        res[i] = fn(list[i]);
      }
    }
    return res;
  },

  inheritanceTree: new WeakMap(),

  extendWithSetState(src, tgt, ignore, spread=[]) {
    if (!ignore) {
      ignore = [
        'constructor','state','set','get',
        'clone','values','empty','cast','encapsulate',
        'peek','poke'
      ];
    }
    Object.getOwnPropertyNames(src.prototype).forEach(name => {
      if (!ignore.includes(name)) {
        this.wrapMethodWithSetState(src,tgt,name,spread.includes(name));
      }
    });

    if (src.name.includes('bound')) src = src().constructor;
    let node = this.inheritanceTree.get(src);
    if (node) {
      node.push(tgt);
    } else {
      this.inheritanceTree.set(src,[tgt]);
    }
  },

  wrapMethodWithSetState(src, tgt, name, spread=false) {
    if (!name.length) return;

    const util = this;
    if (spread) {
      tgt.prototype[name] = function (...args) {
        // Spreading args when calling another function or using Function.call / apply is susceptible to call stack limitation.
        const res = src.prototype[name].call(this, ...util.flatten(args));
        return res.set ? res.set(this) : res;
      }
    } else {
      tgt.prototype[name] = function (...args) {
        const res = src.prototype[name].call(this, ...args);
        return res.set ? res.set(this) : res;
      }
    }
  },
  propagateProtoWrap(type, name, spread=false) {
    if (type.name.includes('bound')) type = type().constructor;
    const node = this.inheritanceTree.get(type);
    if (node) {
      node.forEach(tgt => {
        this.wrapMethodWithSetState(type,tgt,name,spread);
      });
    }
  },

  createFactoryMethod(fn, type) {
    return Object.setPrototypeOf(fn.bind(type), Object.create(type));
  }
}

export default Util;