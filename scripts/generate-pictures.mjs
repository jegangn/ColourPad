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
