# DotPaint — Connect-the-Dots & Colouring PWA for a 5-year-old

**Date:** 2026-05-12
**Status:** Draft for user review
**Working name:** DotPaint (final name TBD by user)

## 1. Overview

A web-based, installable kids' app for a 5-year-old to play **connect-the-dots** and **finger-painting colouring** on a Samsung Tab S8 in landscape. Runs offline once installed. Two separate games picked from a home screen. 200 built-in pictures (half vehicles/construction). Parent can add photos that get auto-traced into colouring outlines.

### 1.1 Goals
- Single tap to launch from the home screen
- Zero text-reading required for the child to use the app
- Works offline indefinitely
- Total content cost ≤ MYR 50

### 1.2 Non-goals
- Multi-user profiles
- Cloud sync / accounts
- Sharing / printing (deliberately cut for v1)
- Generated dot puzzles from user photos (unreliable; cut)
- Multi-language UI (English only)

## 2. Target environment

- **Device:** Samsung Galaxy Tab S8 (11" / 2560×1600)
- **Orientation:** Landscape only (locked via PWA manifest)
- **Input:** Finger-only (no S Pen)
- **Browser:** Samsung Internet or Chrome on Android, installed as PWA → fullscreen, no browser chrome
- **Network:** Required only at install time. Fully offline thereafter.

## 3. UX flow

```
Home → [Connect-the-Dots] → Difficulty picker → Picture grid → Puzzle → Done screen
                                                                          ↓ (Save / Try another / Home)
Home → [Colour] → Picture grid → Colouring canvas → Done screen
                                                          ↓ (Save / Try another / Home)
Home → [My Gallery] → Saved snapshots
Home → [⚙ Parent] → 4-digit PIN → Settings + Add Photo + Manage Gallery
```

### 3.1 Home screen
Two enormous claymorphic tiles fill the landscape canvas:
- 🔗 **Connect the Dots** (left, blue gradient)
- 🎨 **Colour** (right, orange gradient)

Below: small "🖼 My Gallery" pill. Top-right: small "⚙" gear (parent area).

### 3.2 Picture picker
- **Difficulty row** (Connect-the-Dots only): three pill buttons — Easy 10 / Medium 20 / Hard 40 dots
- **Category chips**: Vehicles, Animals, Dinosaurs, Food, Other
- **Grid**: 4×3 thumbnails per page on Tab S8 landscape, swipe left/right to paginate
- Tap a thumbnail to open the puzzle/canvas

### 3.3 Connect-the-dots — drag-a-line mechanic
- Faint dashed outline shown at low opacity as a nudge (toggle in parent settings)
- Numbered dots overlaid; dot 1 has a soft pulsing ring
- **Press dot 1** to start the drag
- As finger moves, polyline trails the finger
- When finger comes within **30px of the next-in-sequence dot**, that dot snaps: turns green, soft chime, line locks in, next dot starts pulsing
- Wrong-direction drift toward a non-sequence dot = no effect (no penalty buzz)
- **Lifting finger** mid-puzzle = pause. Trail freezes at last completed dot. Resume by pressing that dot again.
- On completion: trail fades, the **fully coloured picture** reveals, voice says the picture name (e.g. "Excavator!")
- Bottom action row appears: ⭐Save · Try another · 🏠Home

### 3.4 Colouring — finger paint mechanic
- SVG outline rendered as background
- HTML `<canvas>` overlay receives finger paint strokes
- Outline drawn on a second canvas above the paint canvas (so paint sits "behind" the lines visually)
- Bottom palette: 8 colour swatches + 1 eraser + 3 brush-size buttons
- Top corner: ↶ Undo (last stroke) · 🗑 Clear (with confirm) · ⭐ Save
- Brush whoosh sound while finger is down

### 3.5 Done screen / save
- Final picture shown briefly with voice naming
- Three buttons: ⭐ Save (one tap → goes to gallery) · Try another · 🏠 Home
- **Nothing saves automatically** — only on ⭐ tap

### 3.6 Gallery
- Grid of saved snapshots (4×3 per page on Tab S8)
- Tap to view full-size; long-press for delete confirm
- Empty state: friendly copy explaining "tap ⭐ to save"

### 3.7 Parent area
- Gated by **4-digit PIN** (default `1234`, changeable inside)
- PIN keypad: 3×4 numeric, big buttons, dot-row indicator
- Menu items:
  - 📷 Add photo as colouring page
  - 🖼 Manage gallery
  - 🔢 Change PIN
  - 👻 Faint outline hint (toggle)
  - 🔊 Sound effects (toggle)
  - 🗣 Voice naming (toggle)
  - 📊 Stats (total pictures completed across both modes)

### 3.8 Add-photo flow
- File picker (`<input type="file" accept="image/*">`)
- Browser-side edge detection (Sobel + threshold on a canvas) → outline preview
- Side-by-side: original photo + generated outline
- Confirm → adds to colouring picker only (NOT dot puzzles), with a 📷 badge

## 4. Visual design

### 4.1 Style: Claymorphism
- Chunky 3D rounded shapes (16–24px border radius)
- Thick borders (3–4px) in a slightly darker shade of the fill
- Soft inner + outer shadows (no hard lines)
- 200ms ease-out on press (subtle scale 0.97)
- "Toy-like, bubbly, playful" — never dark-dashboard.

### 4.2 Brand palette (UI chrome)
| Role | Hex |
|------|-----|
| Background | `#FFF7ED` (warm cream) |
| Primary | `#F97316` (warm orange) |
| Secondary | `#FB923C` |
| Accent / CTA | `#2563EB` |
| Foreground (text on cream) | `#9A3412` |
| Border | `#FED7AA` |
| Muted | `#F1F0F0` |
| Destructive (parent only) | `#DC2626` |

### 4.3 Paint palette (the 8 colours the child paints with — distinct from UI chrome)
| Name | Hex |
|------|-----|
| Red | `#E63946` |
| Orange | `#F97316` |
| Yellow | `#FFD166` |
| Green | `#06D6A0` |
| Blue | `#118AB2` |
| Purple | `#7B2CBF` |
| Brown | `#8B5E3C` |
| Black | `#1F1F1F` |
| (Eraser — visually a white circle with a slash) | n/a |

### 4.4 Typography
- **Display / buttons:** Baloo 2 (700)
- **Body / labels:** Comic Neue (400, 700)
- Font sizes: title 32px, button 24px, body 18px, label 14px
- Loaded via Google Fonts with `display: swap`

### 4.5 Touch targets
- Minimum 60×60px (well above 44pt minimum for a 5yo's finger margin)
- 12px gap between adjacent tappable elements
- Press feedback: 0.97 scale + ripple shadow shift, 200ms

## 5. Architecture

### 5.1 Stack
- **Static PWA** — vanilla HTML / CSS / JS, no framework, no build step
- **Bun** for the dev server only (`bunx serve`)
- **Service worker** for offline caching + install
- **localStorage** for state (gallery, settings, user photos)
- **Web Audio API** for synthesised chime + brush whoosh
- **SpeechSynthesis API** for voice naming
- **Canvas 2D API** for paint and edge detection

Rationale: zero build step keeps debugging trivial for the non-coding owner; vanilla JS scales fine for ~10 screens; PWA install gives a native-feel home-screen icon without a Play Store listing.

### 5.2 File layout
```
colouring and dot game/
├── src/
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── css/
│   │   ├── tokens.css       (colours, fonts, spacing — single source of truth)
│   │   ├── components.css   (claymorphic buttons, tiles, swatches)
│   │   └── screens.css
│   ├── js/
│   │   ├── app.js           (router + global state)
│   │   ├── screens/
│   │   │   ├── home.js
│   │   │   ├── picker.js
│   │   │   ├── dots.js
│   │   │   ├── colour.js
│   │   │   ├── gallery.js
│   │   │   └── parent.js
│   │   └── lib/
│   │       ├── audio.js          (chime, whoosh)
│   │       ├── voice.js          (SpeechSynthesis wrapper)
│   │       ├── storage.js        (localStorage abstraction)
│   │       ├── paint.js          (canvas painting + undo stack)
│   │       ├── dots.js           (drag-a-line state machine)
│   │       └── photo-to-outline.js   (Sobel edge detection)
│   ├── assets/
│   │   ├── pictures/
│   │   │   ├── manifest.json     (id, name, category, dot positions)
│   │   │   └── *.svg             (~200 files)
│   │   └── icons/
│   │       └── icon-{192,512}.png
├── scripts/
│   ├── generate-pictures.mjs     (one-shot AI generation)
│   └── picture-list.json         (200 entries: id, name, category, prompt)
├── mockups/                      (existing brainstorm mockups, kept for reference)
├── docs/superpowers/specs/       (this doc)
└── .claude/launch.json
```

### 5.3 Picture data format
Each picture is a single SVG file plus an entry in `manifest.json`:
```json
{
  "id": "excavator",
  "name": "Excavator",
  "category": "vehicles",
  "svg": "excavator.svg",
  "dotsByLevel": {
    "easy":   [[60,170],[100,100],[160,95],...],   // 10 points
    "medium": [...],                                  // 20 points
    "hard":   [...]                                   // 40 points
  }
}
```

The SVG is rendered as the **outline-only** version on the dots screen and the **fully coloured** version on the reveal + colouring screen. To support both modes from a single asset, each SVG contains:
- An `id="outline"` group with stroke-only paths
- An `id="fill"` group with the coloured fills (hidden until reveal / shown on the colouring page beneath the paint canvas)

### 5.4 State management
- Single global `app.state` object: `{ screen, mode, currentPicture, currentLevel, settings, gallery, userPhotos }`
- Hash-based router: `#/home`, `#/picker/dots`, `#/dots/excavator/medium`, `#/colour/firetruck`, `#/gallery`, `#/parent`
- Hash routes make deep linking + back button work for free

### 5.5 Storage schema (localStorage)
- `dotpaint.settings` → `{ pinHash, soundOn, voiceOn, hintOn }`
- `dotpaint.gallery` → `[{ id, dataUrl, savedAt, mode }]` (PNG snapshots, base64)
- `dotpaint.userPhotos` → `[{ id, name, outlineDataUrl, addedAt }]` (PNG data URL produced by §7)

Budget: localStorage allows ~5MB. PNG snapshots ~30–80KB each → 50+ saves comfortably. Will warn parent at ~80% capacity in the gallery manager.

### 5.6 PWA manifest highlights
```json
{
  "name": "DotPaint",
  "short_name": "DotPaint",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#FFF7ED",
  "theme_color": "#F97316",
  "start_url": "./",
  "icons": [...]
}
```

### 5.7 Service worker strategy
- **Pre-cache** at install: HTML, CSS, JS, all 200 SVGs, manifest, icons
- **Cache-first** runtime for everything in the precache
- **No network fetches** at runtime once installed (the app has no remote dependencies)

## 6. Audio

### 6.1 Chime (per dot snap)
- Web Audio: sine oscillator at 660 Hz, 80ms attack/decay envelope, 0.15 gain
- No external mp3 — cheap, latency-free

### 6.2 Brush whoosh
- Filtered white noise (low-pass at 800 Hz), gain 0.05
- One persistent noise node started at app boot; gain is 0.05 while pointer is down, ramped to 0 on pointerup. No per-move triggering — this avoids click artefacts.

### 6.3 Voice
- `SpeechSynthesisUtterance(picture.name)` on reveal
- Pick the first available voice matching `lang === 'en'` and `name` containing "child" or "female" if available, else default
- Quality varies per device — fallback: silent reveal with the picture name shown big in the centre

All audio respects the parent **Sound** + **Voice** toggles.

## 7. Photo → outline pipeline

### 7.1 Algorithm
1. Load image into an offscreen canvas, resize longest edge to 800px
2. Convert to greyscale
3. Apply 3×3 Gaussian blur to denoise
4. Run Sobel filter for edge magnitudes
5. Threshold (default 100, adjustable in a slider on the preview screen)
6. Output: black outlines on white background as a PNG → store as base64

### 7.2 Limitations (surfaced to parent)
- Works best with high-contrast photos (toys on plain backgrounds)
- Busy backgrounds = noisy outlines
- Threshold slider lets parent fine-tune before saving
- No SVG vectorisation; output is raster — that's fine for colouring (just needs an outline image)

## 8. Content generation pipeline

### 8.1 200-picture spec
- **Vehicles & construction (100):** cars, trucks, fire truck, ambulance, police car, school bus, garbage truck, ice cream truck, taxi, train, helicopter, plane, boat, submarine, motorcycle, bicycle, scooter, tractor, **excavator, bulldozer, dump truck, crane, cement mixer, forklift, steamroller, snow plow, road roller, backhoe loader, skid-steer, telehandler, asphalt paver,** monster truck, race car, hot rod, jeep, RV, food truck, mail truck, tow truck, fuel tanker, semi-truck, golf cart, formula car, mining truck, harvester, combine, plough, log truck, container ship, fishing boat, ferry, jet ski, hovercraft, sailboat, hot-air balloon, blimp, spaceship, rocket, drone, segway, skateboard, monorail, cable car, gondola, tram… (final 100 listed in `picture-list.json`)
- **Animals (50):** cat, dog, lion, tiger, elephant, giraffe, monkey, bear, wolf, fox, rabbit, deer, horse, cow, pig, sheep, goat, chicken, duck, owl, eagle, parrot, penguin, fish, dolphin, whale, shark, turtle, crab, octopus, frog, snake, butterfly, bee, ladybug, spider, kangaroo, koala, panda, hippo, rhino, zebra, camel, peacock, swan, hedgehog, squirrel, raccoon, bat, jellyfish
- **Dinosaurs (30):** T-Rex, triceratops, brontosaurus, stegosaurus, velociraptor, pterodactyl, brachiosaurus, ankylosaurus, parasaurolophus, spinosaurus, diplodocus, allosaurus, iguanodon, dimetrodon, plesiosaurus, mosasaurus, archaeopteryx, gallimimus, oviraptor, dilophosaurus, carnotaurus, baryonyx, kentrosaurus, pachycephalosaurus, compsognathus, microraptor, therizinosaurus, gigantosaurus, troodon, megalodon
- **Food (10):** apple, banana, ice cream cone, pizza slice, cupcake, donut, watermelon slice, hot dog, hamburger, stack of pancakes
- **Other (10):** tree, sun, star, moon, rocket, robot, castle, house, balloon bunch, flower

### 8.2 Generation script (`scripts/generate-pictures.mjs`)
- Reads `picture-list.json`
- For each entry, calls Claude API (`claude-sonnet-4-6`) with a prompt:
  > "Generate a clean, child-friendly SVG of [thing] in a 400×300 viewBox. Output a single SVG file containing two groups: `<g id="outline">` with stroke-only paths (3px, no fills), and `<g id="fill">` with the same shapes filled in bright child-friendly colours (used as the reveal). Then output three arrays of (x,y) coordinates sampled along the primary silhouette: 10 points (easy), 20 points (medium), 40 points (hard). Coordinates must be ordered to trace the silhouette in a single drawable path. Return as JSON: `{ svg, dotsByLevel: { easy, medium, hard } }`."
- Parses JSON response → writes `assets/pictures/{id}.svg` and updates `manifest.json`
- **Resumable** — skips entries already in the manifest, so reruns are safe
- **Rate-limited** — sleeps 200ms between calls to avoid bursts
- **Caches raw responses** in `scripts/cache/{id}.json` for debug

### 8.3 Cost projection
- Per call: ~600 input tokens + ~2,500 output tokens
- Sonnet 4.6: $3/M in, $15/M out → ~$0.04/picture
- 200 pictures: ~$8 USD ≈ **MYR 38**
- Pre-authorised by user; will report actual cost after run

### 8.4 Quality control
- After generation: render every SVG into a small HTML index page
- Manual scroll-through (~30 min) to flag duds → mark in `picture-list.json` for regeneration
- Acceptance criterion: silhouette is recognisable at a glance to an adult

## 9. Out-of-scope (v1)
- Cloud sync of gallery
- Sharing or print-to-PDF
- Generated dot puzzles from photos
- Per-child profiles
- In-app analytics
- Translations

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| AI-generated SVGs look childish/off | Manual cull; regenerate flagged duds; second pass with image-gen+vector-trace if Claude SVGs disappoint |
| Voice quality varies per Android device | Fallback to silent reveal with big text label; toggleable in parent settings |
| Photo edge detection produces noisy outlines | Threshold slider; clear guidance to use plain-background photos |
| localStorage fills up | Capacity warning at 80%; gallery manager allows bulk delete |
| PWA install fails on Samsung Internet | Test path documented; fallback to desktop-shortcut bookmark |
| Claude API generation cost overruns | Budget cap at MYR 100; pause and surface to user if exceeded |

## 11. Implementation strategy (build phase)

The user has flagged that **multiple agents in parallel** are preferred for the build. Independent units suitable for parallel subagent dispatch:

1. **Picture generation pipeline** (`scripts/generate-pictures.mjs` + run)
2. **Design tokens + claymorphic component CSS** (foundation; runs first)
3. **Home + Picker screens**
4. **Connect-the-Dots screen** (drag-a-line state machine)
5. **Colouring screen** (paint canvas + undo stack)
6. **Gallery + storage layer**
7. **Parent area + PIN gate + photo→outline**
8. **PWA shell** (manifest, service worker, install flow)
9. **Audio + voice modules**

Dependencies:
- (2) before (3)–(7) — they all import the design tokens
- (1) does not block screens but blocks the final tablet test; can run in parallel with everything
- (8) can run last
- (9) is consumed by (4) and (5)

The full implementation plan with task ordering, agent assignments, and review checkpoints will be produced by the `writing-plans` skill after this spec is approved.

## 12. Cost summary

| Item | Cost |
|------|------|
| AI picture generation | ~MYR 38 (one-time) |
| Photo edge detection | Free (browser-side) |
| Hosting (GitHub Pages or Netlify) | Free |
| **Total** | **~MYR 38** |
