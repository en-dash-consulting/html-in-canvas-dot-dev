import { expect } from '@playwright/test';
import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'vgpu-shader',
  // The source canvas is a 2D context painted by drawElementImage, so
  // pixels are readable. The live WebGPU canvas is not.
  canvasSelector: '#source-canvas',
  // vgpu loads from esm.sh; allow time for the CDN + WebGPU init.
  firstPaintTimeoutMs: 15000,
  extraIgnoredErrors: [
    // Offline / blocked CDN should not fail the HTML-in-Canvas smoke.
    'Failed to fetch',
    'error loading dynamically imported module',
  ],
  interact: async (page, canvas) => {
    const headline = page.locator('#headline-input');
    await headline.fill('Foil stamp');
    await expect(page.locator('#headline')).toHaveText('Foil stamp');
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );
    await expect(canvas).toBeVisible();

    const snap = page.locator('#snap-btn');
    if (await snap.isEnabled()) {
      await snap.click();
      await page
        .locator('#snapshot')
        .waitFor({ state: 'visible', timeout: 8000 })
        .catch(() => {
          /* WebGPU readback is best-effort in smoke */
        });
    }
  },
});
