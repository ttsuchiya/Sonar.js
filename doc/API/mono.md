# Mono
`Mono` creates a stateful object extending `Seq` (with all the static and instance methods inherited). It is equipped with various musical-unit converters (e.g., MIDI notes to spectral bins) that are sensitive to the context (state) of the operating object.

---
## Factory Method
Creates a `Mono` instance from variable-length arguments. Unlike `Seq`, the input arguments are always flattened into a single-dimensional array.
```javascript
snr.mono(1,2,3); // -> [1,2,3]
snr.mono([1,2,3]); // -> [1,2,3]
snr.mono([1,[2,[3]]]); // -> [1,2,3]
snr.mono([1],[2],[3]); // -> [1,2,3]
```

#### See also
- [Seq Factory Method](/API/seq?id=factory-method)

---
## Static Methods
### samples
```javascript
```

### bins

### A4

### BPM

### comb

### harmonics


---
## Instance Methods
### unit
Sets the current base unit for conversion.
```javascript
let a = snr.mono(440);
a.get('unit'); // -> null
a.unit('freq').get('unit'); // -> 'frequency'
```

#### See also
- [from](#from)
- [to](#to)
- [units](#units)

### from
Identical to `unit`.

### to
```javascript
snr.mono(440).from('freq').to('note'); // -> [69]
snr.mono(60,65).from('note').to('mel'); // -> [357.871,456.128]
```

### convert


### BPM

### note

### bin

### mel



---
## Properties
### state
```javascript
const defaultState = {
  samples: 44100,
  bins: 128, // aka grids
  A4: 440,
  BPM: 60
};
```

### units
The instance methods `unit` (`from`) and `to` accept a string value that corresponds to a convertible base unit. For example, you can use 'freq', 'Hz', etc. to set the current / target unit to 'frequency'. You can mix upper / lower cases.

```javascript
const units = {
  samples: ['samples','samplerate','samps','fs','sr'],
  frequency: ['frequency','frequencies','freq','freqs','hz'],
  note: ['note','notes','midi','pitch'],
  bin: ['bin','bins','block','blocksize'],
  mel: ['mel'],
  beat: ['beat','beats'],
  interval: ['interval','intervals','int','itv'],
  offset: ['offset','offsets'],
  grid: ['grid','grids']
};
```

#### See also
- [unit](#unit)
- [from](#from)
- [to](#to)
