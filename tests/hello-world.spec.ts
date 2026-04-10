import { test, expect } from '@playwright/test';
import {
  collectConsoleErrors,
  expectCanvasNonBlank,
  expectHtmlInCanvasAvailable,
} from './helpers';

const STANDALONE_URL = '/demos/hello-world/demo.html';
const WRAPPED_URL = '/demos/hello-world/';

test.describe('hello-world demo (standalone)', () => {
  test('paints initial content and responds to interactions', async ({ page }) => {
    const DEMO_URL = STANDALONE_URL;
    const errors = collectConsoleErrors(page);

    await page.goto(DEMO_URL);
    await expectHtmlInCanvasAvailable(page);

    const canvas = page.locator('#canvas');
    await expect(canvas).toBeVisible();

    // Wait for the first paint cycle to complete (ResizeObserver fires
    // after layout, which schedules onpaint).
    await page.waitForFunction(() => {
      const c = document.getElementById('canvas') as HTMLCanvasElement | null;
      return !!c && c.width > 0 && c.height > 0;
    });
    // Give the paint event one frame to land.
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );

    await expectCanvasNonBlank(canvas);

    // ── Interaction 1: edit text and confirm canvas re-renders ─────
    const textInput = page.locator('#text-input');
    await textInput.fill('Updated');
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );
    await expect(page.locator('#content')).toHaveText('Updated');
    await expectCanvasNonBlank(canvas);

    // ── Interaction 2: copies slider updates the badge counter ─────
    const copiesInput = page.locator('#copies-input');
    await copiesInput.fill('20');
    await expect(page.locator('#copy-count')).toHaveText('20');
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );
    await expectCanvasNonBlank(canvas);

    // ── Interaction 3: speed slider ─────────────────────────────────
    const speedInput = page.locator('#speed-input');
    await speedInput.fill('150');
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );
    await expectCanvasNonBlank(canvas);

    expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
  });
});

test.describe('hello-world demo (wrapped page)', () => {
  test('mounts in a shadow root and supports text selection', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto(WRAPPED_URL);
    await expectHtmlInCanvasAvailable(page);

    // ── Shadow root attached to #demo-stage ─────────────────────────
    const stageHasShadow = await page.evaluate(() => {
      const stage = document.getElementById('demo-stage');
      return !!stage?.shadowRoot;
    });
    expect(stageHasShadow, 'demo-stage should have an open shadow root').toBe(true);

    // Playwright's locators auto-pierce open shadow roots, so we can
    // address shadow-encapsulated elements with normal selectors.
    const canvas = page.locator('#canvas');
    await expect(canvas).toBeVisible();

    // Wait for the demo's first paint cycle
    await page.waitForFunction(() => {
      const stage = document.getElementById('demo-stage');
      const c = stage?.shadowRoot?.getElementById('canvas') as
        | HTMLCanvasElement
        | null;
      return !!c && c.width > 0 && c.height > 0;
    });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );

    await expectCanvasNonBlank(canvas);

    // ── Text input updates the painted text ─────────────────────────
    await page.locator('#text-input').fill('Wrapped!');
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );
    await expect(page.locator('#content')).toHaveText('Wrapped!');

    // ── Hero copy is positioned somewhere visible (not at -10000px) ─
    // After the paint cycle the hero #content should have its CSS
    // transform synced to the painted hero position. Its bounding rect
    // must be inside the demo stage, not far off-screen.
    const layout = await page.evaluate(() => {
      const stage = document.getElementById('demo-stage');
      const content = stage?.shadowRoot?.getElementById('content');
      if (!stage || !content) return null;
      const sr = stage.getBoundingClientRect();
      const cr = content.getBoundingClientRect();
      return {
        stage: { left: sr.left, top: sr.top, right: sr.right, bottom: sr.bottom },
        content: { left: cr.left, top: cr.top, right: cr.right, bottom: cr.bottom },
      };
    });
    expect(layout, 'should be able to read layout').not.toBeNull();
    expect(
      layout!.content.left,
      'hero copy should be inside the stage horizontally',
    ).toBeGreaterThan(layout!.stage.left - 10);
    expect(layout!.content.right).toBeLessThan(layout!.stage.right + 10);
    expect(layout!.content.top).toBeGreaterThan(layout!.stage.top - 10);
    expect(layout!.content.bottom).toBeLessThan(layout!.stage.bottom + 10);

    // ── Text selection: select a substring, verify it isn't the whole thing ─
    // The whole point of switching to shadow DOM was to make text
    // selection work char-by-char on the painted hero copy. Drag-select
    // a portion of the content and confirm the selection contains some
    // — but not all — of the text.
    const selectionResult = await page.evaluate(() => {
      const stage = document.getElementById('demo-stage');
      const content = stage?.shadowRoot?.getElementById('content');
      if (!stage || !content) return null;

      const range = document.createRange();
      const textNode = content.firstChild;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;

      // Select characters 1..5 of "Wrapped!" → "rappe"
      range.setStart(textNode, 1);
      range.setEnd(textNode, 6);

      // Selection inside a shadow root lives on the shadow root itself
      // in browsers that support it; the DOM Selection API is per-tree.
      const sel =
        (stage.shadowRoot as any).getSelection?.() ?? window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return sel.toString();
    });

    expect(
      selectionResult,
      'should be able to programmatically select a substring of the hero text',
    ).toBe('rappe');

    expect(errors, `Console errors: ${errors.join('\n')}`).toEqual([]);
  });
});
