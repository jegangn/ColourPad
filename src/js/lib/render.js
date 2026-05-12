// src/js/lib/render.js
import { escapeHtml } from './util.js';

/** Replace the contents of `el` with the given HTML string. */
export function render(el, html) {
  // We intentionally use a single replacement assignment here. All callers must
  // pass user-controlled strings through escapeHtml() from util.js — see the
  // SECURITY MODEL section in the parent plan.
  el.replaceChildren();                    // clears contents
  const tpl = document.createElement('template');
  tpl.innerHTML = html;                    // template element is detached, no script execution
  el.appendChild(tpl.content);
}
export { escapeHtml };
