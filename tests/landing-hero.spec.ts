import { test, expect } from '@playwright/test';
import {
  collectConsoleErrors,
  expectCanvasNonBlank,
  expectHtmlInCanvasAvailable,
} from './helpers';

const HOME_URL = '/';

test.describe('landing hero (flag-on, default Playwright env)', () => {
  test('pre-paint script sets data-flag-supported=true before the hero paints', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });

    // The attribute is set by an inline <script> in <head>, which runs
    // before the body is parsed. Reading it immediately after
    // domcontentloaded is enough to catch whether it landed before
    // first paint.
    const flagAttr = await page.evaluate(
      () => document.documentElement.dataset.flagSupported,
    );
    expect(flagAttr).toBe('true');
  });

  test('renders the hero canvas and paints the headline via drawElementImage', async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    await expectHtmlInCanvasAvailable(page);

    const canvas = page.locator('.hero-heading-canvas');
    await expect(canvas).toBeAttached();

    // Canvas must size itself against the static heading's bbox before
    // onpaint can draw anything meaningful. ResizeObserver fires after
    // layout; give it a couple of frames to settle.
    await page.waitForFunction(() => {
      const c = document.querySelector<HTMLCanvasElement>(
        '.hero-heading-canvas',
      );
      return !!c && c.width > 0 && c.height > 0;
    });
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r(null))),
        ),
    );

    await expectCanvasNonBlank(canvas);
    expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
  });

  test('shows the "Live via drawElementImage" badge', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const badge = page.locator('.hero-live-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/live via/i);
  });

  test('hides the flag-off affordances when the flag is supported', async ({
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

    // The headline must remain addressable as an accessible h1 so
    // screen readers and search engines still see a real heading,
    // even though the canvas paints over it visually.
    const heading = page.getByRole('heading', {
      level: 1,
      name: /render html into canvas/i,
    });
    await expect(heading).toHaveCount(1);
  });
});

test.describe('landing hero (flag-off, simulated non-Chromium)', () => {
  test.beforeEach(async ({ page }) => {
    // Remove the API before the inline pre-paint detector runs so the
    // detector sets data-flag-supported=false — simulating a browser
    // (or Chromium build) where the flag isn't enabled.
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

  test('shows value chips, existing CTAs, and the FlagSetupSteps guide', async ({
    page,
  }) => {
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

    // Shared flag-setup component is embedded in the hero.
    await expect(page.locator('.hero-setup .flag-setup')).toBeVisible();
    await expect(
      page.locator('.hero-setup .copy-flag'),
    ).toBeVisible();
  });

  test('hides the canvas overlay and the live badge', async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    await expect(page.locator('.hero-heading-canvas')).toBeHidden();
    await expect(page.locator('.hero-live-badge')).toBeHidden();
  });

  test('leaves the static heading visually visible (no overlay covering it)', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const staticHeading = page.locator('.hero-heading--static');
    // visibility:hidden would apply only when the canvas overlay is in
    // use. In flag-off mode the heading must remain visible to users.
    const visibility = await staticHeading.evaluate(
      (el) => getComputedStyle(el).visibility,
    );
    expect(visibility).toBe('visible');
  });
});

test.describe('landing hero (flag-on + prefers-reduced-motion)', () => {
  test('still paints the hero once, without running the rAF loop', async ({
    browser,
  }) => {
    // `reducedMotion` isn't on the test-level `use()` fixture in this
    // Playwright version, but it IS on BrowserContextOptions — so we
    // spin up a dedicated context to emulate the preference.
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();

    try {
      await page.goto(HOME_URL, { waitUntil: 'networkidle' });
      await expectHtmlInCanvasAvailable(page);

      const canvas = page.locator('.hero-heading-canvas');
      await page.waitForFunction(() => {
        const c = document.querySelector<HTMLCanvasElement>(
          '.hero-heading-canvas',
        );
        return !!c && c.width > 0 && c.height > 0;
      });
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r(null))),
          ),
      );

      await expectCanvasNonBlank(canvas);
    } finally {
      await context.close();
    }
  });
});
