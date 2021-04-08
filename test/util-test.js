import test from 'ava';
import Util from '../src/util';
import Seq from '../src/core/seq';

test('type', t => {
  t.is(Util.type(undefined),'empty');
  t.is(Util.type(null),'empty');
  t.is(Util.type(1),'number');
  t.is(Util.type('1'),'string');
  t.is(Util.type(NaN),'NaN');
  t.is(Util.type([1]),'array');
  t.is(Util.type([]),'array');
  t.is(Util.type(()=>{}),'function');
  t.is(Util.type({}),'object');
});

test('argtype', t => {
  t.is(Util.argtype(undefined),'empty');
  t.is(Util.argtype([]),'empty');
  t.is(Util.argtype([1,2]),'array');
  t.is(Util.argtype(Seq.of(1,2)),'array');
  t.is(Util.argtype([1]),'array');
  t.is(Util.argtype([() => {}]),'function');
  t.is(Util.argtype([{}]),'object');
  t.is(Util.argtype([Seq.of(1,2,3)]),'array');
  t.is(Util.argtype(['mode',1,2,3]),'prefix');
});

test('fatten', t => {
  t.deepEqual(Util.flatten([1]),[1]);
  t.deepEqual(Util.flatten([[1]]),[1]);
  t.deepEqual(Util.flatten([1,[2]]),[1,2]);
  t.deepEqual(Util.flatten([[1],2]),[1,2]);
  t.deepEqual(Util.flatten([1,[2,[3]]]),[1,2,3]);
  t.deepEqual(Util.flatten([[[1],2],3]),[1,2,3]);

  t.deepEqual(Util.flatten([1,[2,[3]]],0),[1,[2,[3]]]);
  t.deepEqual(Util.flatten([1,[2,[3]]],1),[1,2,[3]]);
  t.deepEqual(Util.flatten([1,[2,[3]]],2),[1,2,3]);
});

test('nested', t => {
  t.is(Util.nested([1]),false);
  t.is(Util.nested([[1]]),true);
  t.is(Util.nested([[1],2]),true);
});

test('countNested', t => {
  t.is(Util.countNested([1]),1);
  t.is(Util.countNested([[1]]),1);
  t.is(Util.countNested([1,[2]]),2);
  t.is(Util.countNested([[1],2]),2);
  t.is(Util.countNested([1,[2,[3]]]),3);
  t.is(Util.countNested([[[1],2],3]),3);
});

test('mapParams', t => {
  const params = [
    ['foo',0],
    ['bar',1],
    ['baz',2]
  ];
  t.deepEqual(Util.mapParams([],params),[0,1,2]);
  t.deepEqual(Util.mapParams([1],params),[1,1,2]);
  t.deepEqual(Util.mapParams([1,2,3],params),[1,2,3]);
  t.deepEqual(Util.mapParams([1,2,3,4],params),[1,2,3]);
  t.deepEqual(Util.mapParams([{ foo: 1 }],params),[1,1,2]);
  t.deepEqual(Util.mapParams([{ fo: 1 }],params),[0,1,2]);
  t.deepEqual(Util.mapParams([{
    foo: 1,
    bar: 2
  }],params),[1,2,2]);
});

test('mapVariadicParams', t => {
  const params = [
    ['foo',0],
    ['bar',1],
    ['baz',2]
  ];
  const orders = [
    ['foo'],
    ['bar','foo'],
    ['bar','foo','baz']
  ];
  t.deepEqual(Util.mapVariadicParams([],params,orders),[0,1,2]);
  t.deepEqual(Util.mapVariadicParams([3],params,orders),[3,1,2]);
  t.deepEqual(Util.mapVariadicParams([3,4],params,orders),[4,3,2]);
  t.deepEqual(Util.mapVariadicParams([3,4,5],params,orders),[4,3,5]);
});

test('deepCopy', t => {
  const input = Seq.of(1,2,3);
  t.not(Util.deepCopy(input),input);
  t.deepEqual(Util.deepCopy(input),input);
});

test('modulo', t => {
  t.is(Util.modulo(1,1),0);
});

test('nestedArrayToTypedLists', t => {
  t.deepEqual(
    Util.nestedArrayToTypedLists([1,[2,[3]]], Seq),
    Seq.of(1,Seq.of(2,Seq.of(3)))
  );
});