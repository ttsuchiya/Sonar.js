# Sonar.js
Sonar (sonic array) is a data sonification[<sup>1</sup>](#footnote1) library for the web environment. It extends the native JavaScript `Array` with various data-handling functions and connects to a real-time audio stream powered by the Web Audio API.

## Setting up
### The old `<script>` way
In `index.html`:
```html
<script src="./lib/sonar.umd.js"></script>
<script>
  // Sonar is available as a global variable.
  const notes = Sonar.Mono.from([0,2,4,5,7]).add(60);
</script>
```

### ES6 module importing (without packaging)
In `index.html`:

```html

<script src="src/index.js" type="module"></script>
```

In `index.js`:
```js
import Sonar from "./lib/sonar.esm";
```

#### NodeJS
Currently, Sonar only fully works in web browsers. Packages for Node.js and Node-for-Max are in the works.

Start or run a Node process with the following flag.
```shell
node -r esm
```

## Background
This library was developed as part of the author's PhD thesis at Georgia Tech. It implements a design framework for creating perceptually measurable but also musically rich timbral sonifications.

## Target Users / Use Cases
This library might require intermediate knowledge in ES6+ JavaScript.

### Sonar might be useful for ...
- Sonification researchers or beginners: Experiment with data mapping, transformation, and various types of audio synthesis.
- Auditory interface designers: Add a light-weight real-time audio to your website.
- Electroacoustic composers: Handcraft time-evolving sounds with the A/S and granular-synthesis paradigms.
- Live coding performance: Use with REPL (i.e., eval() or dev tools) with flexible state management and time synchronization.
- Basic DSP experiments: Use FFT and RingBuffer modules for implementing custom audio DSP.

### It is not intended for ...
- Acoustic research: Unfortunately, it does not handle the spatial aspects of sound very well. (You could make a custom module with WASM).
- Symbolic-only music: You can try creating melodies and [Earcons](https://en.wikipedia.org/wiki/Earcon), but [Tone.js](https://tonejs.github.io/) is probably more suited for such goals.
- Serious statistics, linear algebra, or ML: Please instead use or combine with external libraries such as [Math.js](https://mathjs.org/).

### It might be similar to ...
- List-operation libraries such as [Lodash](https://lodash.com/) and [D3 list modules](https://d3js.org/), though they are more comprehensive and versatile. Sonar can be used side-by-side with these libraries.

## Development
### Building
1. Globally install the package manager (Rollup): `npm install --global rollup` or `yarn global add rollup`
2. Install local dependencies: `npm install` or `yarn install`
3. Configure `rollup.config.js` and `index.js`.
4. Build: `npm run build`

### Third-Party Libraries
- Packaging: [Rollup](https://rollupjs.org)
- Unit testing: [AVA](https://github.com/avajs/ava)
- Documentation: [Docsify](https://docsify.js.org/)
- FFT routine: [Kiss FFT](https://sourceforge.net/projects/kissfft/)

---

1: [Sonification](https://en.wikipedia.org/wiki/Sonification) uses sound to represent data. It is an audio version of data visualization. <a id="footnote1"></a>

---

(C) Takahiko Tsuchiya, Georgia Institute of Technology. 2021.
