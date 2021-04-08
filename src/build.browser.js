// Core modules
import Util from './util';
import Seq, { seq } from './core/seq';
import Mono, { mono } from './core/mono';
import Poly, { poly } from './core/poly';
import Tempo, { tempo } from './core/tempo';
import Table, { table } from './core/table';
import RingBuffer, { ringbuf } from './core/ringbuffer';
import Unit, { unit } from './core/unit';

// Browser modules
import Fetch, { fetch } from './browser/fetch';
import Mouse, { mouse } from './browser/mouse';

// Web Audio modules
import WebAudio from './webaudio/webaudio';
import Clock, { clock } from './webaudio/clock';
import Waveform, { waveform } from './webaudio/waveform';
import WaveTable, { wavetable } from './webaudio/wavetable';
import Clip, { clip } from './webaudio/clip';
import Stream, { stream } from './webaudio/stream';

// Experimental
import AudioEvent from './experimental/event';
import Transport, { transport } from './experimental/transport';
import Node, { node } from './experimental/node';

const Sonar = {
  Util,
  Seq, seq,
  Mono, mono,
  Poly, poly,
  Tempo, tempo,
  Table, table,
  RingBuffer, ringbuf,
  Unit, unit,

  Fetch, fetch,
  Mouse, mouse,

  WebAudio,
  Clock, clock,
  Waveform, waveform,
  WaveTable, wavetable,
  Clip, clip,
  Stream, stream,

  Transport, transport,
  Node, node,
  Event: AudioEvent,

  alias: function (...args) {
    if (args.length === 1 && Util.type(args[0]) === 'object') {
      Object.entries(args[0]).forEach(([src,tgt]) => {
        if (this.hasOwnProperty(tgt)) {
          console.warn(`Overriding the existing alias: Sonar.${tgt}.`);
        }
        this[tgt] = this[src];
      });
    } else if (args.length === 2) {
      // TODO: Do not allow overriding, see seq.js.
      const [src, tgt] = args;
      if (this.hasOwnProperty(tgt)) {
        console.warn(`Overriding the existing alias: Sonar.${tgt}.`);
      }
      this[tgt] = this[src];
    }
    return this;
  },
  import: function (path, name, defaultFn) {
    // TODO: Only for browsers.
    if (!window) return;

    const url = new URL(path, window.location.href);
    return import(url.pathname).then(module => {
      // return import(path).then(module => {
      const props = Object.getOwnPropertyNames(module);
      if (name && props.length === 1) {
        this[name] = module[props[0]];
        // TODO: Print with the variable name?
        console.log(`Importing ${props[0]} as Sonar.${name}.`);
      } else {
        props.forEach(v => this[v] = module[v]);
        if (props.length === 1) {
          name = props[0];
          console.log(`Importing ${props[0]} as Sonar.${name}.`);
        } else {
          console.log(`Importing ${props.join(', ')} to Sonar.`);
        }
      }
      if (defaultFn) {
        Object.entries(defaultFn).forEach(([key,fn]) => {
          this[key] = fn.bind(this[name]);
          this[key].__proto__ = Object.create(this[name]);
        });
      }
    });
  },
  load: function (module, name, defaultFn) {
    const props = Object.getOwnPropertyNames(module);
    if (name && props.length === 1) {
      this[name] = module[props[0]];
      // TODO: Print with the variable name?
      console.log(`Importing ${props[0]} as Sonar.${name}.`);
    } else {
      props.forEach(v => this[v] = module[v]);
      if (props.length === 1) {
        name = props[0];
        console.log(`Importing ${props[0]} as Sonar.${props[0]}.`);
      } else {
        console.log(`Importing ${props.join(',')} to Sonar.`);
      }
    }
    if (defaultFn) {
      Object.entries(defaultFn).forEach(([key,fn]) => {
        this[key] = fn.bind(this[name]);
        this[key].__proto__ = Object.create(this[name]);
      });
    }
  },
  configure: function (path) {
    if (!window) return;

    // TODO: Only for browsers.
    const url = new URL(path, window.location.href);
  }
};

export default Sonar;