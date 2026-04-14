import { test, expect } from '@playwright/test';
import { expectHtmlInCanvasAvailable } from './helpers';

const HOME_URL = '/';

test.describe('visual punch-up: WebGL back plate + typography', () => {
  test('WebGL stage renders a non-black back plate behind the headline', async ({
    page,
  }) => {
    // The WebGL shader owns the gradient/noise back plate now — the
    // old CSS `::before` radial-gradient was superseded by the
    // fragment shader's `backPlate()` function. Verify the GL canvas
    // is painting a visibly non-blank surface (i.e. the back plate
    // rendered, even with no lens active).
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const glCanvas = page.locator('.hero-gl-canvas');
    await page.waitForFunction(() => {
      const g = document.querySelector<HTMLCanvasElement>('.hero-gl-canvas');
      return !!g && g.width > 0;
    });
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => r(null)),
          ),
        ),
    );

    const hasContent = await glCanvas.evaluate((el) => {
      const c = el as HTMLCanvasElement;
      const gl =
        (c.getContext('webgl') as WebGLRenderingContext | null) ||
        (c.getContext('webgl2') as WebGLRenderingContext | null);
      if (!gl) return false;
      const pixels = new Uint8Array(c.width * c.height * 4);
      gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      // Look for any pixel with non-trivial brightness.
      for (let i = 0; i < pixels.length; i += 4 * 64) {
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 10) return true;
      }
      return false;
    });
    expect(hasContent).toBe(true);
  });

  test('hero headline uses the bumped typography scale', async ({ page }) => {
    // Force a desktop viewport so the `clamp(2.5rem, 7vw, 4.5rem)`
    // evaluates at its upper bound.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const style = await page.evaluate(() => {
      const h = document.querySelector<HTMLElement>('.hero-heading');
      if (!h) return null;
      const cs = getComputedStyle(h);
      return {
        fontSizePx: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
      };
    });
    expect(style).not.toBeNull();

    // At 1280px viewport, 7vw = 89.6px; upper clamp 4.5rem = 72px
    // (assuming 16px root). Expect the computed size near that upper
    // bound.
    expect(style!.fontSizePx).toBeGreaterThanOrEqual(56);
    expect(style!.fontSizePx).toBeLessThanOrEqual(80);
    expect(style!.fontWeight).toBe('800');
  });
});

test.describe('visual punch-up: primitives dogfooding moment', () => {
  test('flag-on + normal motion: overlay canvases appear and clean up', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    await expectHtmlInCanvasAvailable(page);

    // Scroll the primitives grid into view to trigger the
    // IntersectionObserver.
    await page.locator('.primitives-grid').scrollIntoViewIfNeeded();

    // Overlay canvases live briefly inside each primitive card.
    // Wait until at least one exists — the stagger plus 500ms
    // animation window is enough for the first to appear.
    await page.waitForFunction(() =>
      document.querySelectorAll('[data-dogfood-overlay]').length > 0,
    );
    const transientCount = await page
      .locator('[data-dogfood-overlay]')
      .count();
    expect(transientCount).toBeGreaterThan(0);

    // After the animation completes + its cleanup timer fires, the
    // overlays are removed. Use Playwright's `waitFor` with a
    // generous ceiling since the full run is about 3*150 + 500 + 100
    // = 1050ms.
    await expect
      .poll(
        () => page.locator('[data-dogfood-overlay]').count(),
        { timeout: 3_000 },
      )
      .toBe(0);

    // One-shot behaviour: the grid is flagged played, preventing
    // another run on repeated intersection.
    const played = await page.evaluate(
      () =>
        (document.querySelector('.primitives-grid') as HTMLElement | null)
          ?.dataset.dogfoodPlayed,
    );
    expect(played).toBe('true');

    // Static cards are still visible afterward (the overlay was
    // additive; the underlying cards were never hidden).
    const visibleCount = await page.locator('.primitive-card').count();
    expect(visibleCount).toBe(3);
  });

  test('prefers-reduced-motion: no overlay canvases are created', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto(HOME_URL, { waitUntil: 'networkidle' });
      await page.locator('.primitives-grid').scrollIntoViewIfNeeded();

      // Give it enough time for the observer to fire if it were
      // going to — if it doesn't fire, no overlays ever exist.
      await page.waitForTimeout(600);
      expect(
        await page.locator('[data-dogfood-overlay]').count(),
      ).toBe(0);
    } finally {
      await context.close();
    }
  });

  test('flag-off: no overlay canvases are created', async ({ page }) => {
    await page.addInitScript(() => {
      const proto = (
        globalThis as unknown as {
          CanvasRenderingContext2D?: { prototype: Record<string, unknown> };
        }
      ).CanvasRenderingContext2D?.prototype;
      if (proto) {
        delete proto.drawElementImage;
        delete proto.drawElement;
      }
    });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    await page.locator('.primitives-grid').scrollIntoViewIfNeeded();

    await page.waitForTimeout(600);
    expect(await page.locator('[data-dogfood-overlay]').count()).toBe(0);
  });
});
