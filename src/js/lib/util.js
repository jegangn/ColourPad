// src/js/lib/util.js

/** HTML-escape a string for safe interpolation into innerHTML templates. */
export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Clamp a number into [min, max]. */
export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
