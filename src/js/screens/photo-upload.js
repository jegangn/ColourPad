import { storage } from '../lib/storage.js';
import { imageToOutline } from '../lib/photo-to-outline.js';
import { render } from '../lib/render.js';
import { icon } from '../lib/icons.js';

export function renderPhotoUpload(root, onDone) {
  let lastImg = null;
  let threshold = 100;

  // Static template — user-typed name lives only in the input element, never interpolated.
  render(root, `
    <section class="screen-parent">
      <div class="topbar">
        <button class="icon-btn" data-action="back" aria-label="Back">${icon('chevronLeft', 28)}</button>
        <div class="title">Add photo as colouring page</div>
      </div>
      <div style="display:grid;grid-template-rows:auto 1fr auto;gap:16px;padding:24px;height:100%">
        <div>
          <input type="file" id="file" accept="image/*" style="font-size:18px">
          <input type="text" id="name" placeholder="Picture name (e.g. Toy car)" style="font-size:18px;padding:8px;margin-left:12px;width:300px">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center;justify-items:center">
          <div><div style="font-weight:700;text-align:center">Photo</div><img id="orig" style="max-width:100%;max-height:300px;background:#eee"></div>
          <div><div style="font-weight:700;text-align:center">Outline</div><img id="outline" style="max-width:100%;max-height:300px;background:#fff;border:1px solid #ccc"></div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <label>Threshold:</label>
          <input type="range" min="20" max="200" value="100" id="threshold" style="flex:1">
          <span id="thresh-val">100</span>
          <button class="pill primary" id="save" disabled>Add to Colouring</button>
        </div>
      </div>
    </section>
  `);

  const file = root.querySelector('#file');
  const orig = root.querySelector('#orig');
  const outline = root.querySelector('#outline');
  const slider = root.querySelector('#threshold');
  const threshVal = root.querySelector('#thresh-val');
  const save = root.querySelector('#save');
  const nameInput = root.querySelector('#name');

  const refresh = () => {
    if (!lastImg) return;
    outline.src = imageToOutline(lastImg, threshold);
    save.disabled = false;
  };

  file.addEventListener('change', () => {
    const f = file.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { lastImg = img; orig.src = url; refresh(); };
    img.src = url;
  });

  slider.addEventListener('input', () => {
    threshold = Number(slider.value);
    threshVal.textContent = String(threshold);
    refresh();
  });

  save.addEventListener('click', () => {
    const name = (nameInput.value || 'My picture').trim();
    storage.addUserPhoto({
      id: 'user-' + Date.now(),
      name,
      outlineDataUrl: outline.src,
    });
    onDone();
  });

  root.querySelector('[data-action="back"]').addEventListener('click', onDone);
}
