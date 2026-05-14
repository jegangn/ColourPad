// src/js/screens/colour.js
import { navigate } from '../lib/router.js';
import { audio } from '../lib/audio.js';
import { storage } from '../lib/storage.js';
import { PaintLayer } from '../lib/paint.js';
import { render, escapeHtml } from '../lib/render.js';
import { icon } from '../lib/icons.js';

// 24 colours arranged in spectrum order (red → purple → grey/black) so the
// kid can scan left-to-right and pick the shade they want. Wraps to two rows
// on tablet portrait, fits on one row in landscape.
const PAINT_COLOURS = [
  ['#E63946', 'red'],
  ['#B91C1C', 'crimson'],
  ['#EC4899', 'pink'],
  ['#C026D3', 'magenta'],
  ['#7B2CBF', 'purple'],
  ['#A78BFA', 'violet'],
  ['#4338CA', 'indigo'],
  ['#1D4ED8', 'navy'],
  ['#118AB2', 'blue'],
  ['#38BDF8', 'sky blue'],
  ['#14B8A6', 'teal'],
  ['#16A34A', 'green'],
  ['#06D6A0', 'mint'],
  ['#84CC16', 'lime'],
  ['#FFD166', 'yellow'],
  ['#F59E0B', 'gold'],
  ['#F97316', 'orange'],
  ['#FDBA74', 'peach'],
  ['#8B5E3C', 'brown'],
  ['#D2B48C', 'tan'],
  ['#65A30D', 'olive'],
  ['#374151', 'dark grey'],
  ['#6B7280', 'grey'],
  ['#1F1F1F', 'black'],
];

