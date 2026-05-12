// src/js/lib/voice.js

class Voice {
  constructor() { this.enabled = true; this._voice = null; }
  setEnabled(on) { this.enabled = !!on; if (!on) this.stop(); }

  _pickVoice() {
    if (this._voice) return this._voice;
    if (!('speechSynthesis' in window)) return null;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    const en = voices.filter(v => v.lang && v.lang.startsWith('en'));
    const child = en.find(v => /child|kid/i.test(v.name));
    const female = en.find(v => /female|woman|samantha|karen|moira|tessa/i.test(v.name));
    this._voice = child || female || en[0] || voices[0];
    return this._voice;
  }

  say(text) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this._pickVoice();
    if (v) u.voice = v;
    u.rate = 0.95; u.pitch = 1.1; u.volume = 1;
    speechSynthesis.speak(u);
  }
  stop() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
}

export const voice = new Voice();
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => { voice._voice = null; voice._pickVoice(); };
}
