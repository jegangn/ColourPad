// src/js/screens/picker.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { render, escapeHtml } from '../lib/render.js';

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
    ...userPhotos.map(p => ({ id: p.id, name: p.name, category: 'mine', outlineDataUrl: p.outlineDataUrl })),
  ];
  const filtered = items.filter(p => currentCategory === 'all' || p.category === currentCategory);
  const cats = ['all', 'vehicles', 'animals', 'dinosaurs', 'food', 'other'];
  if (userPhotos.length) cats.push('mine');

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
        <div class="title">Pick a picture</div>
      </div>
      <div class="category-row">
        ${cats.map(c => `<button class="pill small ${currentCategory===c?'primary':''}" data-category="${c}">${c}</button>`).join('')}
      </div>
      <div class="grid">${thumbs}</div>
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
