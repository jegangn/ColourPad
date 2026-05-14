// src/js/app.js
import { onRouteChange } from './lib/router.js';
import { storage } from './lib/storage.js';
import { audio } from './lib/audio.js';
import { voice } from './lib/voice.js';
import { render } from './lib/render.js';

import { renderHome }    from './screens/home.js';
import { renderPicker }  from './screens/picker.js';
import { renderColour }  from './screens/colour.js';
import { renderGallery } from './screens/gallery.js';
import { renderParent }  from './screens/parent.js';

// Apply current settings to audio/voice
const s = storage.getSettings();
audio.setEnabled(s.soundOn);
voice.setEnabled(s.voiceOn);

const root = document.getElementById('app');

const RENDERERS = {
  home:    (params) => renderHome(root, params),
  picker:  (params) => renderPicker(root, params),
  colour:  (params) => renderColour(root, params),
  gallery: (params) => renderGallery(root, params),
  parent:  (params) => renderParent(root, params),
};

if (!window.location.hash) window.location.hash = '#/home';

onRouteChange(({ name, params }) => {
  const fn = RENDERERS[name] || RENDERERS.home;
  Promise.resolve(fn(params)).catch(err => {
    console.error('render error', err);
    render(root, `
      <div style="padding:40px;color:#dc2626;font-family:sans-serif">
        <h2>Something went wrong</h2>
        <pre>${String(err.message).replace(/</g, '&lt;')}</pre>
        <button onclick="location.hash='#/home'">Back to home</button>
      </div>
    `);
  });
});

// Register service worker. When a new SW takes control of an EXISTING page
// (i.e. a real version update, not the first-ever install), reload once so
// the page picks up the latest JS/CSS instead of running stale cached code.
//
// We snapshot the initial controller: if it was null, this is a first
// install and we don't reload. If it was a previous SW and `controllerchange`
// fires, we know a new version just took over.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});

  const hadController = !!navigator.serviceWorker.controller;
  let alreadyReloaded = false;
  const reloadIfUpdate = () => {
    if (!hadController || alreadyReloaded) return;
    alreadyReloaded = true;
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', reloadIfUpdate);
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'SW_UPDATED') reloadIfUpdate();
  });
}
