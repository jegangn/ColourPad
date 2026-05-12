import { describe, it, expect } from 'bun:test';
import { UndoStack } from '../src/js/lib/paint.js';

describe('UndoStack', () => {
  it('records snapshots and pops them', () => {
    const stack = new UndoStack(5);
    stack.push('a'); stack.push('b'); stack.push('c');
    expect(stack.pop()).toBe('b');
    expect(stack.pop()).toBe('a');
    expect(stack.pop()).toBe(null);
  });
  it('discards oldest when at capacity', () => {
    const stack = new UndoStack(2);
    stack.push('a'); stack.push('b'); stack.push('c'); stack.push('d');
    expect(stack.pop()).toBe('c');
    expect(stack.pop()).toBe(null);
  });
});
