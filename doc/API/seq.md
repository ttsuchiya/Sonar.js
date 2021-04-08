# Seq
`Sonar.Seq` is a core module that extends the native `Array` class with various static and instance methods. 

You can instantiate a `Seq` object in the same way you would with `Array`.

```javascript
let a = new Sonar.Seq(3); // -> [undefined,undefined,undefined]
a[1] = 1; // -> [undefined,1,undefined]

Sonar.Seq.from([1,2,3]); // -> [1,2,3]
Sonar.Seq.of(1,2,3); // -> [1,2,3]
```

Rather than instantiating with `new`, this document uses the factory method `seq()` (all in lower case). (See: [Factory Method](#factory-method))

```javascript
const sonar = Sonar;

// Using the convenience factory method.
sonar.seq(1,2,3); // -> [1,2,3]
```

Even further, most of the examples below will use a shorthand alias `snr.s`, substituting the `seq()` factory method, with a library-wide configuration step. (See: [Module alias](/API/api?id=alias))

```javascript
const snr = Sonar;

snr.alias('seq', 'm');
snr.s === snr.seq; // -> true
```

---
## Factory Method
All the core modules provide a factory (instantiation) function, typically with the same module name all in lower case. They also behave as the static class name.

`seq()` behaves similarly to `Array.of` or `Sonar.Seq.of`, encapsulating the variadic arguments into a list. In this process, however, any nested native `Array` lists are converted to `Seq`, but `Sonar` list types are retained.


```javascript
snr.seq(1,2,3); // -> Seq[1,2,3]

let a = [1,2,3]; // A native Array object.
snr.seq(a); // -> Seq[ Seq[1,2,3] ]

let b = snr.mono(4,5,6);
snr.seq(b); // -> Seq[ Mono(3) ]

// You may want to manually spread 1-D arrays.
snr.seq(...a, ...b); // -> [1,2,3,4,5,6]
```

`seq` as a name also behaves like a class object `Seq`, providing its static methods.

```javascript
// Using the Array static method:
snr.seq.of(1,2,3); // -> [1,2,3]

// Similar to new Sonar.Seq(). (However, see next...)
snr.seq(); // -> []

// This one is strictly identical to new Sonar.Seq() (and faster).
snr.seq.empty(); // -> []
```

#### See also
- [Mono Factory Method](/API/mono?id=factory-method)

---
## Static Methods
Static methods are callable from the class namespace such as `Sonar.Seq`. Besides the regular `Array` class methods such as `Array.from` and `Array.isArray`, `Seq` provides various functions that can be categorized into either utilities, formatters, or sequence generators.

## Utilities (Static)
### augment
Adds a new instance method. `this` in the `function` scope references the Seq instance itself (so you should *not* use an arrow function `() => {}` here). Returning `this` facilitates method chaining.

```javascript
// Registering
snr.s.augment('square', function () {
  return this.power(2);
});

// Calling
snr.s(1,2,3).square(); // -> [1,4,9]
```

#### Arguments
1. Name (`string`)
2. Callback (`function`)

#### Note
With stateful child classes such as `Mono`, all the parent (`Seq`) methods may be pre-wrapped with a state-preservation routine. Calling `Seq.augment` will propagate to such child classes and automatically wrap the new method with a state-preservation routine.

---
### alias
Defines a new shorthand name(s) for instance methods. Similar to `augment`, stateful child classes will automatically adapt the new alias with a state-preservation routine attached.

```javascript
snr.s.alias('multiply', 'mult');
snr.s(1,2,3).mult(2); // -> [2,4,6]

snr.s.alias({
  'multiply': 'mult',
  'divideby': 'div'
});
```

#### Arguments
- With two arguments:
  1. Source (`string`): An existing instance method name.
  2. Target (`string`): A new name representing the source method.
- With an `object`: Provide key (source) and value (target) names.

---
## Formatters (Static)

### cast
Converts an `Array` or other `Sonar` class instances to a `Seq`.

```javascript
let a = snr.mono(1,2,3) // -> Mono [1,2,3]
snr.s.cast(a); // -> Seq [1,2,3]
```

#### Argument
- An array or any Sonar object.

#### Note
Typically, you may want to use the instance method `cast` instead of this static method, as part of an object method chain.

#### See also
- [cast (instance)](#cast-1)

---
### clone
Creates a new instance of the input `Seq` copying the values and properties.

```javascript
snr.s.clone(snr.s(1,2,3)); // -> Seq [1,2,3]
```

#### Argument
- A `Seq` instance.

#### Note
This method behaves similarly to `Array.from`, except it does not handle a `mapFn` (the 2nd argument) nor a `thisArg` (the 3rd argument). `Seq.from` still works, but it can be significantly slower than the super class method `Array.from` with the way browsers optimize. `Seq.clone` falls back to using a `for` loop that tends to perform as fast as `Array.from`.

---
### flatten
Recursively converts a nested array or Sonar object into a single-dimensional `Seq`. It is used primarily for handling variable arguments for `Seq`-related methods. If a single stateful Sonar object is provided as an input, `flatten` preserves its state.

```javascript
snr.s.flatten(1,2,3); // -> Seq [1,2,3]
snr.s.flatten([1,2,3]); // -> Seq [1,2,3]
snr.s.flatten([1,[2,[3]]]); // -> Seq [1,2,3]

let a = snr.s(1,[2,[3]]).set({ foo:'bar' });
snr.s.flatten(a); // -> Seq [1,2,3] State { foo:'bar' }
```

#### Arguments
- Any value or array (variadic).

---
### mask
Overlays multiple `Seq` instances preserving the values with a bigger magnitude.


---
## Generators (Static)
These static methods creates a sequence of values. Their arguments may be either a variadic length of values (e.g., `(param1, param2, etc.)` ) or an object containing parameter name - value pairs (e.g., `({ param: val })`).

#### Side Note
These generators are *not* based on ES6 `Generator`, which are typically used for creating lazy iterables. Sonar's generators create a simple list with values already being realized.

---
### empty
Creates a new `Seq` with allocated number of values. Identical to `new Sonar.Seq(len)`.

```javascript
snr.s.empty(); // -> []
snr.s.empty(3); // -> [undefined,undefined,undefined]

// Note: The following behaves differently from each other.
new Sonar.Seq(3); // -> [undefined,undefined,undefined]
new snr.s(3); // -> [3] (This actually calls the factory method with a few extra processing steps. Avoid!)
```

#### Argument
- Length (`number`)

---
### const
Generates a `Seq` with repeated values.

```javascript
snr.s.const(3); // -> [0,0,0]
snr.s.const(3,1); // -> [1,1,1]

snr.s.const({
  length: 3,
  value: 1
}); // -> [1,1,1]
```

#### Arguments
1. `length` (`number`): Default 0.
2. `value` (`any`): Optional. Default 0.

---
### range
Generates a sequence incrementing or decrementing in a uniform interval.

#### Arguments
- When the argument size is 1: 
  1. Stop (`number`): 
- When the argument size is 2: 
  1. Start (`number`)
  2. Stop (`number`)
- When the argument size is 3: 
  1. Start (`number`)
  2. Stop (`number`)
  3. Step (`number`)

---
### line

---
### phasor
Generates a `Seq` of incremental phase values with the range `[0,1-EPSILON]`.

```javascript
snr.s.phasor(5); // -> [0,0.25,0.5,0.75,1] (approx)

snr.s.phasor({
  length: 9,
  frequency: 2,
  shift: 0.25
}); // -> [0.25,0.5,0.75,1,0.25,0.5,0.75,1,0.25] (approx)
```

#### Arguments
1. `length` (`number`)
2. `frequency` (`number`): (Optional. Default: `1`)
3. `shift` (`number`): (Optional. Default: `0`)
4. `wrap` (`boolean`): (Optional. Default: `true`)

#### See also
- [phase (instance method)](#phase)

---
### pframe
Generates a 'phase frame,' an analysis time window using phase values (0-1) instead of array indices. You can use a `pframe`, along with `seq.phase`, `poly.phasestep`, etc., to retrieve a potion of seq or poly in a continuous (linearly-interpolated) manner.

```javascript
// Create a phase frame (args: length, phase, width)
let pf = snr.s.pframe(6,0.3,0.1); // -> [0.27,0.29,0.31,0.33,0.35,0.37]

// Access a potion of data with phase (linear interpolation).
snr.s(1,2,3).phase(pf); // -> [1.54,1.58,1.62,1.66,1.7,1.74]

snr.s.pframe({
  length: 3,
  phase: 0.5,
  width: 0.1
}); // -> [0.45,0.5,0.55]
```

#### Arguments
1. `length` (`number`): The number of points to sample from the source array. (Default: `2`)
2. `phase` (`number`): The central phase value (0-1) from which the frame extends. It is rescaled automatically according to the frame size so that 0 or 1 does not exceed the phase range (0-1). (Optional. Default: `0.5`)
3. `width` (`number`): The total frame width of the phase window extending to the left and right side of the center value (arg 3). (Optional. Default: `0.1`)

#### See also
- [phase](#phase)
- [pframe (instance method)](#pframe-1)
- [slide](#slide)
- [at](#at)

---
### random

---
### randint

---
### prime

---
### fibonacci

---
### hamming

---
### normal

---
### lognormal

---
### logistic

---
### JS Math Methods
- sin
- cos
- tan
- sinh
- cosh
- tanh
- atanh
- asin
- acos

---

## Instance Methods
These are callable after creating a `Seq` instance with, e.g., `snr.seq()`. Almost all methods are immutable and return the instances themselves, making the methods chainable. Also, unless there are specific arguments defined here, they may take variadic arguments of values or arrays as the input.

## Utilities (Instance)
### set
Creates or changes an arbitrarily-named parameter(s) of the `state` property.

```javascript
let a = snr.s(1,2,3).set('name','dawg'); 
a.get('name'); // -> 'dawg'

snr.s(2,3,4).set(a); // -> state { name: 'dawg' }
```

#### Arguments
- With a single value
  + An object with key-value pairs
- With two values
  1. Key (`string`)
  2. Value (`any`)
  
#### Note

#### See also
- [get](#get)
- [state](#state)
- [augment](#augment)
- [alias](#alias)
- [clone](#clone)
- [values](#values)

---
### get

```javascript
let a = snr.s(1,2,3).set({
  name: ''
})
```

#### See also
- [set](#set)
- [state](#state)

---
### clone
Creates a new `Seq` with the current values and state. Useful when having to call a mutable function (e.g., `seq.pop()`).
```javascript
let a = snr.s(1,2,3);
a.clone() !== a;
```
#### Arguments
- None

#### Returns
- A new `seq` instance.

---
### values
This method has two contrasting behaviors:
1. When called with no arguments, it returns a new `Seq` instance with only the values being copied, initializing the `state`.
2. If any values are provided as arguments, it returns a new `Seq` with the provided values and with the `state` being prµµµeserved.

```javascript
let a = snr.s(1,2,3).set({ name: 'dawg' });

a.values(); // -> [1,2,3], state { name: undefined }
a.values(2,3,4); // -> [2,3,4], state { name: 'dawg' }
```

#### See also 
- [clone](#clone)

#### Arguments
- None

#### Returns
- A new `seq` instance.

---
### cast
```javascript
snr.s.range(5) // -> [1,2,3,4,5]
  .chunk(3) // -> [[1,2,3],[4,5]] (type: Seq)
  .cast(snr.poly) // -> [[1,2,3],[4,5]] (type: Poly)
```
Argument: A class or the factory object of `Sonar` (not a string or a class instance).

---
### encap

---
## Accessors (Instance)
### at
#### See also
- [phase](#phase)

---
### put
Replace existing values with new ones at specified indices. Note that the length of new values is bounded by the length of indices, so anything that exceeds the original length will be ignored (e.g., trying to put `[1,2,3]` at indices `[0,1]`).

```javascript
let a = snr.s.const(5,0); // -> [0,0,0,0,0]

a.put(1,1); // -> [0,1,0,0,0]

// Using an array of indices.
a.put([1,2,3],1); // -> [0,1,1,1,0]
a.put([1,2,3,4],[1,-1]); // -> [0,1,-1,1,-1] (The input values are wrapped).
a.put(
  snr.s.range(3), // Indices: [0,1,2]
  snr.s.randint(3,1,3) // A 3-value random integer sequence between [1,3].
); // -> [2,2,1,0,0]
```

#### Arguments

---
### take
Grabs a section of `seq` specified by indices and modifies the individual values iteratively (as in `map`).

```javascript
snr.s(1,2,3).take(1, v => -v); // -> [1,-2,3]
snr.s(1,2,3).take([0,2], v => -v); // -> [-1,2,-3]

// The inherited method poly.take may allow the use of sonar methods on the iterated values.
snr.poly(
  snr.s(1,2,3),
  snr.s(4,5,6)
).take(1, v => v.add(1)); // -> [[1,2,3],[5,6,7]]
```

#### See also
- [put](#put)
- [do](#do)

---
### slide
#### See also
- [pframe](#pframe)

---
### peek
Takes a callback function for intercepting the current contents of the `Seq` instance. The returned values are automatically converted to a new `Seq` (or its subclasses). 

```javascript
snr.s(1,2,3).peek(v => {
  // The referenced seq v is a copy of the original seq.
  return math.add(v, v.length);
}); // -> [4,5,6]
```

`peek` can be useful for (1) referencing the instance itself (particularly its state such as `length`) in between chain methods and (2) using other library functions such as math.js (`math`) and Lodash (`_`) within chained methods, which may implicitly convert the result to the native Array type.

It will retain the original values if the callback function returns nothing. So you can do:
```javascript
snr.s(1,2,3).add(1)
  .peek(console.log) // -> [2,3,4] printed in the dev console.
  .add(1); // -> [3,4,5]
```

Or with the [asciichart](https://github.com/kroitor/asciichart) library:
```javascript
snr.s(1,2,3).peek(asciichart.plot); // Note: It only works with 1-D data.
```

#### Argument
- A callback function. The callback argument is a copy of the instance itself.

#### Returns
- A new `Seq` instance.

#### See also
- [poke](#poke)

---
### poke
Similar to `peek`, `poke` can self-reference with a callback function but in a mutable (in-place) fashion. It may be slightly faster than `peek` without the cloning processes.

```javascript
let a = snr.s(1,2,3);
a.poke(v => {
  v[0] = 0; // Mutates v (=== a).
  v.pop(); // Ditto.
  return v;
}); // -> [0,2]
console.log(a); // -> [0,2] (Mutated)
```

#### See also
- [peek](#peek)

---
### with
Temporarily changes the type (i.e., class) of self to the passed-in type, then processes it in a callback function similarly to `peek`. May be used to 'borrow' a method from another class. After the callback operation, the type of self is changed back to the original (i.e., `Seq`).

```javascript
let a = snr.s(60,64,67) // C, E, and G in MIDI note numbers.
  .with(snr.unit, u => u.notetofreq()) // -> [261.6,329.6,391.9] (in Hz)
  
a.get('type'); // -> Seq
```

#### Arguments

#### See also
- [cast](#cast)
- [peek](#peek)


---
### do
Similar to `take`, grabs a section of `seq` and modifies the values. However, instead of operating on individual values, `do` passes in the whole section as a new `seq` allowing the use of its various methods.

```javascript
snr.s(1,2,3).do(1, v => v.multiply(-1)); // -> [1,-2,3]
snr.s(1,2,3).do([0,2], v => v.multiply(-1)); // -> [-1,2,-3]

// The inherited method poly.do needs some caution in use as the list passed in is also a poly.
// E.g., The contents of m is a poly [[4,5,6]], so this will NOT reverse the seq [4,5,6]. Use poly.take instead.
snr.poly(
  snr.s(1,2,3),
  snr.s(4,5,6)
).do(1, m => m.reverse()) // -> [[1,2,3],[4,5,6]]
 .take(1, v => v.reverse()); // -> [[1,2,3],[6,5,4]]

snr.poly(
  snr.s(1,2,3),
  snr.s(4,5,6),
  snr.s(7,8,9)
).do([0,1], m => m.reverse()); // -> [[4,5,6],[1,2,3],[7,8,9]]
```

#### See also
- [take](#take)
- [peek](#peek)

---
### insert
#### See also
- [splice](#splice)

---
### remove
#### See also
- [splice](#splice)

---
### phase
Retrieves approximate values of the `seq` using linear interpolation. The location is specified with values(s) of 0-1 relative to the length of the `seq`.

```javascript
let a = snr.s(1,2,3);
a.phase(0.5); // -> [2]
a.phase(0.25,1.5); // -> [1.5,2]
a.phase([1,0.5,0]) // -> [3,2,1]
a.phase(1.5); // -> [2]
```

#### Arguments
- The phase value(s) (`number` or `list`)

#### See also
- [at](#at)
- [phasestep](#phasestep)
- [phasor (static method)](#phasor)

---
### phasestep

---
### phasemax

---
### phasemaxbp

### pframe

#### See also
- [pframe (static method)](#pframe)

---
### pframestep

---
### pslice
Similar to `Array.prototype.slice`, but uses the relative phase values instead of indices for the boundaries.

---
### pslide


---

## Interpolations (Instance)
### linear

---
### step

---
### squeeze

---
### FM

---
## List Operations (Instance)
These methods reorganize the contents of `seq`. Remember that you can also use the methods of the super class `Array`, such as `array.slice`. However, some of the `Array` methods such as `reverse` are overriden here to be all immutable.

### size
Sets the content of a `Seq` to its length.

```javascript
snr.s(1,2,3).size(); // -> [3]
```

---
### unique
Returns a list without duplicate values.

```javascript
snr.s(1,2,3,2,1); // -> [1,2,3]
```

---
### splice
Identical to `Array.prototype.splice` except that it creates copies of spliced values instead of operating in place. While the super (Array) method returns a list of deleted values, this version returns the result of splicing.

---
### reverse
Identical to `Array.prototype.reverse` except that it operates in an immutable manner returning a copy of the result rather than self-mutating original version.

---
### sort
Identical to `Array.prototype.sort` except the default sorting (without a comparator function) returns a numerically-sorted seq in ascending order instead of a literal sort.

```javascript
snr.s(10,5,1).sort(); // -> [1,5,10]
Array.of(1,5,10).sort(); // -> [1,10,5]
```

#### Argument
- CompareFunction (`function`): Optional.

---
### shuffle

---
### repeat

---
### rotate
#### See also
- [phaseshift](#phaseshift)

---
### phaseshift
#### See also
- [rotate](#rotate)

---
### chunk
Similar to `_.chunk(array,size)` of Lodash, this splits a seq into smaller blocks of seq. Unlike Lodash, however, the slide (hop) size can be independent from the block size. It may be used for the windowed analysis of an audio clip over time.

```javascript
let a = snr.s(1,2,3,4,5);
a.chunk(2); // -> [[1,2],[3,4],[5]]
a.chunk(3); // -> [[1,2,3],[4,5]]
a.chunk(3,1); // -> [[1,2,3],[2,3,4],[3,4,5]]
a.chunk(3,2); // -> [[1,2,3],[3,4,5]]
```
#### Arguments
1. Size (integer): The block size to slice the seq into.
2. Slide (integer): The step size for incremental slicing. AKA the hop size. Defaults to the block size (argument 1).
3. Pad

#### Returns
- A `Seq` instance containing child seq's. It is recommended to call `cast(snr.poly)` afterwards to handle it as a `Poly` instance.

---
### flat

---
### zeropad
Appends zeros to the seq.


---
## Arithmetic (Instance)
### add

---
### subtract

---
### subtractfrom

---
### multiply

---
### divideby

---
### divide

---
### reciprocal

---
### power

---
### powerof

---
### modulo

---
## Scaling (Instance)
### rescale

---
### softmax

---
### meannormalize
```javascript
snr.s(1,2,3).meannormalize(); // -> [-0.5,0,0.5]
```

---
### zscore
```javascript
snr.s(1,2,3).zscore(); // -> [-1,0,1]
```

---
### expscale

---
### logscale

---
### denormalize

---
## Statistical
### median
### range
### extent
### midrange
### centroid
### spread
### skewness
### kurtosis
### RMS
### MSE


## Numeric Functions (Instance)
### normal
### lognormal
### logistic
### topeaks
### radian

## Conversions (Instance)
### parseFloat
### toFloat
### isNaN
### removeNaN
### replaceNaN



### downsample
### upsample
### demodulate

---

## Properties
### state
Every `Sonar` class instance, except for `Util`, has a property called `state`. You can access the `state` via `set` and `get`. By default, all Sonar objects may have a state parameter called `type` and/or `extends`.

```javascript
let a = snr.s(1,2,3).set('name','hey');
console.log(a.get('name')); // -> 'hey'
console.log(a.state.name); // -> 'hey'

let b = snr.s.range(5).chunk(3); // -> [[0,1,2],[3,4]]
console.log(b.get('type')); // -> 'Seq'

let c = b.cast(snr.poly);
console.log(c.get('type')); // -> 'Poly'
console.log(c.get('extends')); // -> 'Mono'
```