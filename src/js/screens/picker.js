// src/js/screens/picker.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { render, escapeHtml } from '../lib/render.js';
import { icon } from '../lib/icons.js';

// Category order = order shown in the picker chip row.
// Icon picks one chip-friendly glyph; the count is computed from the manifest.
const CATEGORY_META = [
  { key: 'all',          label: 'All',          iconName: 'squares' },
  { key: 'vehicles',     label: 'Vehicles',     iconName: 'truck' },
  { key: 'fire',         label: 'Fire',         iconName: 'fire' },
  { key: 'construction', label: 'Construction', iconName: 'wrench' },
  { key: 'trains',       label: 'Trains',       iconName: 'train' },
  { key: 'aircraft',     label: 'Aircraft',     iconName: 'paperAirplane' },
  { key: 'boats',        label: 'Boats',        iconName: 'anchorIcon' },
  { key: 'space',        label: 'Space',        iconName: 'rocket' },
  { key: 'robots',       label: 'Robots',       iconName: 'cpuChip' },
  { key: 'buildings',    label: 'Buildings',    iconName: 'buildingOffice' },
  { key: 'mine',         label: 'My Photos',    iconName: 'camera' },
];

let currentCategory = 'all';
let manifestPromise = null;
// Per-session shuffle: same order across tab switches (so the user's
// scroll position feels stable), but freshly randomized on each app
// open / reload. Mixes categories together in the "All" tab — vehicle,
// then space, then construction, etc. — rather than grouping by type.
let shuffleSeed = Math.random();

function fisherYates(arr, rng) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Mulberry32 — tiny, fast seeded RNG so the order stays the same
// across re-renders within a session (tab switches don't reshuffle).
function seededRng(seed) {
  let t = Math.floor(seed * 2 ** 32) >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function loadManifest() {
  manifestPromise ??= fetch('./assets/pictures/manifest.json').then(r => r.json());
  return manifestPromise;
}

export async function renderPicker(root) {
  const all = await loadManifest();
  const userPhotos = storage.getUserPhotos();

  const items = [
    ...all,
    ...userPhotos.map(p => ({
      id: p.id, name: p.name, category: 'mine',
      outlineDataUrl: p.outlineDataUrl,
    })),
  ];

  // Shuffle the full set once per session (seeded), so:
  //  - "All" tab mixes categories instead of grouping (vehicle, space, fire, ...)
  //  - Tab-specific views still appear in randomized order within the category
  //  - Switching tabs and coming back keeps the same order (no jarring re-shuffle)
  const shuffled = fisherYates(items, seededRng(shuffleSeed));

  const filtered = currentCategory === 'all'
    ? shuffled
    : shuffled.filter(p => p.category === currentCategory);

  // Build chip row, hiding "My Photos" when there aren't any
  const chips = CATEGORY_META
    .filter(c => c.key !== 'mine' || userPhotos.length > 0)
    .map(c => {
      const isActive = currentCategory === c.key;
      return `
        <button class="pill small ${isActive ? 'primary' : ''}"
                data-category="${c.key}" aria-pressed="${isActive}">
          ${icon(c.iconName, 18)}
          <span>${c.label}</span>
        </button>
      `;
    }).join('');

  const thumbsHtml = filtered.map(p => {
    const inner = p.outlineDataUrl
      ? `<img src="${escapeHtml(p.outlineDataUrl)}" alt="${escapeHtml(p.name)}">`
      : `<object data="./assets/pictures/${escapeHtml(p.id)}.svg" type="image/svg+xml" style="pointer-events:none"></object>`;
    const badge = p.category === 'mine' ? `<span class="badge">${icon('camera', 11)}</span>` : '';
    // div + role="button" instead of <button>: native <button> intrinsic
    // sizing collapses inside CSS grid (image + title overflow the button's
    // 6px border-only height), even with display:grid set on the button.
    return `
      <div class="thumb" data-pic="${escapeHtml(p.id)}" role="button" tabindex="0" aria-label="${escapeHtml(p.name)}">
        <div class="image">${inner}${badge}</div>
        <div class="title">${escapeHtml(p.name)}</div>
      </div>
    `;
  }).join('');

  const body = filtered.length === 0
    ? `<div class="empty">No pictures in this category yet.</div>`
    : `<div class="grid">${thumbsHtml}</div>`;

  render(root, `
    <section class="screen-picker">
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Back">
          ${icon('chevronLeft', 28)}
        </button>
        <div class="title">Pick a picture</div>
      </div>
      <div class="category-row" role="tablist">
        ${chips}
      </div>
      ${body}
    </section>
  `);

  root.addEventListener('click', e => {
    if (e.target.closest('[data-action="back"]')) return navigate('home');
    const cat = e.target.closest('[data-category]');
    if (cat) { currentCategory = cat.dataset.category; return renderPicker(root); }
    const pic = e.target.closest('[data-pic]');
    if (pic) navigate('colour', { pictureId: pic.dataset.pic });
  });
}
