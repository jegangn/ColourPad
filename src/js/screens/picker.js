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

  const filtered = currentCategory === 'all'
    ? items
    : items.filter(p => p.category === currentCategory);

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
