// src/js/lib/storage.js

const DEFAULT_SETTINGS = { pinHash: null, soundOn: true, voiceOn: true, hintOn: true };
// Per-picture in-progress drafts (auto-saved as the kid paints). Only removed
// by an explicit user action (Clear button) or a browser data wipe.
const DRAFT_KEEP = 30;        // max number of drafts to keep (LRU)
const DRAFT_PRUNE_BATCH = 5;  // how many to drop on a quota miss

export class Storage {
  constructor(backend = globalThis.localStorage, prefix = 'dotpaint') {
    this.b = backend;
    this.prefix = prefix;
    this.k = {
      settings:   `${prefix}.settings`,
      gallery:    `${prefix}.gallery`,
      userPhotos: `${prefix}.userPhotos`,
      stats:      `${prefix}.stats`,
      draftIndex: `${prefix}.draftIndex`,
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
    return this._read(this.k.gallery, []).slice().sort((a, b) => (b.savedAt - a.savedAt) || ((b.seq ?? 0) - (a.seq ?? 0)));
  }
  addToGallery({ id, dataUrl, mode }) {
    const list = this._read(this.k.gallery, []);
    const seq = (list[list.length - 1]?.seq ?? 0) + 1;
    list.push({ id, dataUrl, mode, savedAt: Date.now(), seq });
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

  // === Drafts: per-picture in-progress paintings, auto-saved.
  // Persists across browser restarts and PWA closes. Only cleared when the
  // kid taps the Clear button on a picture, or the user wipes site data.
  _draftKey(pictureId) { return `${this.prefix}.draft.${pictureId}`; }

  getDraft(pictureId) {
    return this.b.getItem(this._draftKey(pictureId));
  }

  saveDraft(pictureId, dataUrl) {
    const key = this._draftKey(pictureId);
    const tryWrite = () => {
      this.b.setItem(key, dataUrl);
      this._touchDraftIndex(pictureId);
    };
    try {
      tryWrite();
    } catch {
      // QuotaExceededError — drop a few of the oldest drafts and retry.
      this._pruneDrafts(DRAFT_PRUNE_BATCH);
      try { tryWrite(); } catch { /* still full; give up silently */ }
    }
  }

  clearDraft(pictureId) {
    this.b.removeItem(this._draftKey(pictureId));
    const idx = this._read(this.k.draftIndex, []).filter(id => id !== pictureId);
    this._write(this.k.draftIndex, idx);
  }

  _touchDraftIndex(pictureId) {
    const idx = this._read(this.k.draftIndex, []).filter(id => id !== pictureId);
    idx.push(pictureId); // most recent at end
    // Cap to DRAFT_KEEP — drop the oldest when over.
    while (idx.length > DRAFT_KEEP) {
      const dropped = idx.shift();
      this.b.removeItem(this._draftKey(dropped));
    }
    this._write(this.k.draftIndex, idx);
  }

  _pruneDrafts(count) {
    const idx = this._read(this.k.draftIndex, []);
    const toRemove = idx.slice(0, count);
    for (const id of toRemove) this.b.removeItem(this._draftKey(id));
    this._write(this.k.draftIndex, idx.slice(count));
  }
}

export const storage = (typeof window !== 'undefined') ? new Storage() : null;
