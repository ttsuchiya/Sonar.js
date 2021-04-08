import test from 'ava';
import Seq from '../src/core/seq';
import Unit from '../src/core/unit';

// region Static
test('augment', t => {
  Seq.augment('square', function () {
    return this.map(v => v*v);
  });

  t.deepEqual(
    Seq.of(1,2,3).square(),
    Seq.of(1,4,9)
  );
});

test('alias', t => {
  Seq.alias('multiply', 'mult');
  t.deepEqual(
    Seq.of(1,2,3).mult(3),
    Seq.of(3,6,9)
  );
});

test('cast', t => {
  t.deepEqual(
    Seq.cast(Unit.of(1,2,3)),
    Seq.of(1,2,3)
  );
});

test('clone (static)', t => {
  let a = Seq.of(1,2,3);
  t.deepEqual(Seq.clone(a),a);
  t.not(Seq.clone(a),a);
});

test('flatten', t => {
  t.deepEqual(
    Seq.flatten(1,2,3),
    Seq.of(1,2,3)
  );
  t.deepEqual(
    Seq.flatten(1,[2,[3]]),
    Seq.of(1,2,3)
  );
  t.deepEqual(
    Seq.flatten([1,2,3]),
    Seq.of(1,2,3)
  );
  t.deepEqual(
    Seq.flatten([1,[2,[3]]]),
    Seq.of(1,2,3)
  );
});

test('concat', t => {
  t.deepEqual(
    Seq.concat([1,2],[3,4]),
    Seq.of(1,2,3,4)
  );
});

test('range', t => {
  t.deepEqual(
    Seq.range(3),
    Seq.of(0,1,2)
  );
  t.deepEqual(
    Seq.range(3,6),
    Seq.of(3,4,5)
  );
  t.deepEqual(
    Seq.range(6,3),
    Seq.of(6,5,4)
  );
  t.deepEqual(
    Seq.range(0,3,1),
    Seq.of(0,1,2)
  );
  t.deepEqual(
    Seq.range(0,5,2),
    Seq.of(0,2,4)
  );
  t.deepEqual(
    Seq.range(0,6,2),
    Seq.of(0,2,4)
  );
});

test('empty', t => {
  t.deepEqual(Seq.empty(), Seq.from([]));
  t.deepEqual(Seq.empty(0), Seq.from([]));
  t.deepEqual(Seq.empty(1), Seq.from([undefined]));
});

test('const', t => {
  t.deepEqual(Seq.const(), Seq.from([]));
  t.deepEqual(Seq.const(1), Seq.from([0]));
  t.deepEqual(Seq.const(2), Seq.from([0,0]));
  t.deepEqual(Seq.const(1,1), Seq.from([1]));
  t.deepEqual(Seq.const(2,null), Seq.from([0,0]));
  t.deepEqual(Seq.const({
    length: 2,
    value: 1
  }), Seq.from([1,1]));
});
// endregion

// region Utilities
test('clone', t => {
  let a = Seq.of(1,2,3);
  let b = a.clone();
  t.deepEqual(a,b);
  t.assert(a.state !== b.state);
});
// endregion

// region Accessors
test('at', t => {
  t.deepEqual(
    Seq.of(1,2,3).at(1,2),
    Seq.of(2,3)
  );

  t.deepEqual(
    Seq.of(1,2,3).at([1,2]),
    Seq.of(2,3)
  );
});

test('slide', t => {
  t.deepEqual(
    Seq.of(1,2,3,4,5).slide(1,3),
    Seq.of(2,3,4)
  );
});

test('put', t => {
  t.deepEqual(
    Seq.of(1,2,3).put(1,0),
    Seq.of(1,0,3)
  );

  t.deepEqual(
    Seq.of(1,2,3).put([0,2],0),
    Seq.of(0,2,0)
  );

  t.deepEqual(
    Seq.of(1,2,3).put([0,-1],[0,1]),
    Seq.of(0,2,1)
  );
});

