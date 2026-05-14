import { test } from '@playwright/test';
import path from 'node:path';

test('manual: capture picker layout', async ({ page }, testInfo) => {
  await page.goto('/?cb=' + Date.now() + '#/picker');
  await page.waitForSelector('.thumb');
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join('debug-shots', `picker-${testInfo.project.name}.png`),
    fullPage: false,
  });
});
