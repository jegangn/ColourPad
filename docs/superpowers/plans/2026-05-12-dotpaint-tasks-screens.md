# DotPaint — Screen Tasks (7–13)

> Companion file to [2026-05-12-dotpaint.md](2026-05-12-dotpaint.md).

## Convention used in this file

To keep DOM rendering consistent across screens, every screen uses a small helper:

```js
// src/js/lib/render.js  (introduced inline by Task 7)
import { escapeHtml } from './util.js';

/** Replace the contents of `el` with the given HTML string. */
export function render(el, html) {
  // We intentionally use a single replacement assignment here. All callers must
  // pass user-controlled strings through escapeHtml() from util.js — see the
  // SECURITY MODEL section in the parent plan.
  el.replaceChildren();                    // clears contents
  const tpl = document.createElement('template');
  tpl.innerHTML = html;                    // template element is detached, no script execution
  el.appendChild(tpl.content);
}
export { escapeHtml };
```

Why a template element: writing to a detached `<template>` parses HTML without running scripts and without firing `<img>` / `<iframe>` loads until the fragment is attached, which is the standard safe pattern for trusted-template + escaped-data rendering.

Every screen file imports `{ render, escapeHtml }` from `../lib/render.js` and calls `render(root, ...)` instead of touching DOM properties directly. Static templates pass through unchanged; user-controlled values are wrapped in `escapeHtml(...)`.

---

## Task 7: Home screen + render helper

**Files:**
- Create: `src/js/lib/render.js`
- Create: `src/js/screens/home.js`
- Create or modify: `src/css/screens.css`

- [ ] **Step 1: Write `src/js/lib/render.js`**

Code shown in the convention block above. Save it verbatim.

- [ ] **Step 2: Append home styles to screens.css**

```css
.screen-home {
  display: grid; grid-template-rows: auto 1fr auto;
  height: 100%; padding: var(--s-5); gap: var(--s-4);
}
.screen-home .header { display: flex; justify-content: space-between; align-items: center; }
.screen-home .greeting {
  font-family: var(--font-display); font-weight: 700; font-size: var(--fs-title);
}
.screen-home .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-5); }
.screen-home .footer { display: flex; justify-content: center; gap: var(--s-3); }
```

- [ ] **Step 3: Write `src/js/screens/home.js`**

```js
import { navigate } from '../lib/router.js';
import { render } from '../lib/render.js';

export function renderHome(root) {
  render(root, `
    <section class="screen-home">
      <div class="header">
        <div class="greeting">Hi! 👋</div>
        <button class="icon-btn" data-action="parent" aria-label="Parent area">⚙️</button>
      </div>
      <div class="tiles">
        <button class="tile dots" data-action="dots">
          <div class="tile-icon">🔗</div>
          Connect the Dots
        </button>
        <button class="tile colour" data-action="colour">
          <div class="tile-icon">🎨</div>
          Colour
        </button>
      </div>
      <div class="footer">
        <button class="pill" data-action="gallery">🖼 My Gallery</button>
      </div>
    </section>
  `);

  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'dots':    navigate('picker', { mode: 'dots' }); break;
      case 'colour':  navigate('picker', { mode: 'colour' }); break;
      case 'gallery': navigate('gallery'); break;
      case 'parent':  navigate('parent'); break;
    }
  });
}
```

- [ ] **Step 4: Verify**

Stub `app.js` to call `renderHome(document.getElementById('app'))`. Two big tiles, gear, gallery pill. Click each — URL hash advances. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/js/lib/render.js src/js/screens/home.js src/css/screens.css
git commit -m "feat(home): render helper + two-tile home screen"
```

---

## Task 8: Picker screen

**Files:**
- Create: `src/js/screens/picker.js`
- Modify: `src/css/screens.css`

- [ ] **Step 1: Append picker styles**

```css
.screen-picker { display: grid; grid-template-rows: auto auto auto 1fr; height: 100%; gap: var(--s-3); padding-bottom: var(--s-4); }
.screen-picker .level-row { display: flex; gap: var(--s-3); padding: 0 var(--s-5); }
.screen-picker .category-row { display: flex; gap: var(--s-2); padding: 0 var(--s-5); overflow-x: auto; }
.screen-picker .grid {
  display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 1fr;
  gap: var(--s-4); padding: 0 var(--s-5) var(--s-5); overflow-y: auto;
}
```

- [ ] **Step 2: Write picker.js**

```js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { render, escapeHtml } from '../lib/render.js';

let currentLevel = 'easy';
let currentCategory = 'all';
let manifestPromise = null;

function loadManifest() {
  manifestPromise ??= fetch('./assets/pictures/manifest.json').then(r => r.json());
  return manifestPromise;
}

