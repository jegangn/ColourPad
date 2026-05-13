// test/router.test.js
import { describe, it, expect } from 'bun:test';
import { parseRoute } from '../src/js/lib/router.js';

describe('parseRoute', () => {
  it('parses /home', () => {
    expect(parseRoute('#/home')).toEqual({ name: 'home', params: {} });
  });
  it('parses /picker', () => {
    expect(parseRoute('#/picker')).toEqual({ name: 'picker', params: {} });
  });
  it('parses /colour/firetruck', () => {
    expect(parseRoute('#/colour/firetruck')).toEqual({
      name: 'colour', params: { pictureId: 'firetruck' }
    });
  });
  it('parses /gallery and /parent', () => {
    expect(parseRoute('#/gallery')).toEqual({ name: 'gallery', params: {} });
    expect(parseRoute('#/parent')).toEqual({ name: 'parent', params: {} });
  });
  it('falls back to home for unknown routes', () => {
    expect(parseRoute('#/garbage')).toEqual({ name: 'home', params: {} });
    expect(parseRoute('')).toEqual({ name: 'home', params: {} });
  });
});
