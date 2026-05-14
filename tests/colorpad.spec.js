// tests/colorpad.spec.js
// End-to-end tests for ColorPad — covers home/picker/colour/gallery/parent
// flows + draft persistence + responsive layout.
import { test, expect } from '@playwright/test';

// Wipe localStorage between tests so each test is isolated. Visit the origin
// first so we have a window object with localStorage access, then clear.
// IMPORTANT: don't use page.addInitScript here — that fires on every navigation
// (including reload()), which would wipe the draft mid-test.
//
// We also disable the service worker registration entirely for the test
// browser context so SW caching from one test can't leak into another.
test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
  });
});

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
test('home shows greeting "Hi Jhanav!" + paintbrush tile + gallery pill', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/home');
  await expect(page.locator('.greeting')).toHaveText('Hi Jhanav!');
  await expect(page.locator('.tile.colour')).toContainText('Start Colouring');
  await expect(page.locator('.tile.colour svg')).toBeVisible();
  await expect(page.locator('.pill').filter({ hasText: 'My Gallery' })).toBeVisible();
  await expect(page.locator('[data-action="parent"]')).toBeVisible();
});

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------
test('picker loads with 10 chips + 213 thumbs + mixes categories in "All"', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/picker');
  await page.waitForSelector('.thumb');
  // Categories: All + 9 real + (no My Photos because user has none yet)
  const chips = page.locator('[data-category]');
  await expect(chips).toHaveCount(10);
  await expect(chips.first()).toContainText('All');
  // Picker has 213 built-in pictures
  await expect(page.locator('.thumb')).toHaveCount(213);
  // The "All" tab should INTERLEAVE categories (vehicle, then space, then
  // construction, etc.) rather than grouping all 44 vehicles together
  // before the next category. Look up the first 30 thumbs in the manifest
  // and assert at least 3 distinct categories appear in that prefix —
  // impossible if the list is grouped by category.
  const manifest = await page.evaluate(() =>
    fetch('./assets/pictures/manifest.json').then(r => r.json())
  );
  const catById = Object.fromEntries(manifest.map(p => [p.id, p.category]));
  const ids = await page.locator('.thumb').evaluateAll(els =>
    els.slice(0, 30).map(el => el.dataset.pic)
  );
  const distinct = new Set(ids.map(id => catById[id]).filter(Boolean));
  expect(distinct.size).toBeGreaterThanOrEqual(3);
});

test('thumb has separated image area and title row (no overlap)', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/picker');
  await page.waitForSelector('.thumb');
  const firstThumb = page.locator('.thumb').first();
  const image = firstThumb.locator('.image');
  const title = firstThumb.locator('.title');
  await expect(image).toBeVisible();
  await expect(title).toBeVisible();
  // The title's bounding box should be strictly BELOW the image (no overlap)
  const imageBox = await image.boundingBox();
  const titleBox = await title.boundingBox();
  expect(titleBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height - 1);
});

test('clicking a category chip filters thumbs', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/picker');
  await page.waitForSelector('.thumb');
  await page.locator('[data-category="fire"]').click();
  // Fire category has 8 pictures (per build_manifest.py)
  await expect(page.locator('.thumb')).toHaveCount(8);
  // Selected chip should have .primary class
  await expect(page.locator('[data-category="fire"]')).toHaveClass(/primary/);
});

test('clicking a thumb navigates to colour screen for that picture', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/picker');
  await page.waitForSelector('[data-pic="pumper-fire-truck"]');
  await page.locator('[data-pic="pumper-fire-truck"]').click();
  await expect(page).toHaveURL(/#\/colour\/pumper-fire-truck/);
  await expect(page.locator('.title').first()).toContainText('Pumper Fire Truck');
});

// ---------------------------------------------------------------------------
// Colour screen
// ---------------------------------------------------------------------------
test('first picture has no prev arrow; next arrow goes to a different picture; prev returns', async ({ page }) => {
  // Fresh page so the in-memory history starts empty.
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  // First picture: prev hidden, next visible, home visible.
  await expect(page.locator('[data-action="prev"]')).toHaveCount(0);
  await expect(page.locator('[data-action="next"]')).toBeVisible();
  await expect(page.locator('[data-action="home"]')).toBeVisible();

  // Tap next → URL must change to a different picture id.
  await page.locator('[data-action="next"]').click();
  await page.waitForFunction(() => !location.hash.includes('pumper-fire-truck'));
  const afterNext = await page.evaluate(() => location.hash);
  expect(afterNext).not.toContain('pumper-fire-truck');

  // Now there's a previous picture, so prev arrow appears.
  await page.waitForSelector('.outline-top path');
  await expect(page.locator('[data-action="prev"]')).toBeVisible();

  // Tap prev → back to the original picture.
  await page.locator('[data-action="prev"]').click();
  await page.waitForFunction(() => location.hash.includes('pumper-fire-truck'));
  // And prev disappears again because we're back to the head of history.
  await page.waitForSelector('.outline-top path');
  await expect(page.locator('[data-action="prev"]')).toHaveCount(0);
});