export async function renderPicker(root, params) {
  const mode = params.mode;                     // 'dots' | 'colour'
  const all = await loadManifest();
  const userPhotos = mode === 'colour' ? storage.getUserPhotos() : [];

  const items = [
    ...all,
    ...userPhotos.map(p => ({ id: p.id, name: p.name, category: 'mine', outlineDataUrl: p.outlineDataUrl })),
  ];
  const filtered = items.filter(p => currentCategory === 'all' || p.category === currentCategory);
  const cats = ['all', 'vehicles', 'animals', 'dinosaurs', 'food', 'other'];
  if (userPhotos.length) cats.push('mine');

  const levelRow = mode === 'dots' ? `
    <div class="level-row">
      <button class="pill ${currentLevel==='easy'?'primary':''}"   data-level="easy">Easy 10</button>
      <button class="pill ${currentLevel==='medium'?'primary':''}" data-level="medium">Medium 20</button>
      <button class="pill ${currentLevel==='hard'?'primary':''}"   data-level="hard">Hard 40</button>
    </div>` : '<div></div>';

  const thumbs = filtered.map(p => {
    const inner = p.outlineDataUrl
      ? `<img src="${escapeHtml(p.outlineDataUrl)}" alt="${escapeHtml(p.name)}">`
      : `<object data="./assets/pictures/${escapeHtml(p.id)}.svg" type="image/svg+xml" style="pointer-events:none"></object>`;
    const badge = p.category === 'mine' ? '<span class="badge">📷</span>' : '';
    return `<button class="thumb" data-pic="${escapeHtml(p.id)}">${inner}${badge}</button>`;
  }).join('');

  render(root, `
    <section class="screen-picker">
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Back">‹</button>
        <div class="title">${mode === 'dots' ? 'Connect the Dots' : 'Colour'}</div>
      </div>
      ${levelRow}
      <div class="category-row">
        ${cats.map(c => `<button class="pill small ${currentCategory===c?'primary':''}" data-category="${c}">${c}</button>`).join('')}
      </div>
      <div class="grid">${thumbs}</div>
    </section>
  `);

  root.addEventListener('click', e => {
    if (e.target.closest('[data-action="back"]')) return navigate('home');
    const lvl = e.target.closest('[data-level]');
    if (lvl) { currentLevel = lvl.dataset.level; return renderPicker(root, params); }
    const cat = e.target.closest('[data-category]');
    if (cat) { currentCategory = cat.dataset.category; return renderPicker(root, params); }
    const pic = e.target.closest('[data-pic]');
    if (pic) {
      const id = pic.dataset.pic;
      if (mode === 'dots') navigate('dots',   { pictureId: id, level: currentLevel });
      else                 navigate('colour', { pictureId: id });
    }
  }, { once: true });
}
```

- [ ] **Step 3: Verify**

After Task 16 has run. Open `#/picker/dots`, exercise difficulty + category filters, tap a thumbnail.

- [ ] **Step 4: Commit**

```bash
git add src/js/screens/picker.js src/css/screens.css
git commit -m "feat(picker): difficulty + category filtered grid"
```

---

## Task 9: Connect-the-dots engine + screen

**Files:**
- Create: `src/js/lib/dots-engine.js`
- Create: `src/js/screens/dots.js`
- Create: `test/dots-engine.test.js`
- Modify: `src/css/screens.css`

- [ ] **Step 1: Write the failing test**

```js
// test/dots-engine.test.js
import { describe, it, expect } from 'bun:test';
import { DotsEngine } from '../src/js/lib/dots-engine.js';

describe('DotsEngine', () => {
  const dots = [[10,10],[50,10],[50,50],[10,50]];
  let engine;

  it('starts at progress 0', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    expect(engine.progress).toBe(0);
    expect(engine.isComplete).toBe(false);
  });
  it('begins drag only on dot 1', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    expect(engine.tryStart(50, 50)).toBe(false);
    expect(engine.tryStart(10, 10)).toBe(true);
    expect(engine.progress).toBe(1);
  });
  it('snaps next dot when finger enters snap radius', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(40, 12); expect(engine.progress).toBe(1);
    engine.move(48, 11); expect(engine.progress).toBe(2);
  });
  it('ignores wrong-direction dots', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(10, 50);
    expect(engine.progress).toBe(1);
  });
  it('completes after last dot', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(50, 10); engine.move(50, 50); engine.move(10, 50);
    expect(engine.isComplete).toBe(true);
  });
  it('pauses on lift, resumes on tap of last completed dot', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(50, 10);
    engine.lift();
    expect(engine.isPaused).toBe(true);
    expect(engine.tryStart(50, 50)).toBe(false);
    expect(engine.tryStart(50, 10)).toBe(true);
    expect(engine.isPaused).toBe(false);
  });
  it('emits onSnap with dot index', () => {
    const snaps = [];
    engine = new DotsEngine(dots, { snapRadius: 15, onSnap: i => snaps.push(i) });
    engine.tryStart(10, 10);
    engine.move(50, 10);
    expect(snaps).toEqual([0, 1]);
  });
});
```

- [ ] **Step 2: Run test, expect failure** — `bun test test/dots-engine.test.js`

- [ ] **Step 3: Implement dots-engine.js**

