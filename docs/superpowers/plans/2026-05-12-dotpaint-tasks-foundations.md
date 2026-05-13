# DotPaint — Foundation Tasks (1–6b)

> Companion file to [2026-05-12-dotpaint.md](2026-05-12-dotpaint.md). Read the parent file first for the security model, file map, and dependency graph.

---

## Task 1: Project bootstrap — sequential

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`
- Create: `src/index.html`
- Modify: `.claude/launch.json`

- [ ] **Step 1: Initialise**

```bash
bun init -y
```

- [ ] **Step 2: Replace generated package.json**

```json
{
  "name": "dotpaint",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bunx serve src -p 5173",
    "test": "bun test",
    "generate": "bun run scripts/generate-pictures.mjs"
  },
  "devDependencies": {
    "@anthropic-ai/sdk": "^0.40.0"
  }
}
```

- [ ] **Step 3: Write .gitignore**

```
node_modules/
.env
.env.local
scripts/cache/
src/assets/pictures/manifest.json
src/assets/pictures/*.svg
*.log
.DS_Store
```

- [ ] **Step 4: Write README.md (initial; expanded in Task 22)**

```markdown
# DotPaint

Connect-the-dots and finger-painting PWA for a 5-year-old, built for Samsung Tab S8 landscape.

## Dev
\`\`\`
bun install
bun dev          # serves src/ at http://localhost:5173
bun test         # runs unit tests
bun run generate # one-time picture-generation pipeline (uses ANTHROPIC_API_KEY)
\`\`\`
```

- [ ] **Step 5: Write src/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>DotPaint</title>
<link rel="manifest" href="./manifest.json">
<link rel="stylesheet" href="./css/tokens.css">
<link rel="stylesheet" href="./css/components.css">
<link rel="stylesheet" href="./css/screens.css">
</head>
<body>
<main id="app"></main>
<script type="module" src="./js/app.js"></script>
</body>
</html>
```

- [ ] **Step 6: Update .claude/launch.json**

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "dotpaint", "runtimeExecutable": "bunx", "runtimeArgs": ["serve", "-p", "5173", "src"], "port": 5173 },
    { "name": "mockups",  "runtimeExecutable": "bunx", "runtimeArgs": ["serve", "-p", "5174", "mockups"], "port": 5174 }
  ]
}
```

- [ ] **Step 7: Install + commit**

```bash
bun install
git init
git add .
git commit -m "chore: bootstrap dotpaint project skeleton"
```

---

## Task 2: Design tokens CSS — sequential, blocks 3 and all screens

**Files:**
- Create: `src/css/tokens.css`

- [ ] **Step 1: Write tokens.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Comic+Neue:wght@400;700&display=swap');

:root {
  /* Brand palette (UI chrome) */
  --c-bg:        #FFF7ED;
  --c-surface:   #FFFFFF;
  --c-primary:   #F97316;
  --c-secondary: #FB923C;
  --c-accent:    #2563EB;
  --c-fg:        #9A3412;
  --c-fg-soft:   #7A6A5D;
  --c-border:    #FED7AA;
  --c-muted:     #F1F0F0;
  --c-danger:    #DC2626;
  --c-success:   #22C55E;

  /* Paint palette (the 8 colours kid uses) */
  --paint-red:    #E63946;
  --paint-orange: #F97316;
  --paint-yellow: #FFD166;
  --paint-green:  #06D6A0;
  --paint-blue:   #118AB2;
  --paint-purple: #7B2CBF;
  --paint-brown:  #8B5E3C;
  --paint-black:  #1F1F1F;

  /* Typography */
  --font-display: 'Baloo 2', system-ui, sans-serif;
  --font-body:    'Comic Neue', system-ui, sans-serif;
  --fs-title:  32px;
  --fs-button: 24px;
  --fs-body:   18px;
  --fs-label:  14px;

  /* Radii (claymorphic chunky) */
  --r-sm: 12px; --r-md: 18px; --r-lg: 24px; --r-pill: 999px;

  /* Spacing scale (8pt) */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;

  /* Touch target minimum (5yo finger margin) */
  --touch-min: 60px;

  /* Claymorphic shadow (soft 3D) */
  --shadow-soft:
    0 6px 0 rgba(154, 52, 18, 0.18),
    0 8px 18px rgba(154, 52, 18, 0.10),
    inset 0 -3px 0 rgba(0,0,0,0.05),
    inset 0 2px 0 rgba(255,255,255,0.55);
  --shadow-press:
    0 2px 0 rgba(154, 52, 18, 0.18),
    0 3px 8px rgba(154, 52, 18, 0.10),
    inset 0 -1px 0 rgba(0,0,0,0.05),
    inset 0 1px 0 rgba(255,255,255,0.4);

  /* Motion */
  --t-press: 200ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) { :root { --t-press: 0ms; } }

* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0; height: 100%;
  background: var(--c-bg); color: var(--c-fg);
  font-family: var(--font-body); font-size: var(--fs-body);
  overflow: hidden; user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
#app { display: flex; flex-direction: column; height: 100vh; min-height: 100dvh; }
```

- [ ] **Step 2: Verify**

Open `src/index.html` in preview. Page renders cream background. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/css/tokens.css
git commit -m "feat(css): add design tokens (palette, typography, claymorphic shadows)"
```

---

## Task 3: Claymorphic components CSS — sequential

**Files:**
- Create: `src/css/components.css`

- [ ] **Step 1: Write components.css**

```css
/* Tile — huge tappable card on the home screen */
.tile {
  display: flex; flex-direction: column; justify-content: flex-end;
  padding: var(--s-5); border-radius: var(--r-lg); border: 4px solid currentColor;
  font-family: var(--font-display); font-weight: 800; font-size: 40px; color: white;
  min-height: var(--touch-min);
  box-shadow: var(--shadow-soft);
  transition: transform var(--t-press) var(--ease-out), box-shadow var(--t-press) var(--ease-out);
  cursor: pointer; position: relative; overflow: hidden;
}
.tile:active { transform: scale(0.97); box-shadow: var(--shadow-press); }
.tile .tile-icon { font-size: 96px; margin-bottom: auto; align-self: flex-start; }
.tile.dots   { background: linear-gradient(135deg, #3AA6FF, #2563EB); border-color: #1E40AF; }
.tile.colour { background: linear-gradient(135deg, #FB923C, #F97316); border-color: #C2410C; }

/* Pill */
.pill {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--s-2);
  padding: var(--s-3) var(--s-5);
  background: var(--c-surface); border: 3px solid var(--c-border); border-radius: var(--r-pill);
  font-family: var(--font-display); font-weight: 700; font-size: var(--fs-button); color: var(--c-fg);
  min-height: var(--touch-min);
  box-shadow: var(--shadow-soft);
  transition: transform var(--t-press) var(--ease-out), box-shadow var(--t-press) var(--ease-out);
  cursor: pointer;
}
.pill:active { transform: scale(0.97); box-shadow: var(--shadow-press); }
.pill.primary { background: var(--c-primary); border-color: #C2410C; color: white; }
.pill.accent  { background: var(--c-accent);  border-color: #1E40AF; color: white; }
.pill.danger  { background: var(--c-danger);  border-color: #991B1B; color: white; }
.pill.small   { padding: var(--s-2) var(--s-3); font-size: var(--fs-label); min-height: 44px; }

/* Icon button */
.icon-btn {
  width: var(--touch-min); height: var(--touch-min);
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--c-surface); border: 3px solid var(--c-border);
  font-size: 28px; box-shadow: var(--shadow-soft);
  transition: transform var(--t-press) var(--ease-out); cursor: pointer;
}
.icon-btn:active { transform: scale(0.92); }
.icon-btn.primary { background: var(--c-primary); border-color: #C2410C; color: white; }

/* Swatch */
.swatch {
  width: 56px; height: 56px; border-radius: 50%;
  border: 4px solid var(--c-surface);
  box-shadow: 0 0 0 2px var(--c-border), var(--shadow-soft);
  cursor: pointer; transition: transform var(--t-press) var(--ease-out);
}
.swatch:active { transform: scale(0.92); }
.swatch.selected { box-shadow: 0 0 0 4px var(--c-fg), var(--shadow-soft); }

/* Brush size */
.brush-size {
  width: 56px; height: 56px; border-radius: var(--r-md);
  background: var(--c-surface); border: 3px solid var(--c-border);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: var(--shadow-soft);
  transition: transform var(--t-press) var(--ease-out);
}
.brush-size:active { transform: scale(0.92); }
.brush-size.selected { background: var(--c-primary); border-color: #C2410C; }
.brush-size .dot { background: var(--c-fg); border-radius: 50%; }
.brush-size.selected .dot { background: white; }

/* Thumbnail */
.thumb {
  background: var(--c-surface); border: 3px solid var(--c-border); border-radius: var(--r-md);
  aspect-ratio: 4 / 3;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: var(--shadow-soft);
  transition: transform var(--t-press) var(--ease-out);
  overflow: hidden; padding: var(--s-3); position: relative;
}
.thumb:active { transform: scale(0.95); }
.thumb svg, .thumb img { max-width: 100%; max-height: 100%; }
.thumb .badge {
  position: absolute; top: 6px; right: 6px;
  background: var(--c-accent); color: white;
  border-radius: var(--r-pill);
  padding: 2px 6px; font-size: 11px; font-weight: 700;
}

/* PIN keypad key */
.keypad-key {
  width: 80px; height: 80px;
  background: var(--c-surface); border: 3px solid var(--c-border); border-radius: var(--r-md);
  font-family: var(--font-display); font-weight: 700; font-size: 32px; color: var(--c-fg);
  box-shadow: var(--shadow-soft);
  cursor: pointer; transition: transform var(--t-press) var(--ease-out);
}
.keypad-key:active { transform: scale(0.95); box-shadow: var(--shadow-press); }

/* Top bar */
.topbar {
  display: flex; align-items: center; gap: var(--s-3);
  padding: var(--s-3) var(--s-5);
  border-bottom: 2px solid var(--c-border); background: var(--c-bg);
}
.topbar .title {
  flex: 1; font-family: var(--font-display); font-weight: 700; font-size: var(--fs-button);
}

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
```

