import Seq from './seq';
import Poly from './poly';
import Unit from './unit';
import Util from '../util';

class Table extends Seq {
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Table',
      extends: 'Seq'
    });
  }
  column(...args) {
    // TODO: The order of query is not retained.
    args = Util.unspread(args);
    return args.map(v => this.map(r => r[v]).cast(Unit).toNumber().cast(Seq).set('name',v))
      .cast(Poly).peek(v => this.get('group') ? v.set('group',this.get('group')) : v);
  }
  mth(...args) {
    args = Util.unspread(args);
    let columns = this.columns.at(args);
    return this.column(columns);
  }
  serialize() {
    const columns = this.get('columns');
    let res = this.column(columns).set('columns',columns);

    // TODO: Questionable
    // res.column = (...args) => {
    //   args = Util.unspread(args);
    //   return res.filter(v => {
    //     return args.includes(v.state.name);
    //   });
    // };
    return res;
  }
  groupby(...args) {
    const cols = Seq.flatten(args).filter(v => this.get('columns').includes(v));
    const colsDict = {};
    cols.forEach(col => {
      colsDict[col] = null;
    });

    const colUniqVals = {};
    cols.forEach(col => {
      colUniqVals[col] = this.map(v => v[col]).unique();
    });

    let combos = null;

    if (cols.length > 1) {
      combos = this.constructor.from(Object.values(colUniqVals).reduce((a,b) => {
        return a.reduce((c,d) => {
          return c.concat(b.map(e => [].concat(d,e)));
        }, []);
      }));
    } else {
      combos = colUniqVals[cols[0]].map(v => [v]);
    }

    return combos.map(combo => {
      const groups = Object.assign({},colsDict);
      cols.forEach((col,i) => {
        groups[col] = combo[i];
      });

      return this.filter(row => {
        return Object.entries(groups)
          .every(([key,val]) => row[key] === val);
      }).set('columns',this.get('columns'))
        .set('group',this.constructor.of(groups).set('columns',cols));
    }).filter(v => v.length !== 0).set('groupedby',cols);
  }
}

export default Table;

export const table = Util.createFactoryMethod(function (...args) {
  return Table.of(...args);
}, Table);