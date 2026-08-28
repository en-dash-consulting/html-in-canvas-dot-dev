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

  // Playwright pierces the open shadow root on #demo-stage.
  const panel = page.locator('#demo-stage').locator('#frost-panel');
  await expect(panel).toBeVisible({ timeout: 10000 });

  const before = await panel.boundingBox();
  expect(before).toBeTruthy();

  // Drag via the locator so we hit the real panel, not a guessed
  // coordinate. steps: makes window mousemove fire incrementally
  // (the demo only updates position on mousemove after mousedown).
  const startX = before!.x + before!.width / 2;
  const startY = before!.y + Math.min(24, before!.height / 3);
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 120, startY + 80, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(
      async () => {
        const after = await panel.boundingBox();
        return after ? after.x - before!.x : 0;
      },
      { timeout: 2000 },
    )
    .toBeGreaterThan(40);
});
