import test from 'ava';
import Util from '../src/util';
import Seq from "../src/core/seq";
import Poly from '../src/core/poly';


test('chunk', t => {
  t.deepEqual(
    Seq.of(1,2,3,4,5).chunk(3,1),
    Poly.of([1,2,3],[2,3,4],[3,4,5])
  );

  t.deepEqual(
    Seq.of(1,2,3,4,5).chunk(3,2),
    Poly.of([1,2,3],[3,4,5])
  );

  t.deepEqual(
    Seq.of(1,2,3,4,5).chunk(2),
    Poly.of([1,2],[3,4],[5])
  );
});

test('unspread', t => {
  t.deepEqual(Util.unspread([1]), Seq.of(1));
  t.deepEqual(Util.unspread([1,2,3]), Seq.of(1,2,3));
  t.deepEqual(Util.unspread([[1,2,3]]), Seq.of(1,2,3));
});
// test('convert to mono', t => {});
