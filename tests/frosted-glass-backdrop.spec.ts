import { test, expect } from '@playwright/test';
import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'frosted-glass-backdrop',
  // 2D context with WebGL processing happening offscreen. The visible
  // canvas is 2D so getImageData works.
  canvasSelector: '#canvas',
});

test('frosted-glass: panel can be dragged', async ({ page }) => {
  await page.goto('/demos/frosted-glass-backdrop/');
  await page.waitForTimeout(500);

  const before = await page.evaluate(() => {
    const stage = document.getElementById('demo-stage');
    const panel = stage?.shadowRoot?.getElementById('frost-panel');
    return panel?.getBoundingClientRect();
  });
  expect(before).toBeTruthy();

  // Simulate a drag: mousedown on panel center, mousemove, mouseup
  const startX = before!.left + before!.width / 2;
  const startY = before!.top + before!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 80, startY + 50);
  await page.mouse.move(startX + 120, startY + 80);
  await page.mouse.up();

  await page.waitForTimeout(100);

  const after = await page.evaluate(() => {
    const stage = document.getElementById('demo-stage');
    const panel = stage?.shadowRoot?.getElementById('frost-panel');
    return panel?.getBoundingClientRect();
  });

  // Panel should have moved by roughly the drag delta. Allow some
  // tolerance for clamping at the canvas edges.
  expect(after!.left).toBeGreaterThan(before!.left + 50);
  expect(after!.top).toBeGreaterThan(before!.top + 30);
});
