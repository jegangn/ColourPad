# DotPaint — Integration Tasks (18–22)

> Companion file to [2026-05-12-dotpaint.md](2026-05-12-dotpaint.md).

---

## Task 18: app.js — wire screens to router

**Files:**
- Create: `src/js/app.js`

- [ ] **Step 1: Write app.js**

```js
// src/js/app.js
import { onRouteChange } from './lib/router.js';
import { storage } from './lib/storage.js';
import { audio } from './lib/audio.js';
import { voice } from './lib/voice.js';
import { render } from './lib/render.js';

import { renderHome }    from './screens/home.js';
import { renderPicker }  from './screens/picker.js';
import { renderDots }    from './screens/dots.js';
import { renderColour }  from './screens/colour.js';
import { renderGallery } from './screens/gallery.js';
import { renderParent }  from './screens/parent.js';

// Apply current settings to audio/voice
const s = storage.getSettings();
audio.setEnabled(s.soundOn);
voice.setEnabled(s.voiceOn);

const root = document.getElementById('app');

const RENDERERS = {
  home:    (params) => renderHome(root, params),
  picker:  (params) => renderPicker(root, params),
  dots:    (params) => renderDots(root, params),
  colour:  (params) => renderColour(root, params),
  gallery: (params) => renderGallery(root, params),
  parent:  (params) => renderParent(root, params),
};

if (!window.location.hash) window.location.hash = '#/home';

onRouteChange(({ name, params }) => {
  const fn = RENDERERS[name] || RENDERERS.home;
  Promise.resolve(fn(params)).catch(err => {
    console.error('render error', err);
    render(root, `
      <div style="padding:40px;color:#dc2626;font-family:sans-serif">
        <h2>Something went wrong</h2>
        <pre>${String(err.message).replace(/</g, '&lt;')}</pre>
        <button onclick="location.hash='#/home'">Back to home</button>
      </div>
    `);
  });
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
```

- [ ] **Step 2: Verify in preview**

Open `src/index.html` in the preview tab. App loads to `#/home`. Click each tile, navigate through screens, hit back button. Console clean.

- [ ] **Step 3: Commit**

```bash
git add src/js/app.js
git commit -m "feat(app): wire router to screen renderers"
```

---

## Task 19: PWA manifest + icons — parallel-safe with 20

**Files:**
- Create: `src/manifest.json`
- Create: `src/assets/icons/icon-192.png`
- Create: `src/assets/icons/icon-512.png`

- [ ] **Step 1: Write manifest.json**

```json
{
  "name": "DotPaint",
  "short_name": "DotPaint",
  "description": "Connect-the-dots and colouring for a 5-year-old.",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#FFF7ED",
  "theme_color": "#F97316",
  "start_url": "./",
  "icons": [
    { "src": "./assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "./assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: Generate icons via a one-shot HTML page**

Create `scripts/make-icons.html`:

```html
<!DOCTYPE html><html><body>
<canvas id="c192" width="192" height="192"></canvas>
<canvas id="c512" width="512" height="512"></canvas>
<script>
const draw = (canvas) => {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  ctx.fillStyle = '#FFF7ED'; ctx.fillRect(0,0,w,w);
  ctx.fillStyle = '#F97316';
  ctx.beginPath(); ctx.arc(w/2, w/2, w*0.40, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  for (const [x,y] of [[0.35,0.45],[0.5,0.6],[0.65,0.45]]) {
    ctx.beginPath(); ctx.arc(w*x, w*y, w*0.07, 0, Math.PI*2); ctx.fill();
  }
  ctx.strokeStyle = '#fff'; ctx.lineWidth = w*0.025;
  ctx.beginPath(); ctx.moveTo(w*0.35, w*0.45); ctx.lineTo(w*0.5, w*0.6); ctx.lineTo(w*0.65, w*0.45); ctx.stroke();
  const a = document.createElement('a');
  a.download = 'icon-' + w + '.png';
  a.href = canvas.toDataURL();
  a.textContent = 'Download ' + w + 'px';
  a.style = 'display:block;margin:12px';
  document.body.appendChild(a);
};
draw(document.getElementById('c192'));
draw(document.getElementById('c512'));
</script></body></html>
```

Open in preview → click both download links → place files in `src/assets/icons/`.

- [ ] **Step 3: Verify**

Open `src/index.html` in preview. DevTools → Application → Manifest. Should show "Installable: yes" with icons rendering.

- [ ] **Step 4: Commit**

```bash
git add src/manifest.json src/assets/icons/ scripts/make-icons.html
git commit -m "feat(pwa): manifest + 192/512 icons"
```

---

## Task 20: Service worker — parallel-safe with 19

**Files:**
- Create: `src/sw.js`

- [ ] **Step 1: Write sw.js**

```js
// src/sw.js
const CACHE = 'dotpaint-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/components.css',
  './css/screens.css',
  './js/app.js',
  './js/lib/util.js',
  './js/lib/render.js',
  './js/lib/router.js',
  './js/lib/storage.js',
  './js/lib/audio.js',
  './js/lib/voice.js',
  './js/lib/dots-engine.js',
  './js/lib/paint.js',
  './js/lib/photo-to-outline.js',
  './js/screens/home.js',
  './js/screens/picker.js',
  './js/screens/dots.js',
  './js/screens/colour.js',
  './js/screens/gallery.js',
  './js/screens/parent.js',
  './js/screens/photo-upload.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/pictures/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    try {
      const m = await fetch('./assets/pictures/manifest.json').then(r => r.json());
      await cache.addAll(m.map(p => './assets/pictures/' + p.svg));
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    return cached || fetch(e.request);
  })());
});
```

- [ ] **Step 2: Verify**

Open the app in preview. DevTools → Application → Service Workers. Confirm install + activate. Cache Storage shows `dotpaint-v1` populated. Toggle DevTools "Offline" → reload → app still works.

- [ ] **Step 3: Commit**

```bash
git add src/sw.js
git commit -m "feat(pwa): cache-first service worker"
```

---

## Task 21: End-to-end smoke test in preview — sequential

**Files:** none — verification only

- [ ] **Step 1: Resize preview to tablet landscape**

Use the preview tool to resize to 1366×800 (approximates Tab S8 landscape).

- [ ] **Step 2: Run the full happy path**

1. Open `#/home` — two huge tiles render, gear visible, gallery pill visible. Console clean.
2. Tap "Connect the Dots" → picker shows with difficulty + categories + grid.
3. Tap any vehicle → dots screen loads with numbered dots.
4. Drag a line from dot 1 through to the end → snaps occur, voice says picture name on completion, action row appears.
5. Tap ⭐ Save → button shows ✓.
6. Tap 🏠 Home → back at home.
7. Tap "Colour" → picker (no difficulty row) → pick same picture → paint with finger → change colour → change brush size → undo → save.
8. Open `#/gallery` → both saved pictures visible. Tap one → lightbox. Long-press → delete confirm → delete works.
9. Open `#/parent` → enter `1234` → settings menu shows. Toggle Sound → audio module updates. Tap "Add photo as colouring page" → upload + threshold flow → save → user photo appears in colour picker.