- [ ] **Step 2: Verify with throwaway demo**

Create `src/_demo.html` with a few sample tiles, pills, swatches, keypad keys (delete after). Open in preview; visually confirm chunky claymorphic look, soft shadows, scaled-down press, 60px+ buttons.

- [ ] **Step 3: Delete demo and commit**

```bash
rm src/_demo.html
git add src/css/components.css
git commit -m "feat(css): add claymorphic component classes"
```

---

## Task 4: Util + hash router — parallel-safe

**Files:**
- Create: `src/js/lib/util.js`
- Create: `src/js/lib/router.js`
- Create: `test/router.test.js`

- [ ] **Step 1: Write util.js**

```js
// src/js/lib/util.js

/** HTML-escape a string for safe interpolation into innerHTML templates. */
export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Clamp a number into [min, max]. */
export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
```

- [ ] **Step 2: Write the failing router test**

```js
// test/router.test.js
import { describe, it, expect } from 'bun:test';
import { parseRoute } from '../src/js/lib/router.js';

describe('parseRoute', () => {
  it('parses /home', () => {
    expect(parseRoute('#/home')).toEqual({ name: 'home', params: {} });
  });
  it('parses /picker/dots', () => {
    expect(parseRoute('#/picker/dots')).toEqual({ name: 'picker', params: { mode: 'dots' } });
  });
  it('parses /dots/excavator/medium', () => {
    expect(parseRoute('#/dots/excavator/medium')).toEqual({
      name: 'dots', params: { pictureId: 'excavator', level: 'medium' }
    });
  });
  it('parses /colour/firetruck', () => {
    expect(parseRoute('#/colour/firetruck')).toEqual({
      name: 'colour', params: { pictureId: 'firetruck' }
    });
  });
  it('parses /gallery and /parent', () => {
    expect(parseRoute('#/gallery')).toEqual({ name: 'gallery', params: {} });
    expect(parseRoute('#/parent')).toEqual({ name: 'parent', params: {} });
  });
  it('falls back to home for unknown routes', () => {
    expect(parseRoute('#/garbage')).toEqual({ name: 'home', params: {} });
    expect(parseRoute('')).toEqual({ name: 'home', params: {} });
  });
});
```

