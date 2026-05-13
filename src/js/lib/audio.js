// src/js/lib/audio.js

class AudioBus {
  constructor() {
    this.ctx = null;
    this.whooshGain = null;
    this.whooshSource = null;
    this.enabled = true;
  }
  _ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }
  setEnabled(on) { this.enabled = !!on; if (!on) this.stopWhoosh(); }

  chime(freq = 660) {
    if (!this.enabled) return;
    this._ensure(); if (!this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  }

  startWhoosh() {
    if (!this.enabled) return;
    this._ensure(); if (!this.ctx || this.whooshSource) return;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    this.whooshSource = src; this.whooshGain = gain;
  }

  stopWhoosh() {
    if (!this.whooshSource) return;
    const ctx = this.ctx;
    this.whooshGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    const src = this.whooshSource;
    setTimeout(() => { try { src.stop(); } catch {} }, 80);
    this.whooshSource = null; this.whooshGain = null;
  }
}

export const audio = new AudioBus();
