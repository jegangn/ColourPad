import { describe, it, expect } from 'bun:test';
import { DotsEngine } from '../src/js/lib/dots-engine.js';

describe('DotsEngine', () => {
  const dots = [[10,10],[50,10],[50,50],[10,50]];
  let engine;

  it('starts at progress 0', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    expect(engine.progress).toBe(0);
    expect(engine.isComplete).toBe(false);
  });
  it('begins drag only on dot 1', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    expect(engine.tryStart(50, 50)).toBe(false);
    expect(engine.tryStart(10, 10)).toBe(true);
    expect(engine.progress).toBe(1);
  });
  it('snaps next dot when finger enters snap radius', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(40, 12); expect(engine.progress).toBe(1);
    engine.move(48, 11); expect(engine.progress).toBe(2);
  });
  it('ignores wrong-direction dots', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(10, 50);
    expect(engine.progress).toBe(1);
  });
  it('completes after last dot', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(50, 10); engine.move(50, 50); engine.move(10, 50);
    expect(engine.isComplete).toBe(true);
  });
  it('pauses on lift, resumes on tap of last completed dot', () => {
    engine = new DotsEngine(dots, { snapRadius: 15 });
    engine.tryStart(10, 10);
    engine.move(50, 10);
    engine.lift();
    expect(engine.isPaused).toBe(true);
    expect(engine.tryStart(50, 50)).toBe(false);
    expect(engine.tryStart(50, 10)).toBe(true);
    expect(engine.isPaused).toBe(false);
  });
  it('emits onSnap with dot index', () => {
    const snaps = [];
    engine = new DotsEngine(dots, { snapRadius: 15, onSnap: i => snaps.push(i) });
    engine.tryStart(10, 10);
    engine.move(50, 10);
    expect(snaps).toEqual([0, 1]);
  });
});