```js
// src/js/lib/dots-engine.js
export class DotsEngine {
  constructor(dots, opts = {}) {
    this.dots = dots;
    this.snapRadius = opts.snapRadius ?? 30;
    this.onSnap = opts.onSnap || (() => {});
    this.onComplete = opts.onComplete || (() => {});
    this.progress = 0;
    this.isPaused = false;
    this.isDragging = false;
    this.fingerXY = null;
  }
  get isComplete() { return this.progress >= this.dots.length; }
  _dist(x, y, [dx, dy]) { const a=x-dx, b=y-dy; return Math.sqrt(a*a+b*b); }
  tryStart(x, y) {
    if (this.isComplete) return false;
    if (this.progress === 0) {
      if (this._dist(x, y, this.dots[0]) <= this.snapRadius) {
        this._snap(0); this.isDragging = true; this.isPaused = false; return true;
      }
      return false;
    }
    const last = this.dots[this.progress - 1];
    if (this._dist(x, y, last) <= this.snapRadius) {
      this.isDragging = true; this.isPaused = false; return true;
    }
    return false;
  }
  move(x, y) {
    if (!this.isDragging || this.isComplete) return;
    this.fingerXY = [x, y];
    const next = this.dots[this.progress];
    if (next && this._dist(x, y, next) <= this.snapRadius) this._snap(this.progress);
  }
  lift() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (!this.isComplete) this.isPaused = true;
    this.fingerXY = null;
  }
  _snap(idx) {
    this.onSnap(idx);
    this.progress = idx + 1;
    if (this.isComplete) { this.isDragging = false; this.fingerXY = null; this.onComplete(); }
  }
}
```

- [ ] **Step 4: Run test, expect pass** — 7 tests.

- [ ] **Step 5: Append dots screen styles**

```css
.screen-dots { display: grid; grid-template-rows: auto 1fr auto; height: 100%; }
.screen-dots .stage { position: relative; flex: 1; overflow: hidden; touch-action: none; }
.screen-dots svg.outline-bg { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.18; pointer-events: none; }
.screen-dots svg.dots-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.screen-dots .actions { display: flex; justify-content: center; gap: var(--s-3); padding: var(--s-4); }
.dot-circle { fill: white; stroke: #2563EB; stroke-width: 3; }
.dot-circle.done { fill: #22C55E; stroke: #16A34A; }
.dot-circle.active { stroke-width: 4; }
.dot-pulse { fill: none; stroke: #2563EB; stroke-width: 2; opacity: 0.5; }
.dot-num { font-family: var(--font-display); font-weight: 800; font-size: 14px; text-anchor: middle; fill: #2563EB; pointer-events: none; }
.dot-num.done { fill: white; }
.trail { fill: none; stroke: #2563EB; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
.reveal { transition: opacity 400ms; }
.reveal.hidden { opacity: 0; }
@keyframes pulse { 0%,100% { r: 14 } 50% { r: 22 } }
.dot-pulse.animated { animation: pulse 1.2s infinite; }
```

- [ ] **Step 6: Implement dots.js**

```js
// src/js/screens/dots.js
import { navigate } from '../lib/router.js';
import { audio } from '../lib/audio.js';
import { voice } from '../lib/voice.js';
import { storage } from '../lib/storage.js';
import { DotsEngine } from '../lib/dots-engine.js';
import { render, escapeHtml } from '../lib/render.js';

let manifestCache = null;
async function loadPicture(id) {
  manifestCache ??= await fetch('./assets/pictures/manifest.json').then(r => r.json());
  const meta = manifestCache.find(p => p.id === id);
  if (!meta) throw new Error('picture not found: ' + id);
  const svgText = await fetch(`./assets/pictures/${meta.svg}`).then(r => r.text());
  return { meta, svgText };
}

export async function renderDots(root, params) {
  const { meta, svgText } = await loadPicture(params.pictureId);
  const dots = meta.dotsByLevel[params.level];
  const settings = storage.getSettings();
  const W = 400, H = 300;

  const outlineGroup = svgText.match(/<g id="outline">[\s\S]*?<\/g>/)?.[0] ?? '';
  const safeName = escapeHtml(meta.name);

  render(root, `
    <section class="screen-dots">
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Back">‹</button>
        <div class="title">${safeName}</div>
        <div id="progress" style="font-family:var(--font-display);font-weight:700;font-size:var(--fs-button)">0 / ${dots.length}</div>
      </div>
      <div class="stage" id="stage">
        <div class="reveal hidden" id="reveal" aria-hidden="true">${svgText}</div>
        ${settings.hintOn ? `<svg class="outline-bg" viewBox="0 0 ${W} ${H}">${outlineGroup}</svg>` : ''}
        <svg class="dots-svg" viewBox="0 0 ${W} ${H}">
          <polyline class="trail" id="trail" points=""/>
          <g id="dot-layer"></g>
        </svg>
      </div>
      <div class="actions" id="actions" style="visibility:hidden">
        <button class="pill" data-action="back">🏠 Home</button>
        <button class="pill" data-action="restart">Try again</button>
        <button class="pill primary" data-action="save">⭐ Save</button>
      </div>
    </section>
  `);

  const stage = root.querySelector('#stage');
  const dotLayer = root.querySelector('#dot-layer');
  const trail = root.querySelector('#trail');
  const reveal = root.querySelector('#reveal');
  const progressEl = root.querySelector('#progress');
  const actions = root.querySelector('#actions');

  const drawDots = (engine) => {
    render(dotLayer, dots.map(([x, y], i) => {
      const done = i < engine.progress;
      const active = i === engine.progress;
      return `
        ${active ? `<circle class="dot-pulse animated" cx="${x}" cy="${y}" r="16"/>` : ''}
        <circle class="dot-circle ${done?'done':''} ${active?'active':''}" cx="${x}" cy="${y}" r="11"/>
        <text class="dot-num ${done?'done':''}" x="${x}" y="${y + 4}">${i + 1}</text>
      `;
    }).join(''));
    trail.setAttribute('points', dots.slice(0, engine.progress).map(p => p.join(',')).join(' '));
    progressEl.textContent = `${engine.progress} / ${dots.length}`;
  };

  const engine = new DotsEngine(dots, {
    snapRadius: 30,
    onSnap: () => { audio.chime(); drawDots(engine); },
    onComplete: () => {
      voice.say(meta.name);
      reveal.classList.remove('hidden');
      const dotsSvg = stage.querySelector('.dots-svg');
      dotsSvg.style.transition = 'opacity 400ms';
      dotsSvg.style.opacity = '0';
      actions.style.visibility = 'visible';
      storage.incrementStats();
    },
  });
  drawDots(engine);

  const stageSvg = stage.querySelector('.dots-svg');
  const toLocal = (e) => {
    const r = stageSvg.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width)  * W,
      ((e.clientY - r.top)  / r.height) * H,
    ];
  };

  stageSvg.addEventListener('pointerdown', e => {
    stageSvg.setPointerCapture(e.pointerId);
    const [x, y] = toLocal(e);
    if (engine.tryStart(x, y)) drawDots(engine);
  });
  stageSvg.addEventListener('pointermove', e => {
    if (!engine.isDragging) return;
    const [x, y] = toLocal(e); engine.move(x, y);
  });
  stageSvg.addEventListener('pointerup',     () => engine.lift());
  stageSvg.addEventListener('pointercancel', () => engine.lift());

  actions.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'back')    return navigate('home');
    if (btn.dataset.action === 'restart') return renderDots(root, params);
    if (btn.dataset.action === 'save') {
      const svgEl = reveal.querySelector('svg');
      const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = W * 2; c.height = H * 2;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        storage.addToGallery({ id: meta.id, mode: 'dots', dataUrl: c.toDataURL('image/png') });
        URL.revokeObjectURL(url);
        btn.textContent = '✓ Saved';
        btn.disabled = true;
      };
      img.src = url;
    }
  });

  root.querySelector('.topbar [data-action="back"]').addEventListener('click', () => navigate('home'));
}
```

