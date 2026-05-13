# DotPaint — Content Tasks (14–17)

> Companion file to [2026-05-12-dotpaint.md](2026-05-12-dotpaint.md).

---

## Task 14: Picture-list curation (200 entries)

**Files:**
- Create: `scripts/picture-list.json`

The file is purely data: `[{ id, name, category, prompt }, …]` with 100 vehicles, 50 animals, 30 dinosaurs, 10 food, 10 other. The `prompt` is a one-sentence cartoon description. The `id` is kebab-case and unique.

- [ ] **Step 1: Decide on the full list**

Use the lists in spec §8.1 as the canonical inventory. Since hand-typing 200 entries is tedious, dispatch a subagent with this exact prompt:

> "Generate a JSON array of exactly 200 entries for a kids' colouring app. Schema per entry: `{ "id": "kebab-case", "name": "Title Case", "category": "vehicles|animals|dinosaurs|food|other", "prompt": "A child-friendly cartoon <thing> in <pose>, <key features>." }`. Counts: 100 vehicles (must include all of: cars, trucks, fire truck, ambulance, police car, school bus, garbage truck, ice cream truck, taxi, train, helicopter, plane, boat, submarine, motorcycle, bicycle, scooter, tractor, excavator, bulldozer, dump truck, crane, cement mixer, forklift, steamroller, snow plow, road roller, backhoe loader, skid-steer, telehandler, asphalt paver, monster truck, race car, hot rod, jeep, RV, food truck, mail truck, tow truck, fuel tanker, semi-truck, golf cart, formula car, mining truck, harvester, combine, plough, log truck, container ship, fishing boat, ferry, jet ski, hovercraft, sailboat, hot-air balloon, blimp, spaceship, rocket, drone, segway, skateboard, monorail, cable car, gondola, tram — fill remaining with similar age-appropriate vehicles), 50 animals, 30 dinosaurs, 10 food, 10 other (sun, moon, star, rocket, robot, castle, house, balloon, flower, tree). All ids must be unique. Output ONLY the JSON array, no commentary."

Save the result to `scripts/picture-list.json`.

- [ ] **Step 2: Validate**

```bash
bun -e "
const d = await Bun.file('scripts/picture-list.json').json();
console.log('total:', d.length);
const cats = {}; d.forEach(p => cats[p.category] = (cats[p.category]||0)+1);
console.log(cats);
const ids = new Set(d.map(p=>p.id));
console.log('unique ids:', ids.size);
const missing = d.filter(p => !p.id || !p.name || !p.category || !p.prompt);
console.log('missing fields:', missing.length);
"
```

Expected: `total: 200`, `{ vehicles: 100, animals: 50, dinosaurs: 30, food: 10, other: 10 }`, `unique ids: 200`, `missing fields: 0`.

If any check fails, fix the entries inline and re-validate.

- [ ] **Step 3: Commit**

```bash
git add scripts/picture-list.json
git commit -m "data: 200-picture curation list (100 vehicles, 50 animals, 30 dinos, 20 misc)"
```

---

## Task 15: Picture-generation script

**Files:**
- Create: `scripts/generate-pictures.mjs`
- Create: `.env.example`

- [ ] **Step 1: Write the generator**

```js
// scripts/generate-pictures.mjs
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
const PROJECT  = path.resolve(ROOT, '..');
const LIST     = path.join(PROJECT, 'scripts/picture-list.json');
const CACHE    = path.join(PROJECT, 'scripts/cache');
const OUT_DIR  = path.join(PROJECT, 'src/assets/pictures');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

const SYSTEM = `You are an SVG illustrator for a 5-year-old's connect-the-dots and colouring app. Always respond with valid JSON only.`;

