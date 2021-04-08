const actx = window.AudioContext && new window.AudioContext({ latencyHint: 'playback' }) || window.webkitAudioContext && new window.webkitAudioContext();

class WebAudio {
  static get context() {
    return actx;
  }
  static get now() {
    return actx.currentTime;
  }
  static get workletAvailable() {
    return actx && !!actx.audioWorklet;
  }
  static resume() {
    actx.resume();
  }
}

export default WebAudio;