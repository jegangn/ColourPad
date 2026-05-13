// src/js/lib/router.js

const ROUTES = [
  { name: 'home',    pattern: /^#\/home\/?$/,             params: () => ({}) },
  { name: 'picker',  pattern: /^#\/picker\/?$/,           params: () => ({}) },
  { name: 'colour',  pattern: /^#\/colour\/([^/]+)\/?$/,  params: m => ({ pictureId: m[1] }) },
  { name: 'gallery', pattern: /^#\/gallery\/?$/,          params: () => ({}) },
  { name: 'parent',  pattern: /^#\/parent\/?$/,           params: () => ({}) },
];

export function parseRoute(hash) {
  if (!hash) return { name: 'home', params: {} };
  for (const r of ROUTES) {
    const m = hash.match(r.pattern);
    if (m) return { name: r.name, params: r.params(m) };
  }
  return { name: 'home', params: {} };
}

export function navigate(name, params = {}) {
  let hash = `#/${name}`;
  if (name === 'colour') hash += `/${params.pictureId}`;
  window.location.hash = hash;
}

export function onRouteChange(handler) {
  const fire = () => handler(parseRoute(window.location.hash));
  window.addEventListener('hashchange', fire);
  fire();
}