- [ ] **Step 7: Run all tests** — `bun test`. All green.

- [ ] **Step 8: Commit**

```bash
git add src/js/lib/dots-engine.js src/js/screens/dots.js src/css/screens.css test/dots-engine.test.js
git commit -m "feat(dots): drag-a-line engine + screen with snap, pause/resume, save"
```

---

## Task 10: Paint canvas + colouring screen

**Files:**
- Create: `src/js/lib/paint.js`
- Create: `src/js/screens/colour.js`
- Create: `test/paint.test.js`
- Modify: `src/css/screens.css`

- [ ] **Step 1: Write paint test**

```js
// test/paint.test.js
import { describe, it, expect } from 'bun:test';
import { UndoStack } from '../src/js/lib/paint.js';

describe('UndoStack', () => {
  it('records snapshots and pops them', () => {
    const stack = new UndoStack(5);
    stack.push('a'); stack.push('b'); stack.push('c');
    expect(stack.pop()).toBe('b');
    expect(stack.pop()).toBe('a');
    expect(stack.pop()).toBe(null);
  });
  it('discards oldest when at capacity', () => {
    const stack = new UndoStack(2);
    stack.push('a'); stack.push('b'); stack.push('c'); stack.push('d');
    expect(stack.pop()).toBe('c');
    expect(stack.pop()).toBe(null);
  });
});
```

- [ ] **Step 2: Run, expect failure** — `bun test test/paint.test.js`

- [ ] **Step 3: Implement paint.js**

```js
// src/js/lib/paint.js
export class UndoStack {
  constructor(max = 30) { this.max = max; this.items = []; }
  push(snap) { this.items.push(snap); while (this.items.length > this.max) this.items.shift(); }
  pop() {
    if (this.items.length < 2) return null;
    this.items.pop();
    return this.items[this.items.length - 1];
  }
  reset() { this.items = []; }
  get size() { return this.items.length; }
}

export class PaintLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colour = '#E63946';
    this.size = 16;
    this.prev = null;
    this.undo = new UndoStack(20);
    this._snapshot();
  }
  setColour(c) { this.colour = c; }
  setSize(s)   { this.size = s; }

  beginStroke(x, y) { this._snapshot(); this.prev = [x, y]; this._dot(x, y); }
  drawTo(x, y) {
    if (!this.prev) return;
    const [px, py] = this.prev, ctx = this.ctx;
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    this.prev = [x, y];
  }
  endStroke() { this.prev = null; }

  _dot(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  _snapshot() { this.undo.push(this.canvas.toDataURL('image/png')); }

  doUndo() {
    const prev = this.undo.pop();
    if (!prev) return Promise.resolve(false);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
        resolve(true);
      };
      img.src = prev;
    });
  }
  clear() {
    this._snapshot();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
```

- [ ] **Step 4: Run, expect pass** — 2 tests.

- [ ] **Step 5: Append colour screen styles**

