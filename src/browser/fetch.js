import Seq from '../core/seq';
import Poly from '../core/poly';
import WebAudio from '../webaudio/webaudio';
import Waveform from '../webaudio/waveform';
import Table from '../core/table';
import Util from '../util';

const actx = WebAudio.context;

class Fetch {
  static any(url) {
    const ext = Seq.from(url.split('.')).at(-1)[0];
    switch (ext) {
      case 'wav':
      case 'aiff':
      case 'mp3':
      case 'ogg':
        return this.audio(url);
      case 'csv':
        return this.csv(url);
      case 'tsv':
        return this.tsv(url);
      default:
        break;
    }
  }
  static audio(url) {
    return window.fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => new Promise(resolve => {
        actx.decodeAudioData(arrayBuffer, audioBuffer => {
          const res = new Poly();
          for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            const audioBufferView = audioBuffer.getChannelData(i);
            res.push(Waveform.from(audioBufferView));
          }
          res.play = () => {
            res.forEach(v => v.play());
            return res;
          };
          resolve(res);
        }, console.error);
      }, console.error));
  }
  static csv(url) {
    return window.fetch(url).then(response => response.text())
      .then(text => {
        const res = new Table();
        const rows = text.split('\n').filter(v => v.length !== 0);
        const header = rows[0].split(',').map(v => v.replace(/"/g,''));
        res.set('columns',Seq.from(header).filter(v => v.length));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].split(',');
          const rowObj = {};
          header.forEach((v,i) => {
            if (v.length) {
              rowObj[v] = row[i].replace(/"/g,'');
            }
          });
          res.push(rowObj);
        }

        return res;
      });
  }
  static tsv(url) {
    return window.fetch(url).then(response => response.text())
      .then(text => {
        const res = new Table();
        const rows = text.split('\n').filter(v => v.length !== 0);
        const header = rows[0].split('\t');
        res.set('columns',Seq.from(header));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].split('\t');
          const rowObj = {};
          header.forEach((v,i) => {
            rowObj[v] = row[i];
          });
          res.push(rowObj);
        }

        return res;
      });
  }
  static scsv(url) {
    return window.fetch(url).then(response => response.text())
      .then(text => {
        const res = new Table();
        const rows = text.split('\n');
        const header = rows[0].split('\t');
        res.set('columns',Seq.from(header));

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].split('\t');
          const rowObj = {};
          header.forEach((v,i) => {
            rowObj[v] = row[i];
          });
          res.push(rowObj);
        }

        return res;
      });
  }
}

export default Fetch;
export const fetch = Util.createFactoryMethod((...args) => Fetch.any(...args), Fetch);