// Brush thicknesses — 4 options, kid picks based on how fast they want to fill
const SIZES = [
  { label: 'extra small', value: 6  },
  { label: 'small',       value: 12 },
  { label: 'medium',      value: 22 },
  { label: 'large',       value: 40 },
];
const DEFAULT_SIZE_INDEX = 1; // small

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
  // Canvas resolution — independent of SVG viewBox. 4:3 ratio matches all built-ins.
  const W = 400, H = 300;
  const safeName = escapeHtml(meta.name);

  const swatchHtml = PAINT_COLOURS.map(([hex, name], i) => `
    <button class="swatch ${i === 0 ? 'selected' : ''}"
            style="background:${hex}" data-colour="${hex}" aria-label="${name}"></button>
  `).join('');

  const eraserHtml = `
    <button class="swatch" style="background:white;border-color:#aaa"
            data-colour="ERASE" aria-label="Eraser">
      ${icon('xMark', 22, { stroke: '#444', strokeWidth: 2 })}
    </button>
  `;

  const sizeHtml = SIZES.map((s, i) => `
    <button class="brush-size ${i === DEFAULT_SIZE_INDEX ? 'selected' : ''}"
            data-size="${s.value}" aria-label="${s.label} brush">
      <div class="dot" style="width:${s.value}px;height:${s.value}px"></div>
    </button>
  `).join('');

  render(root, `
    <section class="screen-colour">
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Back">
          ${icon('chevronLeft', 28)}
        </button>
        <div class="title">${safeName}</div>
        <button class="icon-btn" data-action="undo" aria-label="Undo">
          ${icon('arrowUturnLeft', 26)}
        </button>
        <button class="icon-btn" data-action="clear" aria-label="Clear all">
          ${icon('trash', 26)}
        </button>
        <button class="icon-btn accent" data-action="save" aria-label="Save to gallery">
          ${icon('star', 26)}
        </button>
      </div>
      <div class="stage" id="stage">
        <canvas class="paint" id="paint" width="${W * 2}" height="${H * 2}"></canvas>
      </div>
      <div class="palette">
        <div class="palette-row">
          <span class="group-label">Colour</span>
          <div class="swatches">${swatchHtml}${eraserHtml}</div>
        </div>
        <div class="palette-row">
          <span class="group-label">Brush</span>
          <div class="brush-sizes">${sizeHtml}</div>
        </div>
      </div>
    </section>
  `);

  // Inject the outline overlay into the stage. Built-in SVGs are parsed via
  // DOMParser so they keep their own viewBox + root style attributes
  // (stroke colour, stroke-width, fill="none"), regardless of internal structure.
  const stage = root.querySelector('#stage');
  if (outlineDataUrl) {
    const img = document.createElement('img');
    img.className = 'outline-top';
    img.alt = '';
    img.style.objectFit = 'contain';
    img.src = outlineDataUrl;
    stage.appendChild(img);
  } else if (svgText) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svgEl = doc.documentElement;
    svgEl.setAttribute('class', 'outline-top');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // Built-in SVGs sometimes ship with fill="white" on shapes — that would hide
    // the kid's paint underneath. Strip white/transparent fills so paint shows
    // through; keep dark decorative fills (e.g. wheel hubs).
    const stripWhite = (el) => {
      if (el.hasAttribute('fill')) {
        const f = el.getAttribute('fill').trim().toLowerCase();
        if (f === 'white' || f === '#fff' || f === '#ffffff') {
          el.setAttribute('fill', 'none');
        }
      }
      // Root svg also commonly has fill="none" already; leave that.
      for (const child of el.children) stripWhite(child);
    };
    stripWhite(svgEl);
    stage.appendChild(svgEl);
  }

  const canvas = root.querySelector('#paint');
  const layer = new PaintLayer(canvas);
  let currentBrushPx = SIZES[DEFAULT_SIZE_INDEX].value;
  let currentColour  = PAINT_COLOURS[0][0];
  layer.setColour(currentColour);
  layer.setSize(currentBrushPx);

  // Restore in-progress draft (if any). Persists across PWA closes/reloads
  // until the kid presses Clear or browser site data is wiped.
  const draft = storage.getDraft(meta.id);
  if (draft) {
    const draftImg = new Image();
    draftImg.onload = () => {
      layer.ctx.drawImage(draftImg, 0, 0, canvas.width, canvas.height);
      layer.setBaseline();
    };
    draftImg.src = draft;
  }

  // Debounced auto-save: write the canvas to localStorage 600ms after the
  // last paint stroke so we don't hammer storage on every pointer move.
  let saveTimer = null;
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { storage.saveDraft(meta.id, canvas.toDataURL('image/png')); } catch {}
    }, 600);
  };

  // Brush cursor — a translucent circle that follows the finger so the kid
  // sees exactly where (and how big) the next stroke will be. Sized in display
  // pixels by converting from canvas pixels via the current canvas width ratio.
  const cursor = document.createElement('div');
  cursor.className = 'brush-cursor';
  stage.appendChild(cursor);

  const positionCursor = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const displayPx = currentBrushPx * (rect.width / canvas.width);
    cursor.style.width  = displayPx + 'px';
    cursor.style.height = displayPx + 'px';
    cursor.style.left   = (clientX - rect.left) + 'px';
    cursor.style.top    = (clientY - rect.top)  + 'px';
    cursor.style.borderColor = currentColour === 'ERASE' ? '#1F1F1F' : currentColour;
  };
  const showCursor = () => { cursor.classList.add('visible'); };
  const hideCursor = () => { cursor.classList.remove('visible'); };

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
    positionCursor(e.clientX, e.clientY);
    showCursor();
    audio.startWhoosh();
  });
  canvas.addEventListener('pointermove', e => {
    if (e.buttons === 0 && e.pointerType !== 'touch') return;
    const [x, y] = toCanvas(e);
    layer.drawTo(x, y);
    positionCursor(e.clientX, e.clientY);
  });
  const onPointerEnd = () => {
    layer.endStroke();
    audio.stopWhoosh();
    hideCursor();
    scheduleSave();
  };
  canvas.addEventListener('pointerup',     onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);
  // pointerleave should NOT end the stroke — with setPointerCapture the user
  // can drag their finger briefly off the canvas and back without losing the
  // stroke. Just hide the visual cursor so it doesn't freeze at the edge.
  canvas.addEventListener('pointerleave',  hideCursor);

  root.querySelector('.palette').addEventListener('click', e => {
    const sw = e.target.closest('[data-colour]');
    if (sw) {
      root.querySelectorAll('[data-colour]').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      if (sw.dataset.colour === 'ERASE') {
        layer.ctx.globalCompositeOperation = 'destination-out';
        layer.setColour('rgba(0,0,0,1)');
        currentColour = 'ERASE';
      } else {
        layer.ctx.globalCompositeOperation = 'source-over';
        layer.setColour(sw.dataset.colour);
        currentColour = sw.dataset.colour;
      }
      return;
    }
    const sz = e.target.closest('[data-size]');
    if (sz) {
      root.querySelectorAll('[data-size]').forEach(s => s.classList.remove('selected'));
      sz.classList.add('selected');
      currentBrushPx = Number(sz.dataset.size);
      layer.setSize(currentBrushPx);
    }
  });

  root.querySelector('.topbar').addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'back')  return navigate('home');
    if (btn.dataset.action === 'undo')  return layer.doUndo();
    if (btn.dataset.action === 'clear') {
      if (confirm('Clear the whole picture?')) {
        layer.clear();
        storage.clearDraft(meta.id);
      }
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
      // Replace icon with a checkmark glyph using safe DOM API
      btn.replaceChildren();
      btn.textContent = '✓';
      btn.style.fontSize = '32px';
      btn.style.color = 'white';
      btn.disabled = true;
    }
  });
}
