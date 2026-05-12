export function imageToOutline(img, threshold = 100) {
  const max = 800;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth  * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  const src = ctx.getImageData(0, 0, w, h);
  const grey = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < src.data.length; i += 4, j++) {
    grey[j] = (src.data[i] * 0.299 + src.data[i+1] * 0.587 + src.data[i+2] * 0.114) | 0;
  }
  const blurred = new Uint8ClampedArray(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          s += grey[(y + dy) * w + (x + dx)];
      blurred[y * w + x] = s / 9;
    }
  }
  const out = ctx.createImageData(w, h);
  const Gx = [-1,0,1,-2,0,2,-1,0,1];
  const Gy = [-1,-2,-1,0,0,0,1,2,1];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0, k = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++, k++) {
          const v = blurred[(y + dy) * w + (x + dx)];
          gx += v * Gx[k]; gy += v * Gy[k];
        }
      const mag = Math.sqrt(gx * gx + gy * gy);
      const idx = (y * w + x) * 4;
      const edge = mag > threshold ? 0 : 255;
      out.data[idx] = edge; out.data[idx+1] = edge; out.data[idx+2] = edge; out.data[idx+3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return c.toDataURL('image/png');
}