const PROMPT = (entry) => `Generate a child-friendly cartoon SVG of: ${entry.prompt}

Constraints:
- viewBox: "0 0 400 300"
- Two groups in the SVG:
    <g id="outline"> ... </g>   - bold black strokes only (3px), no fills
    <g id="fill">    ... </g>   - same shapes filled with bright kid-friendly colours, no strokes
- Use <path>, <circle>, <rect>, <polygon> only. No <text>, no <image>, no external refs.
- Keep total path count under 12.
- The outline must form a recognisable silhouette of "${entry.name}".

Then provide three arrays of (x,y) integer coordinates sampled along the primary silhouette in the order a child would draw it (one continuous loop):
- "easy":   exactly 10 points
- "medium": exactly 20 points
- "hard":   exactly 40 points
All coordinates must be inside 0..400 / 0..300.

Respond with this exact JSON shape:
{ "svg": "<svg ...>...</svg>", "dotsByLevel": { "easy": [[x,y],...], "medium": [...], "hard": [...] } }`;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function ensureDirs() {
  await fs.mkdir(CACHE, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
}
async function loadManifest() {
  try { return JSON.parse(await fs.readFile(MANIFEST, 'utf8')); } catch { return []; }
}
async function saveManifest(m) {
  await fs.writeFile(MANIFEST, JSON.stringify(m, null, 2));
}

async function generateOne(entry) {
  const cachePath = path.join(CACHE, `${entry.id}.json`);
  try { return JSON.parse(await fs.readFile(cachePath, 'utf8')); } catch {}

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM,
    messages: [{ role: 'user', content: PROMPT(entry) }],
  });
  const text = res.content.map(c => c.text || '').join('').trim();
  const cleaned = text.replace(/^```json\n?|```\n?$/g, '');
  const parsed = JSON.parse(cleaned);
  await fs.writeFile(cachePath, JSON.stringify(parsed, null, 2));
  return parsed;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: set ANTHROPIC_API_KEY in .env');
    process.exit(1);
  }
  await ensureDirs();
  const list = JSON.parse(await fs.readFile(LIST, 'utf8'));
  const manifest = await loadManifest();
  const done = new Set(manifest.map(m => m.id));

  let usd = 0;
  for (const entry of list) {
    if (done.has(entry.id)) { console.log('skip', entry.id); continue; }
    try {
      console.log('gen ', entry.id);
      const result = await generateOne(entry);
      const svgPath = path.join(OUT_DIR, `${entry.id}.svg`);
      await fs.writeFile(svgPath, result.svg);
      manifest.push({
        id: entry.id, name: entry.name, category: entry.category,
        svg: `${entry.id}.svg`, dotsByLevel: result.dotsByLevel,
      });
      await saveManifest(manifest);
      usd += 0.04;
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      console.error('FAIL', entry.id, e.message);
    }
  }
  console.log(`done. estimated cost: $${usd.toFixed(2)} USD ≈ MYR ${(usd * 4.7).toFixed(0)}`);
}
main();
```

- [ ] **Step 2: Write .env.example**

```
ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 3: Smoke-test on a single entry**

Save a one-entry list to `scripts/picture-list-test.json`:

```json
[{ "id":"test-truck", "name":"Truck", "category":"vehicles", "prompt":"A red cartoon truck, side view, two visible wheels, blue cabin window." }]
```

Temporarily edit `LIST` in the script to point to this test file and run:

```bash
ANTHROPIC_API_KEY=$your_key bun run generate
```

Expected: `src/assets/pictures/test-truck.svg` created. Open it in the preview tab — should look like a truck. Manifest contains the test entry with `dotsByLevel`.

- [ ] **Step 4: Clean up**