- [ ] **Step 3: Run test, expect failure**

Run: `bun test test/router.test.js`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement router.js**

```js
// src/js/lib/router.js

const ROUTES = [
  { name: 'home',    pattern: /^#\/home\/?$/,                              params: () => ({}) },
  { name: 'picker',  pattern: /^#\/picker\/(dots|colour)\/?$/,             params: m => ({ mode: m[1] }) },
  { name: 'dots',    pattern: /^#\/dots\/([^/]+)\/(easy|medium|hard)\/?$/, params: m => ({ pictureId: m[1], level: m[2] }) },
  { name: 'colour',  pattern: /^#\/colour\/([^/]+)\/?$/,                   params: m => ({ pictureId: m[1] }) },
  { name: 'gallery', pattern: /^#\/gallery\/?$/,                           params: () => ({}) },
  { name: 'parent',  pattern: /^#\/parent\/?$/,                            params: () => ({}) },
];

export function parseRoute(hash) {
  if (!hash) return { name: 'home', params: {} };
  for (const r of ROUTES) {
    const m = hash.match(r.pattern);
    if (m) return { name: r.name, params: r.params(m) };
  }
  return { name: 'home', params: {} };
}

export function navigate(name, params = {}) {
  let hash = `#/${name}`;
  switch (name) {
    case 'picker':  hash += `/${params.mode}`; break;
    case 'dots':    hash += `/${params.pictureId}/${params.level}`; break;
    case 'colour':  hash += `/${params.pictureId}`; break;
  }
  window.location.hash = hash;
}

export function onRouteChange(handler) {
  const fire = () => handler(parseRoute(window.location.hash));
  window.addEventListener('hashchange', fire);
  fire();
}
```

- [ ] **Step 5: Run tests, expect pass**

Run: `bun test test/router.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/js/lib/util.js src/js/lib/router.js test/router.test.js
git commit -m "feat(lib): util.escapeHtml + hash router with 6 routes"
```

---

## Task 5: Storage abstraction — parallel-safe

**Files:**
- Create: `src/js/lib/storage.js`
- Create: `test/storage.test.js`

- [ ] **Step 1: Write the failing test**

```js
// test/storage.test.js
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
```

- [ ] **Step 2: Run test, expect failure**

Run: `bun test test/storage.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement storage.js**

```js
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
```

- [ ] **Step 4: Run tests, expect pass**

Run: `bun test test/storage.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/js/lib/storage.js test/storage.test.js
git commit -m "feat(storage): localStorage-backed settings/gallery/userPhotos"
```

---

## Task 6a: Audio module — parallel-safe

**Files:**
- Create: `src/js/lib/audio.js`

(Web Audio is verified manually; no unit test.)

- [ ] **Step 1: Write audio.js**

```js
// src/js/lib/audio.js

class AudioBus {
  constructor() {
    this.ctx = null;
    this.whooshGain = null;
    this.whooshSource = null;
    this.enabled = true;
  }
  _ensure() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { this.ctx = null; }
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
```

- [ ] **Step 2: Manual verify with throwaway HTML**

Create `src/_audio-demo.html` with three buttons that call `audio.chime()`, `audio.startWhoosh()`, `audio.stopWhoosh()`. Open in preview; click each; expect soft chime / continuous low-pass noise / clean fade-out.

- [ ] **Step 3: Delete demo and commit**

```bash
rm src/_audio-demo.html
git add src/js/lib/audio.js
git commit -m "feat(audio): chime + brush whoosh via Web Audio"
```

---

## Task 6b: Voice module — parallel-safe

**Files:**
- Create: `src/js/lib/voice.js`

- [ ] **Step 1: Write voice.js**

```js
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
```

- [ ] **Step 2: Manual verify**

Create `src/_voice-demo.html` with one button that calls `voice.say('Excavator!')`. Open in preview, click, hear TTS.

- [ ] **Step 3: Delete demo and commit**

```bash
rm src/_voice-demo.html
git add src/js/lib/voice.js
git commit -m "feat(voice): SpeechSynthesis wrapper with child-voice preference"
```