- [ ] **Step 3: Capture screenshots for the user**

Use the preview tool to screenshot:
- The home screen
- Connect-the-dots mid-drag (a few dots completed)
- Colouring screen with a few brushstrokes
- Gallery with at least 2 saved items

Send these to the user as the demo.

- [ ] **Step 4: Code review pass — confirm escape-html discipline**

```bash
# Every place that injects template literals from picture/user data must use escapeHtml.
# Quick audit:
grep -rn "\${.*name" src/js/screens/ | grep -v escapeHtml
grep -rn "\${.*outlineDataUrl" src/js/screens/ | grep -v escapeHtml
grep -rn "\${.*dataUrl" src/js/screens/ | grep -v escapeHtml
```

Expected: no matches (anything that surfaces is a missed escape).

- [ ] **Step 5: Fix anything that broke**

Likely culprits: race conditions in screen rendering, `pointercancel` not stopping audio, picture viewBox mismatches, missing escape calls. Patch inline. After each fix, re-run the smoke path from Step 2.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: smoke-test corrections"
```

---

## Task 22: Final polish + tablet-install instructions — sequential

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append tablet-install instructions to README.md**

```markdown
## Install on Samsung Tab S8

1. On your dev machine, run:
   ```
   bunx serve src -p 5173 --host 0.0.0.0
   ```
2. Note the LAN IP (e.g. `http://192.168.1.50:5173`).
3. On the Tab S8, open Samsung Internet (or Chrome) → that URL.
4. Menu → "Add to Home screen" → confirm. The icon appears on the home screen.
5. Open from the icon → app runs fullscreen, landscape, fully offline thereafter.

## Hosting (recommended)

To avoid keeping the dev machine on:
- **Netlify Drop**: drag the `src/` folder into https://app.netlify.com/drop. Free, HTTPS, ~10s.
- **GitHub Pages**: push `src/` to a repo, enable Pages on the branch.

Once installed via the hosted URL, the service worker keeps a full offline copy.

## Updating the picture set

Edit `scripts/picture-list.json`, then run `bun run generate`. Only new entries are generated; existing ones are skipped. Bump the `CACHE` version string in `src/sw.js` after adding pictures so installed apps refresh.
```

- [ ] **Step 2: Run the full smoke test from Task 21 again**

Verify nothing regressed.

- [ ] **Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: tablet install + hosting + update instructions"
```

---

## Self-review checklist (run after Task 22)

- [ ] Every spec section has at least one corresponding task. Cross-check against `docs/superpowers/specs/2026-05-12-colouring-and-dot-game-design.md`.
- [ ] No "TBD", "TODO", or "implement later" in any task file.
- [ ] Method signatures referenced across tasks match (`tryStart`, `move`, `lift`, `getSettings`, etc.).
- [ ] All user-controlled string interpolations go through `escapeHtml()`.
- [ ] All audio/voice respects `storage.getSettings()` toggles.
- [ ] Service worker `PRECACHE` list includes every shipped JS/CSS/JSON file.

If any item fails, fix inline.
