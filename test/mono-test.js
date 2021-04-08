import test from 'ava';
import Scale from '../src/scale';

test('initialize', t => {
  t.is(
    Scale.initialize('frequency',440).get('unit'),
    'frequency'
  );
});

test('frequency', t => {
  t.is(
    Scale.initialize('note',69).frequency().get('unit'),
    'frequency'
  );
  t.deepEqual(
    Scale.initialize('note',69).frequency(),
    Scale.initialize('frequency',440)
  );
  t.deepEqual(
    Scale.initialize('note',69,81).frequency(),
    Scale.initialize('frequency',440,880)
  );
  t.deepEqual(
    Scale.initialize('bin',0).frequency(),
    Scale.initialize('frequency',0)
  );
  t.deepEqual(
    Scale.initialize('bin',3).frequency({
      bins: 2048, samps: 44100
    }),
    Scale.initialize('frequency',3*44100/2048)
  );
});

test('note', t => {
  t.deepEqual(
    Scale.initialize('frequency',440).note(),
    Scale.initialize('note',69),
  );
  t.deepEqual(
    Scale.initialize('bin',82).note({
      bins: 8192
    }),
    Scale.initialize('note',69),
  );
});