```css
.screen-colour { display: grid; grid-template-rows: auto 1fr auto; height: 100%; }
.screen-colour .stage { position: relative; flex: 1; overflow: hidden; touch-action: none; background: white; }
.screen-colour canvas.paint { position: absolute; inset: 0; width: 100%; height: 100%; }
.screen-colour .outline-top { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.screen-colour .palette {
  display: flex; align-items: center; gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border-top: 2px solid var(--c-border); background: var(--c-bg);
  flex-wrap: wrap;
}
.screen-colour .palette .spacer { flex: 1; }
```

- [ ] **Step 6: Implement colour.js**

```js
// src/js/screens/colour.js
import { navigate } from '../lib/router.js';
import { audio } from '../lib/audio.js';
import { storage } from '../lib/storage.js';
import { PaintLayer } from '../lib/paint.js';
import { render, escapeHtml } from '../lib/render.js';

const PAINT_COLOURS = [
  ['#E63946','red'], ['#F97316','orange'], ['#FFD166','yellow'],
  ['#06D6A0','green'], ['#118AB2','blue'], ['#7B2CBF','purple'],
  ['#8B5E3C','brown'], ['#1F1F1F','black'],
];
const SIZES = [{label:'small',value:8},{label:'medium',value:16},{label:'large',value:28}];

let manifestCache = null;
async function loadPicture(id) {
  manifestCache ??= await fetch('./assets/pictures/manifest.json').then(r => r.json());
  const meta = manifestCache.find(p => p.id === id);
  if (!meta) {
    const photo = storage.getUserPhotos().find(p => p.id === id);
    if (photo) return { meta: { id: photo.id, name: photo.name }, outlineDataUrl: photo.outlineDataUrl };
    throw new Error('picture not found');
  }
  const svgText = await fetch(`./assets/pictures/${meta.svg}`).then(r => r.text());
  return { meta, svgText };
}

export async function renderColour(root, params) {
  const { meta, svgText, outlineDataUrl } = await loadPicture(params.pictureId);
  const W = 400, H = 300;
  const safeName = escapeHtml(meta.name);
  const outlineGroup = svgText ? (svgText.match(/<g id="outline">[\s\S]*?<\/g>/)?.[0] ?? '') : '';

  const overlay = outlineDataUrl
    ? `<img class="outline-top" src="${escapeHtml(outlineDataUrl)}" alt="" style="object-fit:contain">`
    : `<svg class="outline-top" viewBox="0 0 ${W} ${H}">${outlineGroup}</svg>`;

  const swatchHtml = PAINT_COLOURS.map(([hex, name], i) => `
    <button class="swatch ${i===0?'selected':''}" style="background:${hex}" data-colour="${hex}" aria-label="${name}"></button>
  `).join('');
  const sizeHtml = SIZES.map((s, i) => `
    <button class="brush-size ${i===1?'selected':''}" data-size="${s.value}" aria-label="${s.label}">
      <div class="dot" style="width:${s.value}px;height:${s.value}px"></div>
    </button>
  `).join('');

  render(root, `
    <section class="screen-colour">
      <div class="topbar">
        <button class="icon-btn" data-action="back">‹</button>
        <div class="title">${safeName}</div>
        <button class="icon-btn" data-action="undo" aria-label="Undo">↶</button>
        <button class="icon-btn" data-action="clear" aria-label="Clear">🗑</button>
        <button class="icon-btn primary" data-action="save" aria-label="Save">⭐</button>
      </div>
      <div class="stage" id="stage">
        <canvas class="paint" id="paint" width="${W*2}" height="${H*2}"></canvas>
        ${overlay}
      </div>
      <div class="palette">
        ${swatchHtml}
        <button class="swatch" style="background:white;border-color:#aaa;color:#444;font-size:18px" data-colour="ERASE" aria-label="Eraser">⌫</button>
        <div class="spacer"></div>
        ${sizeHtml}
      </div>
    </section>
  `);

  const canvas = root.querySelector('#paint');
  const layer = new PaintLayer(canvas);
  layer.setColour(PAINT_COLOURS[0][0]);
  layer.setSize(SIZES[1].value);

  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width)  * canvas.width,
      ((e.clientY - r.top)  / r.height) * canvas.height,
    ];
  };

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = toCanvas(e);
    layer.beginStroke(x, y);
    audio.startWhoosh();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.buttons === 0 && e.pointerType !== 'touch') return;
    const [x, y] = toCanvas(e);
    layer.drawTo(x, y);
  });
  canvas.addEventListener('pointerup',     () => { layer.endStroke(); audio.stopWhoosh(); });
  canvas.addEventListener('pointercancel', () => { layer.endStroke(); audio.stopWhoosh(); });

  root.querySelector('.palette').addEventListener('click', e => {
    const sw = e.target.closest('[data-colour]');
    if (sw) {
      root.querySelectorAll('[data-colour]').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      if (sw.dataset.colour === 'ERASE') {
        layer.ctx.globalCompositeOperation = 'destination-out';
        layer.setColour('rgba(0,0,0,1)');
      } else {
        layer.ctx.globalCompositeOperation = 'source-over';
        layer.setColour(sw.dataset.colour);
      }
      return;
    }
    const sz = e.target.closest('[data-size]');
    if (sz) {
      root.querySelectorAll('[data-size]').forEach(s => s.classList.remove('selected'));
      sz.classList.add('selected');
      layer.setSize(Number(sz.dataset.size));
    }
  });

  root.querySelector('.topbar').addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'back')  return navigate('home');
    if (btn.dataset.action === 'undo')  return layer.doUndo();
    if (btn.dataset.action === 'clear') {
      if (confirm('Clear the whole picture?')) layer.clear();
      return;
    }
    if (btn.dataset.action === 'save') {
      const out = document.createElement('canvas');
      out.width = W * 2; out.height = H * 2;
      const ctx = out.getContext('2d');
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0);
      const overlayEl = root.querySelector('.outline-top');
      if (overlayEl.tagName === 'IMG') {
        ctx.drawImage(overlayEl, 0, 0, out.width, out.height);
      } else {
        const svg = new Blob([new XMLSerializer().serializeToString(overlayEl)], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svg);
        await new Promise(r => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0, out.width, out.height); URL.revokeObjectURL(url); r(); };
          img.src = url;
        });
      }
      storage.addToGallery({ id: meta.id, mode: 'colour', dataUrl: out.toDataURL('image/png') });
      storage.incrementStats();
      btn.textContent = '✓';
      btn.disabled = true;
    }
  });
}
```

