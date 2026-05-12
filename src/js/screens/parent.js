// src/js/screens/parent.js
import { navigate } from '../lib/router.js';
import { storage } from '../lib/storage.js';
import { audio } from '../lib/audio.js';
import { voice } from '../lib/voice.js';
import { render } from '../lib/render.js';

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
          <button class="icon-btn" data-action="back">‹</button>
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
            <button class="keypad-key" data-key="del">⌫</button>
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
    render(root, `
      <section class="screen-parent">
        <div class="topbar">
          <button class="icon-btn" data-action="back">‹</button>
          <div class="title">Parent settings</div>
        </div>
        <div class="parent-menu">
          <div class="menu-row" data-action="add-photo"><span>📷 Add photo as colouring page</span><span class="v">›</span></div>
          <div class="menu-row" data-action="manage-gallery"><span>🖼 Manage Gallery (${storage.getGallery().length})</span><span class="v">›</span></div>
          <div class="menu-row" data-action="change-pin"><span>🔢 Change PIN</span><span class="v">${s.pinHash?'•••':'1234 (default)'}</span></div>
          <div class="menu-row" data-action="toggle-hint"><span>👻 Faint outline hint</span><span class="v">${s.hintOn?'On':'Off'}</span></div>
          <div class="menu-row" data-action="toggle-sound"><span>🔊 Sound effects</span><span class="v">${s.soundOn?'On':'Off'}</span></div>
          <div class="menu-row" data-action="toggle-voice"><span>🗣 Voice naming</span><span class="v">${s.voiceOn?'On':'Off'}</span></div>
          <div class="menu-row"><span>📊 Pictures completed</span><span class="v">${stats.completed}</span></div>
        </div>
      </section>
    `);
    root.querySelector('[data-action="back"]').addEventListener('click', () => navigate('home'));
    root.querySelector('.parent-menu').addEventListener('click', async e => {
      const row = e.target.closest('[data-action]');
      if (!row) return;
      switch (row.dataset.action) {
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
