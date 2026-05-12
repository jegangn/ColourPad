// test/router.test.js
import { describe, it, expect } from 'bun:test';
import { parseRoute } from '../src/js/lib/router.js';

describe('parseRoute', () => {
  it('parses /home', () => {
    expect(parseRoute('#/home')).toEqual({ name: 'home', params: {} });
  });
  it('parses /picker/dots', () => {
    expect(parseRoute('#/picker/dots')).toEqual({ name: 'picker', params: { mode: 'dots' } });
  });
  it('parses /dots/excavator/medium', () => {
    expect(parseRoute('#/dots/excavator/medium')).toEqual({
      name: 'dots', params: { pictureId: 'excavator', level: 'medium' }
    });
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
