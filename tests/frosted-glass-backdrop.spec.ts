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

  const panel = page.locator('#demo-stage').locator('#frost-panel');
  await expect(panel).toBeVisible({ timeout: 10000 });

  // layoutsubtree paints the panel into the canvas, so Playwright's
  // page.mouse often hits the canvas, not the HTML child. Dispatch
  // the same events the demo listens for (panel mousedown, window
  // mousemove) so we test the drag handler, not compositor hit-testing.
  const moved = await page.evaluate(() => {
    const stage = document.getElementById('demo-stage');
    const el = stage?.shadowRoot?.getElementById('frost-panel');
    if (!el) return { ok: false, dx: 0 };

    const before = el.getBoundingClientRect();
    const startX = before.left + before.width / 2;
    const startY = before.top + before.height / 2;

    el.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: startX,
        clientY: startY,
      }),
    );
    window.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: startX + 80,
        clientY: startY + 50,
      }),
    );
    window.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        clientX: startX + 120,
        clientY: startY + 80,
      }),
    );
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const after = el.getBoundingClientRect();
    return { ok: true, dx: after.left - before.left, dy: after.top - before.top };
  });

  expect(moved.ok).toBe(true);
  expect(moved.dx).toBeGreaterThan(40);
});
