# Sonar (Sonic Array) JS
`sonar.js` is a data-sonification library for the web environment. It extends the native JavaScript Array and connects to a real-time audio stream using the Web Audio API.

## Usage

```html
<script src="sonar.js"></script>
```

ES6 module importing:
```js
import { Sonar } from "./sonar"
```

NodeJS:
```shell
node -r esm
```

## Building
1. Install Rollup: `npm install --global rollup`


## Credits
### Third-Party Libraries
- Packaging: [Rollup](https://rollupjs.org)
- Unit testing: [AVA](https://github.com/avajs/ava)
- Documentation: [Docsify](https://docsify.js.org/)
- FFT routine: [Kiss FFT](https://sourceforge.net/projects/kissfft/)