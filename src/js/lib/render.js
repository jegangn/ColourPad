// src/js/lib/render.js
import { escapeHtml } from './util.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Replace the contents of `el` with the given HTML/SVG string.
 *  Detects whether `el` is in the SVG namespace and parses accordingly,
 *  so dynamically-built <circle>/<text>/etc are created as SVG elements
 *  (a <template> only parses HTML, which gives unrendered HTMLUnknownElements).
 *  Callers must still pass user-controlled strings through escapeHtml(). */
export function render(el, html) {
  if (el.namespaceURI === SVG_NS) {
    // Range.createContextualFragment uses the target element's namespace,
    // so <circle> inside an <svg> child is parsed as an SVG circle.
    const range = document.createRange();
    range.selectNodeContents(el);
    el.replaceChildren(range.createContextualFragment(html));
    return;
  }
  el.replaceChildren();                    // clears contents
  const tpl = document.createElement('template');
  tpl.innerHTML = html;                    // template element is detached, no script execution
  el.appendChild(tpl.content);
}
export { escapeHtml };