Restore `LIST` to point at `picture-list.json`. Delete `scripts/picture-list-test.json`, the test SVG, and the test manifest entry.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-pictures.mjs .env.example
git commit -m "feat(scripts): picture generation pipeline (Claude API → SVG + dots)"
```

---

## Task 16: Run picture generation — sequential

**Files:**
- Modify: `src/assets/pictures/manifest.json`
- Modify: `src/assets/pictures/*.svg`

- [ ] **Step 1: Run the full generation**

```bash
ANTHROPIC_API_KEY=$your_key bun run generate
```

Expected runtime: 15–25 minutes (200 calls × ~5s + 250ms sleep). Watch for `FAIL` lines — recoverable; rerun to retry only the failed entries (cache + manifest dedupe handle the rest).

- [ ] **Step 2: Validate the output**

```bash
bun -e "
const m = await Bun.file('src/assets/pictures/manifest.json').json();
console.log('total pictures:', m.length);
const cats = {}; m.forEach(p => cats[p.category] = (cats[p.category]||0)+1);
console.log(cats);
let bad = 0;
for (const p of m) {
  if (!Array.isArray(p.dotsByLevel?.easy)   || p.dotsByLevel.easy.length   !== 10) { console.log('bad easy:', p.id); bad++; }
  if (!Array.isArray(p.dotsByLevel?.medium) || p.dotsByLevel.medium.length !== 20) { console.log('bad medium:', p.id); bad++; }
  if (!Array.isArray(p.dotsByLevel?.hard)   || p.dotsByLevel.hard.length   !== 40) { console.log('bad hard:', p.id); bad++; }
}
console.log('bad entries:', bad);
"
```

Expected: 200 pictures, correct category counts, 0 bad entries. If any are bad, delete their cache + manifest entry + svg and rerun the script.

- [ ] **Step 3: Report cost**

After the run finishes, capture the printed total cost. If it exceeds MYR 100, stop and confer with the user.

- [ ] **Step 4: Decide on git inclusion**

By default `.gitignore` (Task 1) excludes the pictures (regenerable, 200 files). If the user wants them in git for distribution, override:

```bash
git add -f src/assets/pictures
git commit -m "data: 200 generated pictures + manifest"
```

---

## Task 17: Picture preview / cull tool

**Files:**
- Create: `scripts/preview-pictures.html`

- [ ] **Step 1: Write the preview tool**

Uses `insertAdjacentHTML` (no direct innerHTML assignment) to populate the grid:

```html
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Picture preview</title>
<style>
  body{font-family:sans-serif;background:#fafafa;padding:20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  .card{background:white;border:1px solid #ddd;border-radius:8px;padding:8px}
  .card object{width:100%;height:120px}
  .name{font-size:12px;color:#555;text-align:center;margin-top:4px}
  .cat{font-size:10px;color:#999;text-align:center}
  .filter{margin-bottom:16px}
</style>
</head><body>
<div class="filter">Filter: <select id="cat"><option value="">all</option></select></div>
<div class="grid" id="grid"></div>
<script>
(async () => {
  const m = await fetch('../src/assets/pictures/manifest.json').then(r=>r.json());
  const cats = [...new Set(m.map(p => p.category))];
  const sel = document.getElementById('cat');
  cats.forEach(c => sel.insertAdjacentHTML('beforeend', '<option>' + c + '</option>'));

  const render = (filter) => {
    const filtered = filter ? m.filter(p => p.category === filter) : m;
    const grid = document.getElementById('grid');
    grid.replaceChildren();
    filtered.forEach(p => {
      grid.insertAdjacentHTML('beforeend',
        '<div class="card">' +
          '<object data="../src/assets/pictures/' + p.svg + '" type="image/svg+xml"></object>' +
          '<div class="name">' + p.name + '</div>' +
          '<div class="cat">' + p.category + ' · ' + p.id + '</div>' +
        '</div>');
    });
  };
  sel.onchange = e => render(e.target.value);
  render('');
})();
</script>
</body></html>
```

- [ ] **Step 2: Open in preview**

Open `scripts/preview-pictures.html` in the preview tab. Scroll all 200 pictures. Note IDs of any duds (unrecognisable, off-brand, broken SVG) into `scripts/dud-list.txt`, one per line.

- [ ] **Step 3: Regenerate duds**

```bash
for id in $(cat scripts/dud-list.txt); do
  rm -f scripts/cache/$id.json src/assets/pictures/$id.svg
done
# Edit src/assets/pictures/manifest.json to drop the dud entries, then:
bun run generate
```

Repeat preview + cull as needed.

- [ ] **Step 4: Commit the preview tool**

```bash
git add scripts/preview-pictures.html
git commit -m "tool: html grid for visually reviewing all 200 generated pictures"
```
