import { test, expect } from '@playwright/test';

const WRAPPED_URL = '/demos/hello-world/';

test.describe('source viewer expand toggle', () => {
  test('clips preview by default and expands on click', async ({ page }) => {
    await page.goto(WRAPPED_URL);

    const panel = page.locator('.source-viewer .source-panel.active');
    await expect(panel).toBeVisible();

    const content = panel.locator('.source-panel-content');
    const button = panel.locator('.expand-btn');

    // ── Initial state: clipped, button reads "Expand" ─────────────
    await expect(button).toHaveText(/expand/i);
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    const clippedHeight = await content.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    );
    // Preview is ~11rem ≈ 176px at the default 16px root font.
    expect(clippedHeight).toBeLessThan(220);
    expect(clippedHeight).toBeGreaterThan(80);

    // The unclipped scrollHeight should be larger than the clipped height —
    // this is what proves the preview is actually clipping content.
    const scrollHeight = await content.evaluate(
      (el) => (el as HTMLElement).scrollHeight,
    );
    expect(scrollHeight).toBeGreaterThan(clippedHeight + 20);

    // ── Click expand: full height visible, button reads "Collapse" ─
    await button.click();
    await expect(button).toHaveText(/collapse/i);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveClass(/is-expanded/);

    const expandedHeight = await content.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    );
    expect(expandedHeight).toBeGreaterThanOrEqual(scrollHeight - 1);

    // ── Click collapse: returns to clipped state ───────────────────
    await button.click();
    await expect(button).toHaveText(/expand/i);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).not.toHaveClass(/is-expanded/);

    const reClippedHeight = await content.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    );
    expect(reClippedHeight).toBeLessThan(220);
  });

  test('button is keyboard-activatable', async ({ page }) => {
    await page.goto(WRAPPED_URL);
    const button = page.locator('.source-viewer .expand-btn').first();
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(button).toHaveText(/collapse/i);
    await page.keyboard.press('Space');
    await expect(button).toHaveText(/expand/i);
  });

  /*
   * Per-file independence: each panel's expand/collapse state lives on
   * its own .source-panel element via the .is-expanded class. The toggle
   * handler reads/writes only the panel it's attached to, and tab
   * switching does not touch those classes — so multiple files can be
   * in different states simultaneously.
   *
   * This isn't asserted with a Playwright test because no current demo
   * has more than one source file (every src/content/demos/*\/ folder
   * has only demo.html besides meta.json). When a multi-file demo lands,
   * add a test here that expands one tab, switches tabs, switches back,
   * and confirms the first tab is still expanded.
   */
});