- [ ] **Step 7: Verify** — open `#/colour/<id>`, paint, change colour/size, undo, clear, save.

- [ ] **Step 8: Commit**

```bash
git add src/js/lib/paint.js src/js/screens/colour.js src/css/screens.css test/paint.test.js
git commit -m "feat(colour): finger paint canvas with palette, brush sizes, undo/clear/save"
```

---

## Task 11: Gallery screen

**Files:**
- Create: `src/js/screens/gallery.js`
- Modify: `src/css/screens.css`

- [ ] **Step 1: Append gallery styles**

```css
.screen-gallery { display: grid; grid-template-rows: auto 1fr; height: 100%; }
.screen-gallery .grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--s-3);
  padding: var(--s-4); overflow-y: auto;
}
.screen-gallery .item {
  position: relative;
  background: var(--c-surface); border: 3px solid var(--c-border); border-radius: var(--r-md);
  aspect-ratio: 4/3; overflow: hidden; cursor: pointer;
  box-shadow: var(--shadow-soft); transition: transform var(--t-press) var(--ease-out);
}
.screen-gallery .item:active { transform: scale(0.95); }
.screen-gallery .item img { width: 100%; height: 100%; object-fit: contain; }
.screen-gallery .empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: var(--s-3); color: var(--c-fg-soft); padding: var(--s-7); text-align: center;
}
.screen-gallery .empty .icon { font-size: 64px; }
.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.lightbox img { max-width: 90vw; max-height: 80vh; box-shadow: 0 8px 30px rgba(0,0,0,0.4); border-radius: var(--r-md); }
.lightbox .close { position: absolute; top: 20px; right: 20px; }
```

- [ ] **Step 2: Write gallery.js**

```js
// src/js/screens/gallery.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { render, escapeHtml } from '../lib/render.js';

export function renderGallery(root) {
  const items = storage.getGallery();
  const body = items.length === 0 ? `
    <div class="empty">
      <div class="icon">🖼</div>
      <div style="font-family:var(--font-display);font-weight:700;font-size:24px;color:var(--c-fg)">No pictures saved yet</div>
      <div>Tap the ⭐ button when you finish a picture to save it here.</div>
    </div>` : `
    <div class="grid">
      ${items.map(it => `
        <div class="item" data-saved="${it.savedAt}">
          <img src="${escapeHtml(it.dataUrl)}" alt="${escapeHtml(it.id)}">
        </div>
      `).join('')}
    </div>`;

  render(root, `
    <section class="screen-gallery">
      <div class="topbar">
        <button class="icon-btn" data-action="back">‹</button>
        <div class="title">My Gallery (${items.length})</div>
      </div>
      ${body}
    </section>
  `);

  root.querySelector('[data-action="back"]').addEventListener('click', () => navigate('home'));

  root.querySelectorAll('.item').forEach(el => {
    let pressTimer;
    el.addEventListener('pointerdown', () => {
      pressTimer = setTimeout(() => {
        if (confirm('Delete this picture?')) {
          storage.removeFromGallery(Number(el.dataset.saved));
          renderGallery(root);
        }
      }, 700);
    });
    el.addEventListener('pointerup',     () => clearTimeout(pressTimer));
    el.addEventListener('pointercancel', () => clearTimeout(pressTimer));
    el.addEventListener('click', () => {
      if (pressTimer) clearTimeout(pressTimer);
      const item = items.find(i => i.savedAt === Number(el.dataset.saved));
      const lb = document.createElement('div');
      lb.className = 'lightbox';
      const close = document.createElement('button');
      close.className = 'icon-btn close';
      close.textContent = '✕';
      close.dataset.close = '';
      const img = document.createElement('img');
      img.src = item.dataUrl;
      lb.appendChild(close); lb.appendChild(img);
      lb.addEventListener('click', e => {
        if (e.target === lb || e.target.closest('[data-close]')) lb.remove();
      });
      document.body.appendChild(lb);
    });
  });
}
```

- [ ] **Step 3: Verify** — inject items via DevTools localStorage, open `#/gallery`, lightbox, long-press delete.

- [ ] **Step 4: Commit**

```bash
git add src/js/screens/gallery.js src/css/screens.css
git commit -m "feat(gallery): grid + lightbox + long-press delete"
```

