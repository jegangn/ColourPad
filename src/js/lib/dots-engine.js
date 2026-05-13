// src/js/lib/dots-engine.js
export class DotsEngine {
  constructor(dots, opts = {}) {
    this.dots = dots;
    this.snapRadius = opts.snapRadius ?? 30;
    this.onSnap = opts.onSnap || (() => {});
    this.onComplete = opts.onComplete || (() => {});
    this.progress = 0;
    this.isPaused = false;
    this.isDragging = false;
    this.fingerXY = null;
  }
  get isComplete() { return this.progress >= this.dots.length; }
  _dist(x, y, [dx, dy]) { const a=x-dx, b=y-dy; return Math.sqrt(a*a+b*b); }
  tryStart(x, y) {
    if (this.isComplete) return false;
    if (this.progress === 0) {
      if (this._dist(x, y, this.dots[0]) <= this.snapRadius) {
        this._snap(0); this.isDragging = true; this.isPaused = false; return true;
      }
      return false;
    }
    const last = this.dots[this.progress - 1];
    if (this._dist(x, y, last) <= this.snapRadius) {
      this.isDragging = true; this.isPaused = false; return true;
    }
    return false;
  }
  move(x, y) {
    if (!this.isDragging || this.isComplete) return;
    this.fingerXY = [x, y];
    const next = this.dots[this.progress];
    if (!next) return;
    if (this._dist(x, y, next) <= this.snapRadius) this._snap(this.progress);
  }
  lift() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (!this.isComplete) this.isPaused = true;
    this.fingerXY = null;
  }
  _snap(idx) {
    this.progress = idx + 1;
    this.fingerXY = [...this.dots[idx]]; // anchor at snapped dot so next move has a prev position
    this.onSnap(idx);
    if (this.isComplete) { this.isDragging = false; this.fingerXY = null; this.onComplete(); }
  }
}
