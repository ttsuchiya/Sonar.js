import test from 'ava';
import snr from '../dist/sonar.esm';

test('seq factory', t => {
  t.deepEqual(
    snr.seq(1,2,3),
    snr.Seq.from([1,2,3])
  );

  t.deepEqual(
    snr.seq([1,2,3]),
    snr.Seq.of(snr.Seq.from([1,2,3]))
  );

  t.deepEqual(
    snr.seq([1,2,3],[4,5,6]),
    snr.Seq.from([
      snr.Seq.from([1,2,3]),
      snr.Seq.from([4,5,6])
    ])
  );
});

test('mono factory', t => {
  t.deepEqual(
    snr.mono(1,2,3),
    snr.Mono.from([1,2,3])
  );

  t.deepEqual(
    snr.mono([1,2,3]),
    snr.Mono.from([1,2,3])
  );

  t.deepEqual(
    snr.mono([1],[2],[3]),
    snr.Mono.from([1,2,3])
  );

  t.deepEqual(
    snr.mono([[1,2,3]]),
    snr.Mono.from([1,2,3])
  );

  t.deepEqual(
    snr.mono([1,[2,[3]]]),
    snr.Mono.from([1,2,3])
  );
});

test('poly factory', t => {
  t.deepEqual(
    snr.poly(1,2,3),
    snr.Poly.from([
      snr.Mono.from([1,2,3])
    ])
  );
});