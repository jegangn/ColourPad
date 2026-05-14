// src/js/screens/gallery.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { render, escapeHtml } from '../lib/render.js';
import { icon } from '../lib/icons.js';

export function renderGallery(root) {
  const items = storage.getGallery();
  const body = items.length === 0 ? `
    <div class="empty">
      <div class="icon">${icon('photo', 96)}</div>
      <div class="title">No pictures saved yet</div>
      <div>Tap the star button when you finish a picture to save it here.</div>
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
        <button class="icon-btn" data-action="back" aria-label="Back">
          ${icon('chevronLeft', 28)}
        </button>
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
      render(lb, `
        <button class="icon-btn close" data-close="" aria-label="Close">
          ${icon('xMark', 28)}
        </button>
        <img src="${escapeHtml(item.dataUrl)}" alt="">
      `);
      const cleanup = () => { lb.remove(); window.removeEventListener('hashchange', cleanup); };
      lb.addEventListener('click', e => {
        if (e.target === lb || e.target.closest('[data-close]')) cleanup();
      });
      window.addEventListener('hashchange', cleanup);
      document.body.appendChild(lb);
    });
  });
}