---

## Task 12: Parent area + PIN gate

**Files:**
- Create: `src/js/screens/parent.js`
- Modify: `src/css/screens.css`

- [ ] **Step 1: Append parent styles**

```css
.screen-parent { display: grid; grid-template-rows: auto 1fr; height: 100%; }
.parent-pin {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: var(--s-5); padding: var(--s-5);
}
.parent-pin .label { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-button); color: var(--c-fg); }
.pin-dots { display: flex; gap: var(--s-3); }
.pin-dots .d { width: 18px; height: 18px; border-radius: 50%; background: var(--c-muted); border: 2px solid var(--c-border); }
.pin-dots .d.on { background: var(--c-fg); }
.keypad { display: grid; grid-template-columns: repeat(3, 80px); gap: var(--s-3); }
.parent-menu { display: flex; flex-direction: column; gap: var(--s-3); padding: var(--s-5); overflow-y: auto; }
.menu-row {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--c-surface); border: 3px solid var(--c-border); border-radius: var(--r-md);
  padding: var(--s-4); font-family: var(--font-display); font-weight: 700; font-size: var(--fs-button);
  min-height: var(--touch-min); box-shadow: var(--shadow-soft); cursor: pointer;
}
.menu-row .v { color: var(--c-fg-soft); font-size: var(--fs-body); font-weight: 400; }
```

- [ ] **Step 2: Write parent.js**

```js
// src/js/screens/parent.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { audio } from '../lib/audio.js';
import { voice } from '../lib/voice.js';
import { render } from '../lib/render.js';

const DEFAULT_PIN = '1234';

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function renderParent(root) {
  const settings = storage.getSettings();
  const requiredHash = settings.pinHash || await sha256(DEFAULT_PIN);
  let entered = '';

  const pinScreen = () => {
    render(root, `
      <section class="screen-parent">
        <div class="topbar">
          <button class="icon-btn" data-action="back">‹</button>
          <div class="title">Parent area</div>
        </div>
        <div class="parent-pin">
          <div class="label">Enter 4-digit PIN</div>
          <div class="pin-dots">
            ${[0,1,2,3].map(i => `<div class="d ${i < entered.length ? 'on' : ''}"></div>`).join('')}
          </div>
          <div class="keypad">
            ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
            <div></div>
            <button class="keypad-key" data-key="0">0</button>
            <button class="keypad-key" data-key="del">⌫</button>
          </div>
          ${settings.pinHash ? '' : '<div style="font-size:14px;color:var(--c-fg-soft)">Default PIN: 1234</div>'}
        </div>
      </section>
    `);
    root.querySelector('[data-action="back"]').addEventListener('click', () => navigate('home'));
    root.querySelectorAll('[data-key]').forEach(k => {
      k.addEventListener('click', async () => {
        if (k.dataset.key === 'del') entered = entered.slice(0, -1);
        else if (entered.length < 4) entered += k.dataset.key;
        if (entered.length === 4) {
          const enteredHash = await sha256(entered);
          if (enteredHash === requiredHash) menuScreen();
          else { entered = ''; pinScreen(); }
        } else pinScreen();
      });
    });
  };

  const menuScreen = () => {
    const s = storage.getSettings();
    const stats = storage.getStats();
    render(root, `
      <section class="screen-parent">
        <div class="topbar">
          <button class="icon-btn" data-action="back">‹</button>
          <div class="title">Parent settings</div>
        </div>
        <div class="parent-menu">
          <div class="menu-row" data-action="add-photo"><span>📷 Add photo as colouring page</span><span class="v">›</span></div>
          <div class="menu-row" data-action="manage-gallery"><span>🖼 Manage Gallery (${storage.getGallery().length})</span><span class="v">›</span></div>
          <div class="menu-row" data-action="change-pin"><span>🔢 Change PIN</span><span class="v">${s.pinHash?'•••':'1234 (default)'}</span></div>
          <div class="menu-row" data-action="toggle-hint"><span>👻 Faint outline hint</span><span class="v">${s.hintOn?'On':'Off'}</span></div>
          <div class="menu-row" data-action="toggle-sound"><span>🔊 Sound effects</span><span class="v">${s.soundOn?'On':'Off'}</span></div>
          <div class="menu-row" data-action="toggle-voice"><span>🗣 Voice naming</span><span class="v">${s.voiceOn?'On':'Off'}</span></div>
          <div class="menu-row"><span>📊 Pictures completed</span><span class="v">${stats.completed}</span></div>
        </div>
      </section>
    `);
    root.querySelector('[data-action="back"]').addEventListener('click', () => navigate('home'));
    root.querySelector('.parent-menu').addEventListener('click', async e => {
      const row = e.target.closest('[data-action]');
      if (!row) return;
      switch (row.dataset.action) {
        case 'toggle-hint':  storage.setSettings({ hintOn:  !s.hintOn });  menuScreen(); break;
        case 'toggle-sound': storage.setSettings({ soundOn: !s.soundOn }); audio.setEnabled(!s.soundOn); menuScreen(); break;
        case 'toggle-voice': storage.setSettings({ voiceOn: !s.voiceOn }); voice.setEnabled(!s.voiceOn); menuScreen(); break;
        case 'change-pin':
          {
            const newPin = prompt('Enter new 4-digit PIN');
            if (!newPin || !/^\d{4}$/.test(newPin)) { alert('Must be exactly 4 digits.'); break; }
            storage.setSettings({ pinHash: await sha256(newPin) });
            alert('PIN updated.'); menuScreen();
          }
          break;
        case 'add-photo':
          {
            const { renderPhotoUpload } = await import('./photo-upload.js');
            renderPhotoUpload(root, () => renderParent(root));
          }
          break;
        case 'manage-gallery':
          navigate('gallery');
          break;
      }
    });
  };

  pinScreen();
}
```

