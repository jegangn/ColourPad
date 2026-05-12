// src/js/screens/colour.js
import { navigate } from '../lib/router.js';
import { audio } from '../lib/audio.js';
import { storage } from '../lib/storage.js';
import { PaintLayer } from '../lib/paint.js';
import { render, escapeHtml } from '../lib/render.js';

const PAINT_COLOURS = [
  ['#E63946','red'], ['#F97316','orange'], ['#FFD166','yellow'],
  ['#06D6A0','green'], ['#118AB2','blue'], ['#7B2CBF','purple'],
  ['#8B5E3C','brown'], ['#1F1F1F','black'],
];
const SIZES = [{label:'small',value:8},{label:'medium',value:16},{label:'large',value:28}];

let manifestCache = null;
async function loadPicture(id) {
  manifestCache ??= await fetch('./assets/pictures/manifest.json').then(r => r.json());
  const meta = manifestCache.find(p => p.id === id);
  if (!meta) {
    const photo = storage.getUserPhotos().find(p => p.id === id);
    if (photo) return { meta: { id: photo.id, name: photo.name }, outlineDataUrl: photo.outlineDataUrl };
    throw new Error('picture not found');
  }
  const svgText = await fetch(`./assets/pictures/${meta.svg}`).then(r => r.text());
  return { meta, svgText };
}

export async function renderColour(root, params) {
  const { meta, svgText, outlineDataUrl } = await loadPicture(params.pictureId);
  const W = 400, H = 300;
  const safeName = escapeHtml(meta.name);
  const outlineGroup = svgText ? (svgText.match(/<g id="outline">[\s\S]*?<\/g>/)?.[0] ?? '') : '';

  const overlay = outlineDataUrl
    ? `<img class="outline-top" src="${escapeHtml(outlineDataUrl)}" alt="" style="object-fit:contain">`
    : `<svg class="outline-top" viewBox="0 0 ${W} ${H}">${outlineGroup}</svg>`;

  const swatchHtml = PAINT_COLOURS.map(([hex, name], i) => `
    <button class="swatch ${i===0?'selected':''}" style="background:${hex}" data-colour="${hex}" aria-label="${name}"></button>
  `).join('');
  const sizeHtml = SIZES.map((s, i) => `
    <button class="brush-size ${i===1?'selected':''}" data-size="${s.value}" aria-label="${s.label}">
      <div class="dot" style="width:${s.value}px;height:${s.value}px"></div>
    </button>
  `).join('');

  render(root, `
    <section class="screen-colour">
      <div class="topbar">
        <button class="icon-btn" data-action="back">&#8249;</button>
        <div class="title">${safeName}</div>
        <button class="icon-btn" data-action="undo" aria-label="Undo">&#8630;</button>
        <button class="icon-btn" data-action="clear" aria-label="Clear">&#128465;</button>
        <button class="icon-btn primary" data-action="save" aria-label="Save">&#11088;</button>
      </div>
      <div class="stage" id="stage">
        <canvas class="paint" id="paint" width="${W*2}" height="${H*2}"></canvas>
        ${overlay}
      </div>
      <div class="palette">
        ${swatchHtml}
        <button class="swatch" style="background:white;border-color:#aaa;color:#444;font-size:18px" data-colour="ERASE" aria-label="Eraser">&#9003;</button>
        <div class="spacer"></div>
        ${sizeHtml}
      </div>
    </section>
  `);

  const canvas = root.querySelector('#paint');
  const layer = new PaintLayer(canvas);
  layer.setColour(PAINT_COLOURS[0][0]);
  layer.setSize(SIZES[1].value);

  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width)  * canvas.width,
      ((e.clientY - r.top)  / r.height) * canvas.height,
    ];
  };

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    const [x, y] = toCanvas(e);
    layer.beginStroke(x, y);
    audio.startWhoosh();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.buttons === 0 && e.pointerType !== 'touch') return;
    const [x, y] = toCanvas(e);
    layer.drawTo(x, y);
  });
  canvas.addEventListener('pointerup',     () => { layer.endStroke(); audio.stopWhoosh(); });
  canvas.addEventListener('pointercancel', () => { layer.endStroke(); audio.stopWhoosh(); });

  root.querySelector('.palette').addEventListener('click', e => {
    const sw = e.target.closest('[data-colour]');
    if (sw) {
      root.querySelectorAll('[data-colour]').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      if (sw.dataset.colour === 'ERASE') {
        layer.ctx.globalCompositeOperation = 'destination-out';
        layer.setColour('rgba(0,0,0,1)');
      } else {
        layer.ctx.globalCompositeOperation = 'source-over';
        layer.setColour(sw.dataset.colour);
      }
      return;
    }
    const sz = e.target.closest('[data-size]');
    if (sz) {
      root.querySelectorAll('[data-size]').forEach(s => s.classList.remove('selected'));
      sz.classList.add('selected');
      layer.setSize(Number(sz.dataset.size));
    }
  });

  root.querySelector('.topbar').addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'back')  return navigate('home');
    if (btn.dataset.action === 'undo')  return layer.doUndo();
    if (btn.dataset.action === 'clear') {
      if (confirm('Clear the whole picture?')) layer.clear();
      return;
    }
    if (btn.dataset.action === 'save') {
      const out = document.createElement('canvas');
      out.width = W * 2; out.height = H * 2;
      const ctx = out.getContext('2d');
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0);
      const overlayEl = root.querySelector('.outline-top');
      if (overlayEl.tagName === 'IMG') {
        ctx.drawImage(overlayEl, 0, 0, out.width, out.height);
      } else {
        const svg = new Blob([new XMLSerializer().serializeToString(overlayEl)], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svg);
        await new Promise(r => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0, out.width, out.height); URL.revokeObjectURL(url); r(); };
          img.src = url;
        });
      }
      storage.addToGallery({ id: meta.id, mode: 'colour', dataUrl: out.toDataURL('image/png') });
      storage.incrementStats();
      btn.textContent = '✓';
      btn.disabled = true;
    }
  });
}