test('colour screen shows 24 swatches + eraser + 4 brush sizes + outline', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  // Wait for the SVG outline to mount
  await page.waitForSelector('.outline-top path');
  await expect(page.locator('.swatch')).toHaveCount(25); // 24 colours + eraser
  await expect(page.locator('.brush-size')).toHaveCount(4);
  // Outline has at least a few children (proves the parsed SVG injected)
  const outlineChildren = await page.locator('.outline-top > *').count();
  expect(outlineChildren).toBeGreaterThan(5);
});

test('colour screen has "Colour" and "Brush" group labels', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const labels = page.locator('.group-label');
  await expect(labels).toHaveCount(2);
  await expect(labels.nth(0)).toHaveText(/colour/i);
  await expect(labels.nth(1)).toHaveText(/brush/i);
});

test('default selection: first swatch (red) + 2nd brush (small) are selected', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  // First swatch should be red and selected
  const firstSwatch = page.locator('.swatch').first();
  await expect(firstSwatch).toHaveClass(/selected/);
  await expect(firstSwatch).toHaveAttribute('data-colour', '#E63946');
  // 2nd brush size (small = index 1) should be selected
  const brushes = page.locator('.brush-size');
  await expect(brushes.nth(1)).toHaveClass(/selected/);
});

test('white fills are stripped from outline so paint shows through', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  // Check no shape inside .outline-top still has fill="white"
  const whiteFilled = await page.locator('.outline-top [fill="white"], .outline-top [fill="#fff"], .outline-top [fill="#ffffff"]').count();
  expect(whiteFilled).toBe(0);
});

test('drawing a stroke leaves paint on the canvas', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const box = await canvas.boundingBox();
  // Sample one canvas pixel before and after a stroke
  const before = await page.evaluate(() => {
    const c = document.querySelector('canvas.paint');
    return c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3];
  });
  expect(before).toBe(0); // transparent before any paint

  // Draw a stroke across the centre
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, { steps: 10 });
  await page.mouse.up();

  const after = await page.evaluate(() => {
    const c = document.querySelector('canvas.paint');
    return c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3];
  });
  expect(after).toBeGreaterThan(0); // pixel is now opaque
});

test('brush cursor appears during pointerdown and disappears on pointerup', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const cursor = page.locator('.brush-cursor');
  await expect(cursor).toHaveClass(/^brush-cursor$/); // not visible class
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Cursor should now have the visible class
  await expect(cursor).toHaveClass(/visible/);
  await page.mouse.up();
  // Cursor should lose visible class on release
  await expect(cursor).not.toHaveClass(/visible/);
});

test('changing brush size also changes brush cursor diameter', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const box = await canvas.boundingBox();

  // Pick the largest brush
  await page.locator('.brush-size').nth(3).click();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const big = await page.locator('.brush-cursor').evaluate(el => parseFloat(el.style.width));
  await page.mouse.up();

  // Pick the smallest brush
  await page.locator('.brush-size').nth(0).click();

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const small = await page.locator('.brush-cursor').evaluate(el => parseFloat(el.style.width));
  await page.mouse.up();

  expect(big).toBeGreaterThan(small);
});

test('selecting a different colour updates the cursor border', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const box = await canvas.boundingBox();

  // Pick the green swatch (12th index)
  await page.locator('.swatch[data-colour="#16A34A"]').click();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const borderColor = await page.locator('.brush-cursor').evaluate(el => el.style.borderColor);
  await page.mouse.up();
  // CSS RGB serialisation: rgb(22, 163, 74)
  expect(borderColor).toMatch(/rgb\(22,\s*163,\s*74\)/);
});

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------
test('undo removes exactly one stroke at a time (regression)', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const box = await canvas.boundingBox();

  // Stroke A — horizontal sweep across the upper third
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3, { steps: 8 });
  await page.mouse.up();

  // Stroke B — horizontal sweep across the lower third
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7, { steps: 8 });
  await page.mouse.up();

  // Both strokes leave canvas pixels at their respective y-bands
  const sample = (yFrac) => page.evaluate(({y}) => {
    const c = document.querySelector('canvas.paint');
    // Sample a small patch near the centre of the y-band
    const data = c.getContext('2d').getImageData(c.width / 2, Math.round(c.height * y), 4, 4).data;
    let opaque = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) opaque++;
    return opaque;
  }, { y: yFrac });

  const beforeUndo = { upper: await sample(0.3), lower: await sample(0.7) };
  expect(beforeUndo.upper).toBeGreaterThan(0);
  expect(beforeUndo.lower).toBeGreaterThan(0);

  // One undo click should remove ONLY stroke B (lower band)
  await page.locator('[data-action="undo"]').click();
  await page.waitForTimeout(150); // undo is async (loads dataURL into Image)

  const afterUndo = { upper: await sample(0.3), lower: await sample(0.7) };
  expect(afterUndo.upper).toBeGreaterThan(0);  // stroke A intact
  expect(afterUndo.lower).toBe(0);             // stroke B gone
});

