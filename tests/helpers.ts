import { expect, type Page, type Locator } from '@playwright/test';

/**
 * Assert that a canvas has been painted with something other than transparent
 * black. Samples a 32×32 grid across the canvas and checks for any pixel
 * whose alpha or RGB channels are non-zero.
 *
 * Useful as a smoke test that drawElementImage / drawElement actually fired
 * and put pixels on the canvas.
 */
export async function expectCanvasNonBlank(canvas: Locator): Promise<void> {
  const result = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const ctx = c.getContext('2d');
    if (!ctx) return { ok: false, reason: 'no 2d context' };

    const w = c.width;
    const h = c.height;
    if (w === 0 || h === 0) return { ok: false, reason: 'zero-sized canvas' };

    // Sample a 32x32 grid across the bitmap
    const cols = 32;
    const rows = 32;
    let nonBlank = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = Math.floor(((x + 0.5) / cols) * w);
        const py = Math.floor(((y + 0.5) / rows) * h);
        const data = ctx.getImageData(px, py, 1, 1).data;
        if (data[0] || data[1] || data[2] || data[3]) nonBlank++;
      }
    }
    return { ok: nonBlank > 0, nonBlank, total: cols * rows };
  });

  expect(
    result.ok,
    `Canvas appears blank (${'nonBlank' in result ? result.nonBlank : 0}/${
      'total' in result ? result.total : 0
    } sampled pixels had data)`,
  ).toBe(true);
}

/**
 * Confirm the HTML-in-Canvas API is available in the page context.
 * If this fails, the Chrome flag isn't actually being applied — the entire
 * test run is meaningless without it.
 */
export async function expectHtmlInCanvasAvailable(page: Page): Promise<void> {
  const available = await page.evaluate(() => {
    if (typeof CanvasRenderingContext2D === 'undefined') return false;
    const proto = CanvasRenderingContext2D.prototype;
    return 'drawElementImage' in proto || 'drawElement' in proto;
  });
  expect(
    available,
    'HTML-in-Canvas API not exposed — Chrome Canary flag may not be active',
  ).toBe(true);
}

/**
 * Track console errors that occur on a page so a test can assert "no errors".
 * Returns an array that the caller can inspect after the test interactions
 * are complete.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return errors;
}
