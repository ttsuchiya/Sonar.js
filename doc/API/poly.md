# Poly
A nested `Mono` format with specialized aggregate functions. It is intended to be mostly in two-dimensional array structure, as in a polyphonic audio stream. It extends the `Mono` class, inheriting its properties and methods while overriding some of the methods (e.g., `phase`) with more suitable behaviors for nested arrays.

```javascript
let a = new Sonar.Poly(3); // -> [undefined,undefined,undefined]
a[1] = Sonar.Mono.of(1,2,3); // -> [undefined,[1,2,3],undefined]

Sonar.Poly.from([[1,2,3],[4,5,6]]); // -> [[1,2,3],[4,5,6]]
Sonar.Poly.of([1,2,3],[4,5,6]); // -> [[1,2,3],[4,5,6]]
```

`Poly` has a convenience factory method `poly` as a namespace / for instantiation. The following examples will use `p` as its shorthand.

```javascript
const snr = Sonar;

snr.poly(1,2,3); // -> [[1],[2],[3]]
snr.alias('poly', 'p');

snr.p([1,2,3],[4,5,6]); // -> [[1,2,3],[4,5,6]]
```

---

## Static Methods
### List parameter notation
```javascript
snr.p.const(3,[1,2,3]); // -> [[1,1,1],[2,2,2],[3,3,3]]
snr.p.line(3,0,[1,2]); // -> [[0,0.5,1],[0,1,2]]
```

### cast
```javascript
snr.p.cast(snr.m(1,2,3)); // -> Poly [1,2,3]
```

### of
### flatten
### clone
### concat
### timeslinear
### timesstep

---

## Instance Methods
### insert
### concat
### flat
### transpose
### removeNaNrows
### at
### column
### phase
### phasemix
### phasestep
### product
### prodlinear
### linear
### step
### linearmax
### stepmax
### sum
### mixdown
### mask
### times
### rescale
### minall
### maxall
### OLA
### OLM
### repeat