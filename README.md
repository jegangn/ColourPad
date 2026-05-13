# DotPaint

Finger-painting colouring PWA for a 5-year-old, built for Samsung Tab S8 landscape.

## What's inside

- **One game**: pick a picture → colour it with your finger.
- **200 built-in outlines**: 100 vehicles (incl. construction & machinery), 50 animals, 30 dinosaurs, 10 food, 10 misc. Each is a side-view cartoon SVG with a stroke-only outline ready to paint over.
- **Add-your-own photos** (parent area) → auto-converted to colouring outlines via Sobel edge detection.
- **8-colour palette + eraser, 3 brush sizes, undo, clear, save to gallery.**
- **Fully offline PWA** after first install — service worker caches everything.
- **Voice + sound effects**: brush whoosh while painting, picture name spoken on completion. Toggle in parent area.
- **Save to gallery** on tap (never automatic). Long-press a gallery item to delete.

## Dev

```
bun install
bun dev          # serves src/ at http://localhost:5173
bun test         # runs unit tests
```

## Install on Samsung Tab S8

1. On your dev machine, expose the LAN:
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
- **Cloudflare Pages**: free, custom domain, instant global edge cache.

Once installed via the hosted URL, the service worker keeps a full offline copy.

## Updating the picture set

The 200 pictures live as committed SVGs in `src/assets/pictures/`. To add more:

1. Drop a new outline SVG at `src/assets/pictures/{id}.svg`. The file should be a `viewBox="0 0 400 300"` SVG with two groups: `<g id="fill">` (filled shapes — used as the "answer" if you ever want to show it) and `<g id="outline">` (stroke-only — what the child paints over).
2. Append a matching entry to `src/assets/pictures/manifest.json`:
   ```json
   { "id": "rocket", "name": "Rocket", "category": "vehicles", "svg": "rocket.svg" }
   ```
3. Bump the `CACHE` version string in `src/sw.js` so installed apps refresh.

## Parent area

Default PIN: `1234`. Change it in the parent area. Settings: sound on/off, voice on/off, hint on/off, manage gallery, add custom photos.

## Tech

- Vanilla JS ES modules, no framework, no build step.
- Bun for dev server + tests.
- localStorage for settings/gallery/photos. SHA-256 for the PIN hash.
- Web Audio API + SpeechSynthesis. Canvas 2D for finger painting.
- Hash-based router. Service worker for offline.
