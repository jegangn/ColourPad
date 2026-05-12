// src/js/screens/gallery.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { render, escapeHtml } from '../lib/render.js';

export function renderGallery(root) {
  const items = storage.getGallery();
  const body = items.length === 0 ? `
    <div class="empty">
      <div class="icon">🖼</div>
      <div style="font-family:var(--font-display);font-weight:700;font-size:24px;color:var(--c-fg)">No pictures saved yet</div>
      <div>Tap the ⭐ button when you finish a picture to save it here.</div>
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
        <button class="icon-btn" data-action="back">‹</button>
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
      const close = document.createElement('button');
      close.className = 'icon-btn close';
      close.textContent = '✕';
      close.dataset.close = '';
      const img = document.createElement('img');
      img.src = item.dataUrl;
      lb.appendChild(close); lb.appendChild(img);
      lb.addEventListener('click', e => {
        if (e.target === lb || e.target.closest('[data-close]')) lb.remove();
      });
      document.body.appendChild(lb);
    });
  });
}
