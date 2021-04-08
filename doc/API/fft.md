# FFT
An extra module that provides 1-D Fast Fourier Transform. It uses the [Kiss FFT](https://sourceforge.net/projects/kissfft/) C library compiled to an WebAssembly (WASM) module.

## Loading
Currently, the WASM module (`wasm_fft.js` + `wasm_fft.wasm`) can only be loaded as a global variable in HTML (i.e., There is no capability to `require` or `import`). First, place `wasm_fft.js` and `wasm_fft.wasm` files in the same directory (e.g., `lib` folder). Then add a `<script>` tag in HTML. 

```html
<!doctype html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <title>Loading Sonar.FFT module</title>
  <script src="./lib/wasm_fft.js"></script>
</head>
<body>
  
</body>
</html>
```

```javascript
snr.import('./lib/fft.esm.js', 'FFT', {
  // The default factory method.
  fft: function (...args) { return snr.FFT.of(...args); }
});

snr.fft([0,1,0,0]).synthesize(); // -> [1,0,-1,0]
```

## Static Methods

## Instance Methods
### transform

### synthesize
Transforms the internal poly of `[magnitude, phase]`to a time-domain waveform.

```javascript
const len = 4096;
snr.fft(
  snr.m.const(len,0).put([1,3,5],1),
  snr.m.random(len)
).synthesize(); // -> Some fancy time-domain signal ([mag, phase])
```
#### Arguments
1. DC (`boolean`): (Optional. Default `false`)
2. Mirror

### analyze
#### Arguments
1. Normalize
2. Fold
3. Radian

### centroid
### spread


## cepstrum


## lifter
Extracts the spectral envelope of a time-domain signal with cepstral windowing.

## Properties