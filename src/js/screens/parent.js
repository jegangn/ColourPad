// src/js/screens/parent.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { audio } from '../lib/audio.js';
import { voice } from '../lib/voice.js';
import { render } from '../lib/render.js';
import { icon } from '../lib/icons.js';

const DEFAULT_PIN = '1234';

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function renderParent(root) {
  const settings = storage.getSettings();
  const requiredHash = settings.pinHash || await sha256(DEFAULT_PIN);
  let entered = '';

  const pinScreen = () => {
    render(root, `
      <section class="screen-parent">
        <div class="topbar">
          <button class="icon-btn" data-action="back" aria-label="Back">
            ${icon('chevronLeft', 28)}
          </button>
          <div class="title">Parent area</div>
        </div>
        <div class="parent-pin">
          <div class="label">Enter 4-digit PIN</div>
          <div class="pin-dots">
            ${[0,1,2,3].map(i => `<div class="d ${i < entered.length ? 'on' : ''}"></div>`).join('')}
          </div>
          <div class="keypad">
            ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="keypad-key" data-key="${n}">${n}</button>`).join('')}
            <div></div>
            <button class="keypad-key" data-key="0">0</button>
            <button class="keypad-key" data-key="del" aria-label="Delete">${icon('backspace', 28)}</button>
          </div>
          ${settings.pinHash ? '' : '<div style="font-size:14px;color:var(--c-fg-soft)">Default PIN: 1234</div>'}
        </div>
      </section>
    `);
    root.querySelector('[data-action="back"]').addEventListener('click', () => navigate('home'));
    root.querySelectorAll('[data-key]').forEach(k => {
      k.addEventListener('click', async () => {
        if (k.dataset.key === 'del') entered = entered.slice(0, -1);
        else if (entered.length < 4) entered += k.dataset.key;
        if (entered.length === 4) {
          const enteredHash = await sha256(entered);
          if (enteredHash === requiredHash) menuScreen();
          else { entered = ''; pinScreen(); }
        } else pinScreen();
      });
    });
  };

  const menuScreen = () => {
    const s = storage.getSettings();
    const stats = storage.getStats();

    const row = (action, iconName, label, value) => `
      <div class="menu-row" data-action="${action}">
        <span class="leading">${icon(iconName, 24)}<span>${label}</span></span>
        <span class="v">${value}</span>
      </div>
    `;

    render(root, `
      <section class="screen-parent">
        <div class="topbar">
          <button class="icon-btn" data-action="back" aria-label="Back">
            ${icon('chevronLeft', 28)}
          </button>
          <div class="title">Parent settings</div>
        </div>
        <div class="parent-menu">
          ${row('add-photo',      'camera',     'Add photo as colouring page', '›')}
          ${row('manage-gallery', 'photo',      `Manage Gallery (${storage.getGallery().length})`, '›')}
          ${row('change-pin',     'key',        'Change PIN', s.pinHash ? '•••' : '1234 (default)')}
          ${row('toggle-hint',    'eye',        'Faint outline hint', s.hintOn  ? 'On' : 'Off')}
          ${row('toggle-sound',   'speaker',    'Sound effects',       s.soundOn ? 'On' : 'Off')}
          ${row('toggle-voice',   'microphone', 'Voice naming',        s.voiceOn ? 'On' : 'Off')}
          <div class="menu-row">
            <span class="leading">${icon('chartBar', 24)}<span>Pictures completed</span></span>
            <span class="v">${stats.completed}</span>
          </div>
        </div>
      </section>
    `);
    root.querySelector('[data-action="back"]').addEventListener('click', () => navigate('home'));
    root.querySelector('.parent-menu').addEventListener('click', async e => {
      const r = e.target.closest('[data-action]');
      if (!r) return;
      switch (r.dataset.action) {
        case 'toggle-hint':  storage.setSettings({ hintOn:  !s.hintOn });  menuScreen(); break;
        case 'toggle-sound': storage.setSettings({ soundOn: !s.soundOn }); audio.setEnabled(!s.soundOn); menuScreen(); break;
        case 'toggle-voice': storage.setSettings({ voiceOn: !s.voiceOn }); voice.setEnabled(!s.voiceOn); menuScreen(); break;
        case 'change-pin':
          {
            const newPin = prompt('Enter new 4-digit PIN');
            if (!newPin || !/^\d{4}$/.test(newPin)) { alert('Must be exactly 4 digits.'); break; }
            storage.setSettings({ pinHash: await sha256(newPin) });
            alert('PIN updated.'); menuScreen();
          }
          break;
        case 'add-photo':
          {
            const { renderPhotoUpload } = await import('./photo-upload.js');
            renderPhotoUpload(root, () => renderParent(root));
          }
          break;
        case 'manage-gallery':
          navigate('gallery');
          break;
      }
    });
  };

  pinScreen();
}
