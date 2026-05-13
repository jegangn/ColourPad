// src/js/screens/dots.js
import { navigate } from '../lib/router.js';
import { audio } from '../lib/audio.js';
import { voice } from '../lib/voice.js';
import { storage } from '../lib/storage.js';
import { DotsEngine } from '../lib/dots-engine.js';
import { render, escapeHtml } from '../lib/render.js';

let manifestCache = null;
async function loadPicture(id) {
  manifestCache ??= await fetch('./assets/pictures/manifest.json').then(r => r.json());
  const meta = manifestCache.find(p => p.id === id);
  if (!meta) throw new Error('picture not found: ' + id);
  const svgText = await fetch(`./assets/pictures/${meta.svg}`).then(r => r.text());
  return { meta, svgText };
}

export async function renderDots(root, params) {
  const { meta, svgText } = await loadPicture(params.pictureId);
  const dots = meta.dotsByLevel[params.level];
  const settings = storage.getSettings();
  const W = 400, H = 300;

  const outlineGroup = svgText.match(/<g id="outline">[\s\S]*?<\/g>/)?.[0] ?? '';
  const safeName = escapeHtml(meta.name);

  render(root, `
    <section class="screen-dots">
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Back">&#8249;</button>
        <div class="title">${safeName}</div>
        <div id="progress" style="font-family:var(--font-display);font-weight:700;font-size:var(--fs-button)">0 / ${dots.length}</div>
      </div>
      <div class="stage" id="stage">
        <div class="reveal hidden" id="reveal" aria-hidden="true">${svgText}</div>
        ${settings.hintOn ? `<svg class="outline-bg" viewBox="0 0 ${W} ${H}">${outlineGroup}</svg>` : ''}
        <svg class="dots-svg" viewBox="0 0 ${W} ${H}">
          <polyline class="trail" id="trail" points=""/>
          <g id="dot-layer"></g>
        </svg>
      </div>
      <div class="actions" id="actions" style="visibility:hidden">
        <button class="pill" data-action="back">&#127968; Home</button>
        <button class="pill" data-action="restart">Try again</button>
        <button class="pill primary" data-action="save">&#11088; Save</button>
      </div>
    </section>
  `);

  const stage = root.querySelector('#stage');
  const dotLayer = root.querySelector('#dot-layer');
  const trail = root.querySelector('#trail');
  const reveal = root.querySelector('#reveal');
  const progressEl = root.querySelector('#progress');
  const actions = root.querySelector('#actions');

  const drawDots = (engine) => {
    render(dotLayer, dots.map(([x, y], i) => {
      const done = i < engine.progress;
      const active = i === engine.progress;
      return `
        ${active ? `<circle class="dot-pulse animated" cx="${x}" cy="${y}" r="16"/>` : ''}
        <circle class="dot-circle ${done?'done':''} ${active?'active':''}" cx="${x}" cy="${y}" r="11"/>
        <text class="dot-num ${done?'done':''}" x="${x}" y="${y + 4}">${i + 1}</text>
      `;
    }).join(''));
    trail.setAttribute('points', dots.slice(0, engine.progress).map(p => p.join(',')).join(' '));
    progressEl.textContent = `${engine.progress} / ${dots.length}`;
  };

  const engine = new DotsEngine(dots, {
    snapRadius: 30,
    onSnap: () => { audio.chime(); drawDots(engine); },
    onComplete: () => {
      voice.say(meta.name);
      reveal.classList.remove('hidden');
      const dotsSvg = stage.querySelector('.dots-svg');
      dotsSvg.style.transition = 'opacity 400ms';
      dotsSvg.style.opacity = '0';
      actions.style.visibility = 'visible';
      storage.incrementStats();
    },
  });
  drawDots(engine);

  const stageSvg = stage.querySelector('.dots-svg');
  // Use getScreenCTM().inverse() so the viewBox<->client mapping accounts for
  // letterboxing when the SVG's aspect ratio differs from its container.
  const toLocal = (e) => {
    const ctm = stageSvg.getScreenCTM();
    if (!ctm) return [0, 0];
    const inv = ctm.inverse();
    const pt = stageSvg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(inv);
    return [p.x, p.y];
  };

  stageSvg.addEventListener('pointerdown', e => {
    stageSvg.setPointerCapture(e.pointerId);
    const [x, y] = toLocal(e);
    if (engine.tryStart(x, y)) drawDots(engine);
  });
  stageSvg.addEventListener('pointermove', e => {
    if (!engine.isDragging) return;
    const [x, y] = toLocal(e); engine.move(x, y);
  });
  stageSvg.addEventListener('pointerup',     () => engine.lift());
  stageSvg.addEventListener('pointercancel', () => engine.lift());

  actions.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'back')    return navigate('home');
    if (btn.dataset.action === 'restart') return renderDots(root, params);
    if (btn.dataset.action === 'save') {
      const svgEl = reveal.querySelector('svg');
      const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = W * 2; c.height = H * 2;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        storage.addToGallery({ id: meta.id, mode: 'dots', dataUrl: c.toDataURL('image/png') });
        URL.revokeObjectURL(url);
        btn.textContent = '✓ Saved';
        btn.disabled = true;
      };
      img.src = url;
    }
  });

  root.querySelector('.topbar [data-action="back"]').addEventListener('click', () => navigate('home'));
}
