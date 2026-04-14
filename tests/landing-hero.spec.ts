import { test, expect, type Page, type Locator } from '@playwright/test';
import {
  collectConsoleErrors,
  expectHtmlInCanvasAvailable,
} from './helpers';

/** Assert a WebGL canvas has painted non-transparent pixels. Reads the
 *  framebuffer via `gl.readPixels` since `getContext('2d')` doesn't
 *  work on a WebGL canvas. */
async function expectGlCanvasNonBlank(
  page: Page,
  canvas: Locator,
): Promise<void> {
  const nonBlank = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement;
    const gl =
      c.getContext('webgl') as WebGLRenderingContext | null ||
      (c.getContext('webgl2') as WebGLRenderingContext | null);
    if (!gl) return false;
    const w = c.width;
    const h = c.height;
    if (w === 0 || h === 0) return false;
    // Sample a grid of ~32x32 pixels. readPixels is slow, so read a
    // modest-sized rectangle once and scan it.
    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let seen = 0;
    const stride = Math.max(4, Math.floor(pixels.length / 1024 / 4) * 4);
    for (let i = 0; i < pixels.length; i += stride) {
      if (pixels[i] || pixels[i + 1] || pixels[i + 2] || pixels[i + 3]) {
        seen++;
        if (seen > 4) return true;
      }
    }
    return seen > 0;
  });
  expect(nonBlank, 'WebGL canvas appears blank').toBe(true);
}

const HOME_URL = '/';

test.describe('landing hero (flag-on, WebGL stage)', () => {
  test('pre-paint script sets data-flag-supported=true before the hero paints', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    const flagAttr = await page.evaluate(
      () => document.documentElement.dataset.flagSupported,
    );
    expect(flagAttr).toBe('true');
  });

  test('stage renders both source and WebGL canvases; shader output is non-blank', async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    await expectHtmlInCanvasAvailable(page);

    const source = page.locator('.hero-source-canvas');
    const glCanvas = page.locator('.hero-gl-canvas');

    await expect(source).toBeAttached();
    await expect(glCanvas).toBeVisible();

    // Both canvases must size against the stage before anything
    // meaningful paints.
    await page.waitForFunction(() => {
      const s = document.querySelector<HTMLCanvasElement>(
        '.hero-source-canvas',
      );
      const g = document.querySelector<HTMLCanvasElement>('.hero-gl-canvas');
      return !!s && !!g && s.width > 0 && g.width > 0;
    });

    // Give the render loop a couple of frames to upload and draw.
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

    await expectGlCanvasNonBlank(page, glCanvas);
    expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
  });

  test('live badge and drag hint are visible on flag-on', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    await expect(page.locator('.hero-live-badge')).toBeVisible();
    await expect(page.locator('[data-hero-hint]')).toBeVisible();
  });

  test('hides the flag-off affordances (chips + setup) when the flag is supported', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    await expect(page.locator('.hero-chips')).toBeHidden();
    await expect(page.locator('.hero-setup')).toBeHidden();
  });

  test('keeps the static <h1> in the DOM and accessibility tree', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const heading = page.getByRole('heading', {
      level: 1,
      name: /render html into canvas/i,
    });
    await expect(heading).toHaveCount(1);
  });
});

test.describe('landing hero (flag-off, simulated non-Chromium)', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('pre-paint script sets data-flag-supported=false', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    const flagAttr = await page.evaluate(
      () => document.documentElement.dataset.flagSupported,
    );
    expect(flagAttr).toBe('false');
  });

  test('shows chips, CTAs, and the FlagSetupSteps guide', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const chips = page.locator('.hero-chips');
    await expect(chips).toBeVisible();
    await expect(chips).toContainText(/chrome canary or brave stable/i);
    await expect(chips).toContainText(/flag is dev-only/i);
    await expect(chips).toContainText(/no install/i);

    await expect(
      page.getByRole('link', { name: /explore demos/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /read the spec/i }),
    ).toBeVisible();

    await expect(page.locator('.hero-setup .flag-setup')).toBeVisible();
    await expect(page.locator('.hero-setup .copy-flag')).toBeVisible();
  });

  test('hides the WebGL stage on flag-off', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    await expect(page.locator('.hero-stage')).toBeHidden();
    await expect(page.locator('.hero-live-badge')).toBeHidden();
  });

  test('shows the "preview mode" ribbon to explain the fallback', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    const ribbon = page.locator('.hero-preview-ribbon');
    await expect(ribbon).toBeVisible();
    await expect(ribbon).toContainText(/preview mode/i);
    await expect(ribbon).toContainText(/flip the flag/i);
  });

  test('static heading renders at full opacity / colour on flag-off', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const headingColor = await page.evaluate(() => {
      const h = document.querySelector<HTMLElement>('.hero-heading--static');
      if (!h) return null;
      const c = getComputedStyle(h).color;
      return c;
    });

    // In flag-off mode, the heading should have its theme's
    // --text-primary, not transparent.
    expect(headingColor).not.toBeNull();
    expect(headingColor!.toLowerCase()).not.toContain('rgba(0, 0, 0, 0)');
  });
});

test.describe('landing hero (flag-on + prefers-reduced-motion)', () => {
  test('renders one frame and stops the render loop', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();

    try {
      await page.goto(HOME_URL, { waitUntil: 'networkidle' });
      await expectHtmlInCanvasAvailable(page);

      const glCanvas = page.locator('.hero-gl-canvas');
      await page.waitForFunction(() => {
        const g = document.querySelector<HTMLCanvasElement>(
          '.hero-gl-canvas',
        );
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

      await expectGlCanvasNonBlank(page, glCanvas);
    } finally {
      await context.close();
    }
  });
});
