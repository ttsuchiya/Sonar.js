import Sonar from './sonar.esm.js';
const { Poly } = Sonar;

class Exporter extends Poly {
  static cast(obj) {
    const s = obj.state;
    if ([s.type,s.extends].includes('Mono')) {
      return this.of(obj);
    } else {
      return this.from(obj);
    }
  }
  constructor(...args) {
    super(...args);

    Object.assign(this.state, {
      type: 'Exporter',
      sampleRate: 44100,
      result: null
    });
  }
  wav() {
    const s = this.state;
    s.result = polyToWAV(this, s.sampleRate);
    return this;
  }
  download() {
    const s = this.state;
    if (s.result) {
      const url = URL.createObjectURL(this.state.result);

      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display:none';
      a.href = url;
      a.download = s.name ? s.name : 'snr_export.wav';
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      // console.log('');
    }
    return this;
  }
}

function bufferToWAV(buffer) {
  const pcmarrayL = buffer.getChannelData(0);
  const pcmarrayR = buffer.getChannelData(1);

  const interleaved = interleave(pcmarrayL, pcmarrayR);
  const dataview = encodeWAV(interleaved);
  return new Blob([dataview], { type: 'audio/wav' });
}

function polyToWAV(poly, sampleRate) {
  const [left,right] = poly.length === 2 ? [poly[0],poly[1]] : [poly[0],poly[0]];
  const interleaved = interleave(left,right);
  const dataview = encodeWAV(interleaved, sampleRate);
  return new Blob([dataview], { type: 'audio/wav' });
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);

  let index = 0, inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function float32ToInt16(input) {
  const res = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    res[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return res;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export { Exporter };