import test from 'ava';
import Poly from '../src/core/poly';
import Seq from "../src/core/seq";

// region static
test('of', t => {
  const a = Poly.of([1,2,3],[4,5,6]);
  const b = Poly.of(Seq.of(1,2,3),Seq.of(4,5,6));
  t.deepEqual(a,b);
});

test('flatten', t => {
  t.deepEqual(
    Poly.flatten(1,2,3),
    Poly.of([1],[2],[3])
  );
  t.deepEqual(
    Poly.flatten(1,[2,3]),
    Poly.of([1],[2,3])
  );
  t.deepEqual(
    Poly.flatten(1,[2,[3]]),
    Poly.of([1],[2],[3])
  );

  // TODO: These are failing!
  // t.deepEqual(
  //   Poly.flatten([1,2,3]),
  //   Poly.of([1,2,3])
  // );
  // t.deepEqual(
  //   Poly.flatten([1],[2],[3]),
  //   Poly.of([1],[2],[3])
  // );
  // t.deepEqual(
  //   Poly.flatten([[1,2,3]]),
  //   Poly.of([1,2,3])
  // );
  // t.deepEqual(
  //   Poly.flatten([1,[[2],[[3]]]]),
  //   Poly.of([1],[2],[3])
  // );
});
// endregion

// test('concat', t => {
//   t.deepEqual(
//     (new Poly()).concat([1,2,3]),
//     Poly.of([1,2,3])
//   );
// });

test('transpose', t => {
  const a = Poly.of([1,2,3],[4,5,6]).transpose();
  const b = Poly.of(Seq.of(1,4),Seq.of(2,5),Seq.of(3,6));
  t.deepEqual(a,b);
});

test('removeNaNrows', t => {
  const a = Poly.of([1,2,NaN,4],[5,NaN,NaN,8]).removeNaNrows();
  const b = Poly.of(Seq.of(1,4),Seq.of(5,8));
  t.deepEqual(a,b);
});

test('prodstep', t => {
  const a = Poly.of(Seq.of(1,2,3),Seq.of(2,2,2)).prodstep();
  const b = Seq.of(2,4,6);
  t.deepEqual(a,b);
});

test('repeat', t => {
  const a = Poly.of([0],[1]).repeat(2);
  const b = Poly.of([0],[1],[0],[1]);
  t.deepEqual(a,b);

  const c = Poly.of([0],[1]).repeat(2.5);
  const d = Poly.of([0],[1],[0],[1],[0]);
  t.deepEqual(c,d);
});