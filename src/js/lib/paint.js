// src/js/lib/paint.js
export class UndoStack {
  constructor(max = 30) { this.max = max; this.items = []; }
  push(snap) { this.items.push(snap); while (this.items.length > this.max) this.items.shift(); }
  pop() {
    if (this.items.length < 2) return null;
    this.items.pop();
    return this.items[this.items.length - 1];
  }
  reset() { this.items = []; }
  get size() { return this.items.length; }
}

export class PaintLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colour = '#E63946';
    this.size = 16;
    this.prev = null;
    this.undo = new UndoStack(20);
    this._snapshot();
  }
  setColour(c) { this.colour = c; }
  setSize(s)   { this.size = s; }

  /** Reset the undo baseline to the canvas's CURRENT contents
   *  (e.g. after drawing a saved draft on top). */
  setBaseline() { this.undo.reset(); this._snapshot(); }

  beginStroke(x, y) { this.prev = [x, y]; this._dot(x, y); }
  drawTo(x, y) {
    if (!this.prev) return;
    const [px, py] = this.prev, ctx = this.ctx;
    ctx.strokeStyle = this.colour;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    this.prev = [x, y];
  }
  /** Finalise a stroke and capture an undo snapshot of the post-stroke canvas.
   *  Snapshotting AFTER drawing means each undo pops exactly one stroke
   *  (snapshotting BEFORE drawing duplicates the baseline at the first stroke
   *  and causes the first undo to skip two states). The `prev !== null` check
   *  makes back-to-back endStroke calls (e.g. pointerup right after pointercancel)
   *  a no-op so we don't double-snapshot a single stroke. */
  endStroke() {
    if (this.prev !== null) this._snapshot();
    this.prev = null;
  }

  _dot(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = this.colour;
    ctx.beginPath();
    ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  _snapshot() { this.undo.push(this.canvas.toDataURL('image/png')); }

  doUndo() {
    const prev = this.undo.pop();
    if (!prev) return Promise.resolve(false);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0);
        resolve(true);
      };
      img.src = prev;
    });
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Snapshot the post-clear (empty) state so a subsequent undo can revert
    // back to the pre-clear canvas in exactly one step.
    this._snapshot();
  }
}
