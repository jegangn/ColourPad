// src/js/lib/storage.js

const DEFAULT_SETTINGS = { pinHash: null, soundOn: true, voiceOn: true, hintOn: true };

export class Storage {
  constructor(backend = globalThis.localStorage, prefix = 'dotpaint') {
    this.b = backend;
    this.k = {
      settings:   `${prefix}.settings`,
      gallery:    `${prefix}.gallery`,
      userPhotos: `${prefix}.userPhotos`,
      stats:      `${prefix}.stats`,
    };
  }
  _read(key, fallback) {
    const raw = this.b.getItem(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  }
  _write(key, value) { this.b.setItem(key, JSON.stringify(value)); }

  getSettings() { return { ...DEFAULT_SETTINGS, ...this._read(this.k.settings, {}) }; }
  setSettings(patch) { this._write(this.k.settings, { ...this.getSettings(), ...patch }); }

  getGallery() {
    return this._read(this.k.gallery, []).slice().sort((a, b) => b.savedAt - a.savedAt);
  }
  addToGallery({ id, dataUrl, mode }) {
    const list = this._read(this.k.gallery, []);
    list.push({ id, dataUrl, mode, savedAt: Date.now() });
    this._write(this.k.gallery, list);
  }
  removeFromGallery(savedAt) {
    const list = this._read(this.k.gallery, []).filter(i => i.savedAt !== savedAt);
    this._write(this.k.gallery, list);
  }

  getUserPhotos() { return this._read(this.k.userPhotos, []); }
  addUserPhoto({ id, name, outlineDataUrl }) {
    const list = this._read(this.k.userPhotos, []);
    list.push({ id, name, outlineDataUrl, addedAt: Date.now() });
    this._write(this.k.userPhotos, list);
  }
  removeUserPhoto(id) {
    this._write(this.k.userPhotos, this.getUserPhotos().filter(p => p.id !== id));
  }

  incrementStats() {
    const s = this._read(this.k.stats, { completed: 0 });
    s.completed += 1;
    this._write(this.k.stats, s);
  }
  getStats() { return this._read(this.k.stats, { completed: 0 }); }

  usageBytes() {
    let total = 0;
    for (const k of Object.values(this.k)) {
      const v = this.b.getItem(k);
      if (v) total += k.length + v.length;
    }
    return total;
  }
}

export const storage = (typeof window !== 'undefined') ? new Storage() : null;
