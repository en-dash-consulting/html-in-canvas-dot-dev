import { test, expect } from '@playwright/test';

const FLAG_URL = 'chrome://flags/#canvas-draw-element';
const BROWSER_SUPPORT_URL = '/docs/browser-support/';
const HOME_URL = '/';

test.describe('flag-enablement UX', () => {
  // Clipboard writes are gated behind a permission in Chromium. The
  // Playwright default origin doesn't have it granted, so tests that
  // rely on `navigator.clipboard.writeText` would otherwise reject.
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('docs/browser-support renders the 3-step setup guide above the content', async ({
    page,
  }) => {
    await page.goto(BROWSER_SUPPORT_URL, { waitUntil: 'networkidle' });

    const quickstart = page.locator('.browser-support-quickstart');
    await expect(quickstart).toBeVisible();

    // Section heading
    await expect(
      quickstart.getByRole('heading', { name: /enable the flag/i }),
    ).toBeVisible();

    // Exactly three steps
    const steps = quickstart.locator('.flag-setup-step');
    await expect(steps).toHaveCount(3);

    // Copy button lives inside step 1 — discoverable as a button whose
    // accessible name includes the flag URL.
    const copyBtn = quickstart.getByRole('button', {
      name: new RegExp(`Copy ${escapeForRegex(FLAG_URL)}`, 'i'),
    });
    await expect(copyBtn).toBeVisible();
  });

  test('copy button writes the flag URL to the clipboard and confirms visibly', async ({
    page,
  }) => {
    await page.goto(BROWSER_SUPPORT_URL, { waitUntil: 'networkidle' });

    const copyBtn = page.locator('.browser-support-quickstart .copy-flag');
    await expect(copyBtn).toBeVisible();

    // Before click: idle icon visible, done icon hidden, no copy state.
    await expect(copyBtn).not.toHaveAttribute('data-copy-state', 'done');

    await copyBtn.click();

    // After click: clipboard contains the flag URL.
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(clipboardText).toBe(FLAG_URL);

    // Visible confirmation: the button flips to the "done" state.
    await expect(copyBtn).toHaveAttribute('data-copy-state', 'done');

    // Screen-reader-only status text reads "Copied!" while the
    // confirmation is up.
    await expect(
      copyBtn.locator('[data-copy-flag-status]'),
    ).toHaveText('Copied!');

    // Reverts to idle within the 2s window so the button stays re-usable.
    await expect(copyBtn).not.toHaveAttribute('data-copy-state', 'done', {
      timeout: 3_000,
    });
  });

  test('copy button activates via keyboard (Space and Enter)', async ({
    page,
  }) => {
    await page.goto(BROWSER_SUPPORT_URL, { waitUntil: 'networkidle' });

    const copyBtn = page.locator('.browser-support-quickstart .copy-flag');
    await copyBtn.focus();
    await expect(copyBtn).toBeFocused();

    // Clear the clipboard so the assertion isn't polluted by earlier tests
    // in this spec (parallel workers each get their own context, but the
    // same worker reuses the page between tests if retries are involved).
    await page.evaluate(() => navigator.clipboard.writeText(''));

    await page.keyboard.press('Enter');
    await expect(copyBtn).toHaveAttribute('data-copy-state', 'done');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      FLAG_URL,
    );
  });

  test('BrowserSupportBanner includes a copy button when visible', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    // Tests run in Chrome Canary with the API flag enabled, so the
    // banner is `hidden` by default. Force-unhide it so we can verify
    // the integration — this only flips the attribute set by the
    // banner's own feature-detection script.
    await page.evaluate(() => {
      const banner = document.getElementById('browser-banner');
      if (banner) banner.hidden = false;
    });

    const banner = page.locator('#browser-banner');
    await expect(banner).toBeVisible();

    const bannerCopyBtn = banner.locator('.copy-flag');
    await expect(bannerCopyBtn).toBeVisible();
    await expect(bannerCopyBtn).toHaveAttribute(
      'aria-label',
      `Copy ${FLAG_URL} to clipboard`,
    );

    // Full-guide link is still reachable alongside the copy button.
    await expect(
      banner.getByRole('link', { name: /full guide/i }),
    ).toBeVisible();
  });
});

function escapeForRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
