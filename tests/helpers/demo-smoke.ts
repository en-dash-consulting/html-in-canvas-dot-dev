import { test, expect, type Page, type Locator } from '@playwright/test';
import {
  collectConsoleErrors,
  expectCanvasNonBlank,
  expectHtmlInCanvasAvailable,
} from '../helpers';

/**
 * Per-demo smoke test options.
 *
 * `slug` — folder name under src/content/demos/.
 *
 * `canvasSelector` — CSS selector for the canvas to verify. Defaults to
 *  `canvas` (matches any canvas in the document); demos with multiple
 *  canvases should pass a more specific selector.
 *
 * `setup` — optional async hook that runs after the page loads but
 *  before the canvas-non-blank assertion. Use to dismiss intro overlays,
 *  click "start", etc.
 *
 * `interact` — optional async hook that runs custom interactions after
 *  the initial paint check, then re-asserts the canvas remains non-blank.
 *  Use to verify the demo responds to user input.
 *
 * `extraIgnoredErrors` — substrings of console error messages that
 *  should be filtered out (use sparingly — prefer fixing the underlying
 *  cause). Most demos should not need this.
 *
 * `firstPaintTimeoutMs` — how long to wait for canvas dimensions to be
 *  set before sampling pixels. Demos with heavy initialization (Three.js,
 *  workers) may need a larger value. Default 5000.
 *
 * `skipPixelCheck` — true for demos that use OffscreenCanvas via
 *  `transferControlToOffscreen()`, where the main thread can no longer
 *  read pixels from the canvas. The smoke test still verifies the demo
 *  loads, mounts, and produces no console errors.
 */
export interface DemoSmokeOptions {
  slug: string;
  canvasSelector?: string;
  setup?: (page: Page) => Promise<void>;
  interact?: (page: Page, canvas: Locator) => Promise<void>;
  extraIgnoredErrors?: string[];
  firstPaintTimeoutMs?: number;
  skipPixelCheck?: boolean;
}

/**
 * Wait for the demo's canvas to have non-zero pixel dimensions, then
 * give it one rAF to flush its first paint.
 */
async function waitForFirstPaint(
  page: Page,
  canvasSelector: string,
  timeoutMs: number,
) {
  await page.waitForFunction(
    (sel) => {
      // Walk open shadow roots to find the canvas if needed.
      function findCanvas(root: Document | ShadowRoot): HTMLCanvasElement | null {
        const direct = root.querySelector(sel) as HTMLCanvasElement | null;
        if (direct) return direct;
        const hosts = root.querySelectorAll('*');
        for (const host of Array.from(hosts)) {
          const sr = (host as Element).shadowRoot;
          if (sr) {
            const found = findCanvas(sr);
            if (found) return found;
          }
        }
        return null;
      }
      const c = findCanvas(document);
      return !!c && c.width > 0 && c.height > 0;
    },
    canvasSelector,
    { timeout: timeoutMs },
  );
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
  );
}

/**
 * Generate the standard pair of smoke tests (standalone + wrapped) for a
 * demo. Call once per demo from its spec file:
 *
 *     import { runDemoSmokeTests } from './helpers/demo-smoke';
 *     runDemoSmokeTests({ slug: 'accessible-charts' });
 */
export function runDemoSmokeTests(options: DemoSmokeOptions): void {
  const {
    slug,
    canvasSelector = 'canvas',
    setup,
    interact,
    extraIgnoredErrors = [],
    firstPaintTimeoutMs = 5000,
    skipPixelCheck = false,
  } = options;

  const STANDALONE_URL = `/demos/${slug}/demo.html`;
  const WRAPPED_URL = `/demos/${slug}/`;

  function filterErrors(errors: string[]): string[] {
    return errors.filter(
      (e) => !extraIgnoredErrors.some((needle) => e.includes(needle)),
    );
  }

  test.describe(`demo: ${slug}`, () => {
    test('standalone: paints non-blank canvas with no console errors', async ({
      page,
    }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(STANDALONE_URL);
      await expectHtmlInCanvasAvailable(page);

      if (setup) await setup(page);

      await waitForFirstPaint(page, canvasSelector, firstPaintTimeoutMs);

      const canvas = page.locator(canvasSelector).first();
      await expect(canvas).toBeVisible();
      if (!skipPixelCheck) await expectCanvasNonBlank(canvas);

      if (interact) await interact(page, canvas);

      const filtered = filterErrors(errors);
      expect(
        filtered,
        `Console errors in standalone ${slug}:\n${filtered.join('\n')}`,
      ).toEqual([]);
    });

    test('wrapped: mounts via shadow DOM and paints non-blank canvas', async ({
      page,
    }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(WRAPPED_URL);
      await expectHtmlInCanvasAvailable(page);

      // Confirm the wrapped page actually mounted via shadow DOM.
      const stageHasShadow = await page.evaluate(() => {
        const stage = document.getElementById('demo-stage');
        return !!stage?.shadowRoot;
      });
      expect(
        stageHasShadow,
        `wrapped ${slug}: #demo-stage should have an open shadow root`,
      ).toBe(true);

      if (setup) await setup(page);

      await waitForFirstPaint(page, canvasSelector, firstPaintTimeoutMs);

      const canvas = page.locator(canvasSelector).first();
      await expect(canvas).toBeVisible();
      if (!skipPixelCheck) await expectCanvasNonBlank(canvas);

      if (interact) await interact(page, canvas);

      const filtered = filterErrors(errors);
      expect(
        filtered,
        `Console errors in wrapped ${slug}:\n${filtered.join('\n')}`,
      ).toEqual([]);
    });
  });
}
