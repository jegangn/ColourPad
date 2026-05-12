import { describe, it, expect, beforeEach } from 'bun:test';
import { Storage } from '../src/js/lib/storage.js';

const memStore = (() => {
  let data = {};
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
    clear: () => { data = {}; },
  };
})();

describe('Storage', () => {
  let storage;
  beforeEach(() => { memStore.clear(); storage = new Storage(memStore, 'test'); });

  it('returns default settings when none stored', () => {
    expect(storage.getSettings()).toEqual({ pinHash: null, soundOn: true, voiceOn: true, hintOn: true });
  });
  it('persists settings (partial patch)', () => {
    storage.setSettings({ soundOn: false });
    expect(storage.getSettings().soundOn).toBe(false);
    expect(storage.getSettings().voiceOn).toBe(true);
  });
  it('appends to gallery and lists newest first', () => {
    storage.addToGallery({ id: 'a', dataUrl: 'x', mode: 'colour' });
    storage.addToGallery({ id: 'b', dataUrl: 'y', mode: 'dots' });
    const items = storage.getGallery();
    expect(items.length).toBe(2);
    expect(items[0].id).toBe('b');
    expect(items[0].savedAt).toBeGreaterThan(0);
  });
  it('removes a gallery item by savedAt', () => {
    storage.addToGallery({ id: 'a', dataUrl: 'x', mode: 'colour' });
    const [item] = storage.getGallery();
    storage.removeFromGallery(item.savedAt);
    expect(storage.getGallery()).toEqual([]);
  });
  it('adds and lists user photos', () => {
    storage.addUserPhoto({ id: 'p1', name: 'Toy car', outlineDataUrl: 'data:x' });
    expect(storage.getUserPhotos()[0].name).toBe('Toy car');
  });
  it('reports usage in bytes', () => {
    storage.addToGallery({ id: 'a', dataUrl: 'x'.repeat(1000), mode: 'colour' });
    expect(storage.usageBytes()).toBeGreaterThan(900);
  });
});
