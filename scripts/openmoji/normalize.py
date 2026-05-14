"""Convert an OpenMoji black/outline SVG to ColorPad format.

OpenMoji black SVGs:
- viewBox 0 0 72 72
- Single <g id="line"> with stroke-only paths
- Stroke #000, width 2

Output:
- viewBox 0 0 400 300
- Single <g id="outline" fill="none" stroke="#1F1F1F" stroke-width="4"
   stroke-linecap="round" stroke-linejoin="round">
- All inner shapes wrapped in a transform that centers + fills 80% of canvas
"""

import re
import sys
from pathlib import Path

W, H = 400, 300
TARGET_HEIGHT = 240  # 80% of canvas height -> 30px margin top/bottom
SRC_VIEW = 72         # OpenMoji native viewBox

FINAL_STROKE_PX = 4   # how thick the outline should *appear* in the 400x300 viewBox


def _extract_line_group(text: str) -> str | None:
    """Pull the inner contents of <g id="line"> with balanced <g> nesting."""
    m = re.search(r'<g id="line"[^>]*>', text)
    if not m:
        return None
    start = m.end()
    depth = 1
    i = start
    open_g = re.compile(r'<g\b')
    close_g = re.compile(r'</g\s*>')
    while depth > 0 and i < len(text):
        next_open = open_g.search(text, i)
        next_close = close_g.search(text, i)
        if not next_close:
            return None
        if next_open and next_open.start() < next_close.start():
            depth += 1
            i = next_open.end()
        else:
            depth -= 1
            if depth == 0:
                return text[start:next_close.start()]
            i = next_close.end()
    return None


def normalize(src_text: str) -> str | None:
    """Return normalized SVG text, or None if src is unrecognized."""
    inner = _extract_line_group(src_text)
    if inner is None:
        return None

    # Strip per-shape stroke/fill so the wrapper group can dictate the style.
    # Keep d/cx/cy/x/y/r/etc — only kill style/stroke/fill attributes.
    inner = re.sub(r'\s*(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin)="[^"]*"', '', inner)

    scale = TARGET_HEIGHT / SRC_VIEW            # ~3.333
    drawn = SRC_VIEW * scale                    # = TARGET_HEIGHT
    tx = (W - drawn) / 2                        # horizontal center
    ty = (H - drawn) / 2                        # vertical center
    # SVG strokes scale with the transform, so we set a smaller declared
    # stroke-width that becomes FINAL_STROKE_PX after scaling.
    sw = FINAL_STROKE_PX / scale
    outline_attrs = (
        f'fill="none" stroke="#1F1F1F" stroke-width="{sw:.3f}" '
        f'stroke-linecap="round" stroke-linejoin="round"'
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">\n'
        f'  <g id="outline">\n'
        f'    <g {outline_attrs} transform="translate({tx:.2f},{ty:.2f}) scale({scale:.4f})">'
        f'{inner}'
        f'</g>\n'
        f'  </g>\n'
        f'</svg>\n'
    )


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('usage: normalize.py <input.svg> <output.svg>')
        sys.exit(1)
    src = Path(sys.argv[1]).read_text(encoding='utf-8')
    out = normalize(src)
    if out is None:
        print('ERROR: could not find <g id="line"> in source')
        sys.exit(2)
    Path(sys.argv[2]).write_text(out, encoding='utf-8')
    print(f'wrote {sys.argv[2]} ({len(out)} bytes)')
