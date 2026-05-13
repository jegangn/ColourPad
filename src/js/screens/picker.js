// src/js/screens/picker.js
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
  });
}
