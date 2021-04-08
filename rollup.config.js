import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
// import { babel } from '@rollup/plugin-babel';
// import resolve from '@rollup/plugin-node-resolve';

export default [{
  input: 'src/build.browser.js',
  output: {
    file: 'dist/sonar.esm.js',
    format: 'esm'
  },
  plugins: [
    // resolve(),
    // babel({ presets: ['@babel/plugin-env'] }),
    copy({
      targets: [{
        src: 'src/webaudio/lib/clock-processor.js',
        dest: 'dist',
        rename: 'awlt_clock.js'
      }, {
        src: 'src/webaudio/lib/stream-processor.js',
        dest: 'dist',
        rename: 'awlt_stream.js'
      }, {
        src: 'src/modules/FFT/fft.js',
        dest: 'dist',
        rename: 'fft.esm.js'
      }, {
        src: 'src/modules/FFT/build/fft.wasm.js',
        dest: 'dist'
      }, {
        src: 'src/modules/exporter.js',
        dest: 'dist',
        rename: 'exporter.esm.js'
      }]
    })
  ]
}, {
  input: 'src/build.browser.js',
  output: {
    file: 'dist/sonar.esm.min.js',
    format: 'esm'
  },
  plugins: [
    terser()
  ]
}, {
  input: 'src/build.browser.js',
  output: {
    file: 'dist/sonar.umd.js',
    name: 'Sonar',
    format: 'umd'
  }
}, {
  input: 'src/build.browser.js',
  output: {
    file: 'dist/sonar.umd.min.js',
    name: 'Sonar',
    format: 'umd'
  },
  plugins: [
    terser()
  ]
}, {
  input: 'src/build.node.js',
  output: {
    file: 'dist/sonar.node.js',
    name: 'Sonar',
    format: 'umd'
  }
}, {
  input: 'src/build.node.js',
  output: {
    file: 'dist/sonar.node.min.js',
    name: 'Sonar',
    format: 'umd'
  },
  plugins: [
    terser()
  ]
}];