// ---------------------------------------------------------------------------
// Auto-save / draft persistence
// ---------------------------------------------------------------------------
test('paint persists across reload via localStorage draft', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const box = await canvas.boundingBox();

  // Paint a swipe
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5, { steps: 12 });
  await page.mouse.up();

  // Wait for the debounced save to fire (600ms + a buffer)
  await page.waitForTimeout(900);

  const draftBefore = await page.evaluate(() => localStorage.getItem('dotpaint.draft.pumper-fire-truck'));
  expect(draftBefore).toBeTruthy();
  expect(draftBefore.length).toBeGreaterThan(100);

  // Reload, do NOT clear localStorage
  await page.reload();
  await page.waitForSelector('.outline-top path');
  // Wait briefly for the draft Image to load + draw
  await page.waitForTimeout(300);
  // Sample a pixel at the painted spot — should still be opaque
  const stillThere = await page.evaluate(() => {
    const c = document.querySelector('canvas.paint');
    return c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3];
  });
  expect(stillThere).toBeGreaterThan(0);
});

test('Clear button wipes the canvas and removes the draft', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const box = await canvas.boundingBox();

  // Paint then save
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => localStorage.getItem('dotpaint.draft.pumper-fire-truck'))).toBeTruthy();

  // Auto-confirm the "Clear?" dialog
  page.once('dialog', d => d.accept());
  await page.locator('[data-action="clear"]').click();

  // Draft should be gone
  expect(await page.evaluate(() => localStorage.getItem('dotpaint.draft.pumper-fire-truck'))).toBeNull();
});

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
test('gallery empty state shows photo icon + "No pictures saved yet"', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/gallery');
  await expect(page.locator('.empty')).toContainText('No pictures saved yet');
});

test('Save button adds the picture to the gallery', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const canvas = page.locator('canvas.paint');
  const box = await canvas.boundingBox();

  // Paint something so the saved image has content
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  await page.locator('[data-action="save"]').click();
  await page.waitForTimeout(300);

  // Now navigate to gallery and verify
  await page.goto('/#/gallery');
  await expect(page.locator('.item')).toHaveCount(1);
});

// ---------------------------------------------------------------------------
// Parent area
// ---------------------------------------------------------------------------
test('parent PIN screen shows keypad + correct PIN unlocks settings', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/parent');
  await expect(page.locator('.parent-pin')).toBeVisible();
  await expect(page.locator('.keypad-key')).toHaveCount(11); // 0-9 + delete
  // Enter default PIN 1234
  for (const k of ['1', '2', '3', '4']) {
    await page.locator(`[data-key="${k}"]`).click();
  }
  // Should now see the settings menu
  await expect(page.locator('.parent-menu')).toBeVisible();
  await expect(page.locator('.menu-row')).toHaveCount(7);
});

test('wrong PIN keeps user on PIN screen', async ({ page }) => {
  await page.goto('/?cb=' + Date.now() + '#/parent');
  for (const k of ['9', '9', '9', '9']) {
    await page.locator(`[data-key="${k}"]`).click();
  }
  // Still on PIN screen
  await expect(page.locator('.parent-pin')).toBeVisible();
  await expect(page.locator('.parent-menu')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Responsive layout (this entire spec runs in BOTH portrait and landscape projects;
// these tests assert layout changes between the two)
// ---------------------------------------------------------------------------
test('palette is on the right in landscape, on the bottom in portrait', async ({ page, viewport }) => {
  await page.goto('/?cb=' + Date.now() + '#/colour/pumper-fire-truck');
  await page.waitForSelector('.outline-top path');
  const palette = await page.locator('.palette').boundingBox();
  const stage   = await page.locator('.stage').boundingBox();

  if (viewport.width > viewport.height) {
    // Landscape: palette is to the RIGHT of the stage
    expect(palette.x).toBeGreaterThan(stage.x + stage.width - 5);
  } else {
    // Portrait: palette is BELOW the stage
    expect(palette.y).toBeGreaterThan(stage.y + stage.height - 5);
  }
});

test('picker grid uses 6 cols in landscape, 4 cols in portrait', async ({ page, viewport }) => {
  await page.goto('/?cb=' + Date.now() + '#/picker');
  await page.waitForSelector('.thumb');
  const cols = await page.locator('.screen-picker .grid').evaluate(el =>
    getComputedStyle(el).gridTemplateColumns.split(' ').length
  );
  expect(cols).toBe(viewport.width > viewport.height ? 6 : 4);
});
