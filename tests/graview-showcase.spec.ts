import { test, expect } from '@playwright/test';
import {
  collectConsoleErrors,
  expectCanvasNonBlank,
  expectHtmlInCanvasAvailable,
} from './helpers';

const HOME_URL = '/';
const OTHER_URL = '/demos/';

test.describe('Graview showcase hero (home page)', () => {
  test('links out to graview.dev and graview.cloud', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });

    const section = page.getByRole('region', { name: /see it in action in graview/i });
    await expect(section).toBeVisible();

    const dev = section.getByRole('link', { name: /graview\.dev/i });
    const cloud = section.getByRole('link', { name: /graview\.cloud/i });
    await expect(dev).toHaveAttribute('href', 'https://graview.dev');
    await expect(cloud).toHaveAttribute('href', 'https://graview.cloud');
    for (const link of [dev, cloud]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('flag-on: capture canvas paints the planes and the DOM path is hidden', async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    await expectHtmlInCanvasAvailable(page);

    const canvas = page.locator('.gv-canvas');
    await expect(canvas).toBeVisible();
    await expect(page.locator('.gv-dom')).toBeHidden();

    // Scroll the stage into view so the IntersectionObserver-gated
    // loop runs, then give the paint pipeline a few frames.
    await page.locator('.gv-stage').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const c = document.querySelector<HTMLCanvasElement>('.gv-canvas');
      return !!c && c.width > 0 && c.height > 0;
    });
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => r(null)),
            ),
          ),
        ),
    );

    await expectCanvasNonBlank(canvas);
    expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);
  });

  test('home page does not render the top banner', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#gv-banner')).toHaveCount(0);
  });
});

test.describe('Graview top banner (other pages)', () => {
  test('is visible, links out, and dismissal persists across navigation', async ({
    page,
  }) => {
    await page.goto(OTHER_URL, { waitUntil: 'domcontentloaded' });

    const banner = page.locator('#gv-banner');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('link', { name: 'graview.dev' })).toHaveAttribute(
      'href',
      'https://graview.dev',
    );
    await expect(banner.getByRole('link', { name: 'graview.cloud' })).toHaveAttribute(
      'href',
      'https://graview.cloud',
    );

    await banner.getByRole('button', { name: /dismiss graview banner/i }).click();
    await expect(banner).toBeHidden();

    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#gv-banner')).toBeHidden();
  });

  test('no horizontal overflow with the banner at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(OTHER_URL, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
