// src/js/screens/home.js
import { navigate } from '../lib/router.js';
import { render } from '../lib/render.js';

export function renderHome(root) {
  render(root, `
    <section class="screen-home">
      <div class="header">
        <div class="greeting">Hi! 👋</div>
        <button class="icon-btn" data-action="parent" aria-label="Parent area">⚙️</button>
      </div>
      <div class="tiles">
        <button class="tile dots" data-action="dots">
          <div class="tile-icon">🔗</div>
          Connect the Dots
        </button>
        <button class="tile colour" data-action="colour">
          <div class="tile-icon">🎨</div>
          Colour
        </button>
      </div>
      <div class="footer">
        <button class="pill" data-action="gallery">🖼 My Gallery</button>
      </div>
    </section>
  `);

  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'dots':    navigate('picker', { mode: 'dots' }); break;
      case 'colour':  navigate('picker', { mode: 'colour' }); break;
      case 'gallery': navigate('gallery'); break;
      case 'parent':  navigate('parent'); break;
    }
  });
}
