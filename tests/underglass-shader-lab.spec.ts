import { test, expect, type Page } from '@playwright/test';
import { collectConsoleErrors, expectHtmlInCanvasAvailable } from './helpers';

/**
 * Underglass presents the demo's React tree through a WebGPU canvas, so
 * the standard smoke helper (which reads pixels through a 2D context)
 * does not apply. Instead, in both contexts:
 *
 * - wait for admission: GPU when the browser has a WebGPU adapter,
 *   otherwise ordinary DOM with a reason;
 * - in GPU mode, check that the visible canvas shows the artwork
 *   (many distinct colours in a screenshot of the art area);
 * - drive the real controls with mouse and keyboard (Playwright clicks
 *   where hit testing finds them) and check that React state and the
 *   artwork follow, and that GPU stays on.
 */

const SLUG = 'underglass-shader-lab';

type Mode = { mode: string; reason: string; initializing: boolean };

/** Reads the Underglass controller's state from the demo's #stage, in either context. */
async function state(page: Page): Promise<Mode | null> {
  return page.evaluate(() => {
    const root = document.getElementById('demo-stage')?.shadowRoot ?? document;
    const stage = root.getElementById('stage') as (HTMLElement & { underglass?: { state(): Mode } }) | null;
    const s = stage?.underglass?.state();
    return s ? { mode: s.mode, reason: s.reason, initializing: s.initializing } : null;
  });
}

/** Waits until admission has ended in GPU or in a diagnosed ordinary-DOM fallback. */
async function settledMode(page: Page): Promise<Mode> {
  let current: Mode | null = null;
  await expect
    .poll(
      async () => {
        current = await state(page);
        if (!current) return false;
        if (current.mode === 'gpu') return true;
        return current.mode === 'dom' && !current.initializing && !/startup|admission pending/i.test(current.reason);
      },
      { timeout: 20_000 },
    )
    .toBe(true);
  return current!;
}

async function hasWebGpuAdapter(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    return !!(gpu && (await gpu.requestAdapter().catch(() => null)));
  });
}

/** Counts distinct (coarsely quantised) colours in a screenshot of the art layer. */
async function artColours(page: Page): Promise<number> {
  const shot = await page.locator('.art').screenshot();
  return page.evaluate(async (base64) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob());
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    const seen = new Set<number>();
    for (let i = 0; i < data.length; i += 4 * 7) seen.add(((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4));
    return seen.size;
  }, shot.toString('base64'));
}

async function exercise(page: Page) {
  await expectHtmlInCanvasAvailable(page);
  const admitted = await settledMode(page);
  const gpuExpected = await hasWebGpuAdapter(page);
  if (gpuExpected) {
    expect(admitted.mode, admitted.reason).toBe('gpu');
    await expect(page.locator('#stage canvas')).toBeVisible();
    expect(await artColours(page), 'the GPU frame shows the artwork').toBeGreaterThan(40);
  } else {
    expect(admitted.mode).toBe('dom');
    await expect(page.locator('#mode')).toContainText('Ordinary DOM');
  }

  // Typing reaches the real input; the artwork's caption follows.
  const caption = page.locator('#lab-caption');
  await caption.click();
  await caption.fill('');
  await page.keyboard.type('Typed through the GPU');
  await expect(caption).toHaveValue('Typed through the GPU');
  await expect(page.locator('.art .caption')).toHaveText('Typed through the GPU');

  // Buttons and checkboxes take real clicks.
  await page.locator('#lab-sky').click();
  await expect(page.locator('.art .kicker')).toContainText('No. 08');
  await page.locator('#lab-ripple').click();
  await expect(page.locator('#lab-ripple')).toBeChecked();
  await expect(page.locator('#lab-feedback')).toContainText('Ripple 6px');
  await page.locator('#lab-clear').click();
  await expect(page.locator('#lab-feedback')).toHaveText('No effect: the original artwork.');

  if (gpuExpected) {
    expect((await state(page))?.mode, 'GPU stays on through the interactions').toBe('gpu');
    expect(await artColours(page), 'the GPU frame still shows the artwork').toBeGreaterThan(40);
  }
}

test.describe(`demo: ${SLUG}`, () => {
  test('standalone: admits, presents the artwork and keeps native input', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`/demos/${SLUG}/demo.html`);
    await exercise(page);
    expect(errors, `Console errors in standalone ${SLUG}:\n${errors.join('\n')}`).toEqual([]);
  });

  test('wrapped: mounts via shadow DOM, admits, presents the artwork and keeps native input', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(`/demos/${SLUG}/`);
    expect(
      await page.evaluate(() => !!document.getElementById('demo-stage')?.shadowRoot),
      'wrapped page should mount the demo in an open shadow root',
    ).toBe(true);
    await exercise(page);
    expect(errors, `Console errors in wrapped ${SLUG}:\n${errors.join('\n')}`).toEqual([]);
  });
});
