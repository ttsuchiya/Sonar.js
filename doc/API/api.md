# API {docsify-ignore-all}
`Sonar` is an object loaded with several core modules (classes). If you like to manually instantiate objects from classes, you would refer to the class names like the following:

```javascript
import Sonar from './sonar.esm';

new Sonar.Seq(); // -> []
Sonar.Seq.range(3); // -> [0,1,2]
```

---
## Factory Methods
If, instead, you prefer using a terser syntax (for quick prototyping, livecoding, etc.), you can utilize aliases and factory methods that are typically all in lower case. 

```javascript
import snr from './sonar.esm'; // Name the default import.

snr.mono(1,2,3); // -> [1,2,3]
snr.mono.range(3); // -> [0,1,2] (Calling static methods)
```

---
## Chained Method Calls
Like jQuery and D3, almost all the instance methods in Sonar are chainable, transforming the object itself in sequence.

```javascript
snr.seq(1,2,3)
  .interpolate(5) // -> [1,1.5,2,2.5,3]
  .reciprocal() // -> [1,0.666,0.5,0.4,0.333]
  .map(v => v>0.5 ? 1 : 0); // -> [1,1,0,0,0]
```

---
## Immutability
Chain transformations create a copy of the original, so you can reference before and after changes by breaking the chain.
```javascript
let a = snr.seq(1,2,3).add(1); // -> [2,3,4]
let b = a.repeat(2).sort(); // -> [2,2,3,3,4,4]
console.log(a); // -> [2,3,4]
```

---
## Object State
While `Seq` supports object 'state' configurations with `set` and `get`, it is generally treated as stateless, forgetting it after transformations. However, some derived classes such as `Mono` are designed to be more stateful and will retain the configurations after any transformations.

```javascript
let a = snr.seq(0).set({ foo: 'bar' });
a.add(1).get('foo'); // -> undefined

let b = snr.mono(0).set({ baz: 'qux' });
b.add(1).get('baz'); // -> 'qux'
```

#### See also


---
## Library Configuration
### alias
Both the class names (e.g., `Seq`) and factory methods (e.g., `seq`) can have arbitrary shortcut names.

```javascript
import snr from './sonar.esm';

snr.alias('mono','m'); // Create a module alias.
snr.m(1,2,3); // -> [1,2,3]
snr.m.prime(4); // -> [2,3,5,7]

snr.alias({
  'poly': 'p',
  'clock': 'c'
});
```
#### Arguments
- With two arguments
  1. Source name (`string`)
  2. Target name (`string`)
- With a single argument
  + An `object` with key (source) and value (target: `string`) pairs.


#### Note
This documentation will generally use `snr` as the alias for the module collection `Sonar`, `s` for `seq`, `m` for `mono`, and so on. See each module API page for more details on their factory method.

#### See also
- [Seq alias (instance method)](/API/seq?id=alias)

---
### import
```javascript
const url = './modules/complex.js';

snr.import(url, 'Complex', {
  complex: function (...args) {
    return this.from(snr.mono.flatten(args));
  }
});
```

#### Arguments
1. File path (`string`)
2. Class name (`string`; optional)
3. Factory method (`object`; optional)

#### Returns
- A `Promise` object with the imported module as the resolved value.