- [ ] **Step 3: Verify** — open `#/parent`, enter 1234, menu appears, toggle settings.

- [ ] **Step 4: Commit**

```bash
git add src/js/screens/parent.js src/css/screens.css
git commit -m "feat(parent): PIN gate (SHA-256) + settings menu"
```

---

## Task 13: Photo → outline + upload screen

**Files:**
- Create: `src/js/lib/photo-to-outline.js`
- Create: `src/js/screens/photo-upload.js`

- [ ] **Step 1: Implement photo-to-outline.js**

```js
// src/js/lib/photo-to-outline.js
export function imageToOutline(img, threshold = 100) {
  const max = 800;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth  * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  const src = ctx.getImageData(0, 0, w, h);
  const grey = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < src.data.length; i += 4, j++) {
    grey[j] = (src.data[i] * 0.299 + src.data[i+1] * 0.587 + src.data[i+2] * 0.114) | 0;
  }
  const blurred = new Uint8ClampedArray(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          s += grey[(y + dy) * w + (x + dx)];
      blurred[y * w + x] = s / 9;
    }
  }
  const out = ctx.createImageData(w, h);
  const Gx = [-1,0,1,-2,0,2,-1,0,1];
  const Gy = [-1,-2,-1,0,0,0,1,2,1];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0, k = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++, k++) {
          const v = blurred[(y + dy) * w + (x + dx)];
          gx += v * Gx[k]; gy += v * Gy[k];
        }
      const mag = Math.sqrt(gx * gx + gy * gy);
      const idx = (y * w + x) * 4;
      const edge = mag > threshold ? 0 : 255;
      out.data[idx] = edge; out.data[idx+1] = edge; out.data[idx+2] = edge; out.data[idx+3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c.toDataURL('image/png');
}
```

- [ ] **Step 2: Implement photo-upload.js**

```js
// src/js/screens/photo-upload.js
import { storage } from '../lib/storage.js';
import { imageToOutline } from '../lib/photo-to-outline.js';
import { render } from '../lib/render.js';

export function renderPhotoUpload(root, onDone) {
  let lastImg = null;
  let threshold = 100;

  // Static template — user-typed name lives only in the input element, never interpolated.
  render(root, `
    <section class="screen-parent">
      <div class="topbar">
        <button class="icon-btn" data-action="back">‹</button>
        <div class="title">Add photo as colouring page</div>
      </div>
      <div style="display:grid;grid-template-rows:auto 1fr auto;gap:16px;padding:24px;height:100%">
        <div>
          <input type="file" id="file" accept="image/*" style="font-size:18px">
          <input type="text" id="name" placeholder="Picture name (e.g. Toy car)" style="font-size:18px;padding:8px;margin-left:12px;width:300px">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center;justify-items:center">
          <div><div style="font-weight:700;text-align:center">Photo</div><img id="orig" style="max-width:100%;max-height:300px;background:#eee"></div>
          <div><div style="font-weight:700;text-align:center">Outline</div><img id="outline" style="max-width:100%;max-height:300px;background:#fff;border:1px solid #ccc"></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <label>Threshold:</label>
          <input type="range" min="20" max="200" value="100" id="threshold" style="flex:1">
          <span id="thresh-val">100</span>
          <button class="pill primary" id="save" disabled>Add to Colouring</button>
        </div>
      </div>
    </section>
  `);

  const file = root.querySelector('#file');
  const orig = root.querySelector('#orig');
  const outline = root.querySelector('#outline');
  const slider = root.querySelector('#threshold');
  const threshVal = root.querySelector('#thresh-val');
  const save = root.querySelector('#save');
  const nameInput = root.querySelector('#name');

  const refresh = () => {
    if (!lastImg) return;
    outline.src = imageToOutline(lastImg, threshold);
    save.disabled = false;
  };

  file.addEventListener('change', () => {
    const f = file.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { lastImg = img; orig.src = url; refresh(); };
    img.src = url;
  });

  slider.addEventListener('input', () => {
    threshold = Number(slider.value);
    threshVal.textContent = String(threshold);
    refresh();
  });

  save.addEventListener('click', () => {
    const name = (nameInput.value || 'My picture').trim();
    storage.addUserPhoto({
      id: 'user-' + Date.now(),
      name,
      outlineDataUrl: outline.src,
    });
    onDone();
  });

  root.querySelector('[data-action="back"]').addEventListener('click', onDone);
}
```

- [ ] **Step 3: Verify** — parent → Add photo → upload → threshold slider → save → appears in colour picker under `mine`.

- [ ] **Step 4: Commit**

```bash
git add src/js/lib/photo-to-outline.js src/js/screens/photo-upload.js
git commit -m "feat(photo): browser Sobel edge detection + upload flow"
```