test('drop', t => {
  t.deepEqual(
    Seq.of(1,2,3).drop(0),
    Seq.of(2,3)
  );
  t.deepEqual(
    Seq.of(1,2,3).drop(1),
    Seq.of(1,3)
  );
  t.deepEqual(
    Seq.of(1,2,3).drop(1,1),
    Seq.of(1,3)
  );
});

test('remove', t => {
  t.deepEqual(
    Seq.of(1,2,3).remove(1),
    Seq.of(2,3)
  );
  t.deepEqual(
    Seq.of(1,2,3).remove(v => v>1),
    Seq.of(1)
  );
  t.deepEqual(
    Seq.of(1,2,3).remove(1,3),
    Seq.of(2)
  );
});

// test('replace', t => {
//   t.deepEqual(
//     Seq.of(1,2,3).replace(1,0),
//     Seq.of(0,2,3)
//   );
// });
// endregion

test('zeropad', t => {
  t.deepEqual(
    Seq.of(1,2,3).zeropad(),
    Seq.of(1,2,3,0,0,0)
  );

  t.deepEqual(
    Seq.of(1,2,3).zeropad(2),
    Seq.of(1,2,3,0,0)
  );

  t.deepEqual(
    Seq.of(1,2,3).zeropad(v => 4-v.length),
    Seq.of(1,2,3,0)
  )
});

// test('isNaN', t => {
//   t.deepEqual(
//     Seq.of(1,'2',NaN,'foo').isNaN(),
//     Seq.of(false,false,true,false)
//   );
// });

test('reverse', t => {
  let a = Seq.of(1,2,3);
  let b = a.reverse();
  t.is(b.constructor.name,'Seq');
  t.deepEqual(b,Seq.of(3,2,1));
  t.not(a,b);
});

test('sort', t => {
  t.deepEqual(
    Seq.of(5,10,1).sort(),
    Seq.of(1,5,10)
  );
});

test('accumulate', t => {
  t.deepEqual(
    Seq.of(1,2,3).accumulate(),
    Seq.of(0,1,3,6)
  );
});

test('repeat', t => {
  t.deepEqual(
    Seq.of(1,2,3).repeat(2),
    Seq.of(1,2,3,1,2,3)
  );
});

// region Interpolation
test('phase', t => {
  t.deepEqual(Seq.of(1).phase(0), Seq.of(1));
});

test('phasestep', t => {
  t.deepEqual(
    Seq.of(1,2,3).phasestep(0.2,0.6),
    Seq.of(1,2)
  );
  t.deepEqual(
    Seq.of(1,2,3).phasestep(-0.2,-0.6),
    Seq.of(3,2)
  );
});

test('interpolate', t => {
  const input = Seq.of(0,1);
  t.deepEqual(
    input.interpolate(3),
    Seq.of(0,0.5,1)
  );

  t.deepEqual(
    input.interpolate('linear',3),
    Seq.of(0,0.5,1)
  );
});

test('stretch', t => {
  const input = Seq.of(0,1);
  t.deepEqual(
    input.stretch(1.5),
    Seq.of(0,0.5,1)
  );

  t.deepEqual(
    input.stretch('linear',1.5),
    Seq.of(0,0.5,1)
  );
})

test('linear', t => {
  t.deepEqual(
    Seq.of(1,2,3).linear(5),
    Seq.of(1,1.5,2,2.5,3)
  );
});

test('step', t => {
  t.deepEqual(
    Seq.of(1,2,3).step(7),
    Seq.of(1,1,1,2,2,3,3)
  );

  t.deepEqual(
    Seq.of(1,2,3).step(3,5),
    Seq.of(1,1,2,2,2,3,3,3)
  );
});
// endregion


test('meannormalize', t => {
  t.deepEqual(
    Seq.of(1,2,3).meannormalize(),
    Seq.of(-0.5,0,0.5)
  );
});

test('zscore', t => {
  t.deepEqual(
    Seq.of(1,2,3).zscore(),
    Seq.of(-1,0,1)
  );
});