import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HOME_URL = '/';
const MOBILE_VIEWPORT = { width: 375, height: 667 } as const;
const DESKTOP_VIEWPORT = { width: 1280, height: 720 } as const;
const NARROW_VIEWPORT = { width: 320, height: 568 } as const;

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const GATING_IMPACTS = new Set(['critical', 'serious']);

test.describe('nav (desktop viewport)', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test('shows inline links and hides the hamburger', async ({ page }) => {
    await page.goto(HOME_URL);

    await expect(page.locator('.nav-links--desktop')).toBeVisible();
    await expect(
      page.locator('.nav-links--desktop').getByRole('link', { name: 'Demos' }),
    ).toBeVisible();

    await expect(page.locator('.nav-hamburger')).toBeHidden();
    await expect(page.locator('.nav-panel')).toBeHidden();
  });
});

test.describe('nav (mobile viewport)', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('shows the hamburger and hides the inline links', async ({ page }) => {
    await page.goto(HOME_URL);

    await expect(page.locator('.nav-links--desktop')).toBeHidden();
    await expect(page.locator('.nav-hamburger')).toBeVisible();
    // Panel exists in DOM but is display:none until opened.
    await expect(page.locator('.nav-panel')).toBeHidden();
  });

  test('theme toggle is reachable without opening the menu', async ({
    page,
  }) => {
    await page.goto(HOME_URL);
    const themeToggle = page.getByRole('button', {
      name: /toggle dark\/light mode/i,
    });
    await expect(themeToggle).toBeVisible();

    // Toggling flips <html data-theme> even with the menu closed.
    const before = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    await themeToggle.click();
    const after = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(after).not.toBe(before);
  });

  test('hamburger opens the panel, sets aria-expanded, and focuses the first link', async ({
    page,
  }) => {
    await page.goto(HOME_URL);
    const hamburger = page.locator('#nav-hamburger');

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    await hamburger.click();

    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.nav-panel')).toBeVisible();

    // First link in the panel now has focus.
    const firstLink = page
      .locator('.nav-panel')
      .getByRole('link', { name: 'Demos' });
    await expect(firstLink).toBeFocused();
  });

  test('Escape closes the panel and restores focus to the hamburger', async ({
    page,
  }) => {
    await page.goto(HOME_URL);
    const hamburger = page.locator('#nav-hamburger');

    await hamburger.click();
    await expect(page.locator('.nav-panel')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('.nav-panel')).toBeHidden();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(hamburger).toBeFocused();
  });

  test('outside click closes the panel', async ({ page }) => {
    await page.goto(HOME_URL);
    const hamburger = page.locator('#nav-hamburger');

    await hamburger.click();
    await expect(page.locator('.nav-panel')).toBeVisible();

    // Click somewhere outside the nav and panel — the hero heading is
    // safely far from both.
    await page.locator('main').click({ position: { x: 200, y: 300 } });

    await expect(page.locator('.nav-panel')).toBeHidden();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  test('focus is trapped: Tab past the last link wraps to the first', async ({
    page,
  }) => {
    await page.goto(HOME_URL);
    const hamburger = page.locator('#nav-hamburger');

    await hamburger.click();
    const panel = page.locator('.nav-panel');
    const links = panel.getByRole('link');
    const count = await links.count();
    expect(count).toBeGreaterThan(1);

    // Focus the last link directly, then Tab — should wrap to first.
    await links.nth(count - 1).focus();
    await page.keyboard.press('Tab');
    await expect(links.first()).toBeFocused();

    // And Shift+Tab from first wraps back to last.
    await page.keyboard.press('Shift+Tab');
    await expect(links.nth(count - 1)).toBeFocused();
  });

  test('clicking a panel link navigates, and the panel closes after the swap', async ({
    page,
  }) => {
    await page.goto(HOME_URL);
    const hamburger = page.locator('#nav-hamburger');
    await hamburger.click();

    const demosLink = page
      .locator('.nav-panel')
      .getByRole('link', { name: 'Demos' });
    await demosLink.click();

    await expect(page).toHaveURL(/\/demos\/$/);

    // After the route change, the panel must be closed — Astro's
    // `astro:after-swap` calls initNav() which resets aria-expanded.
    const hamburgerAfter = page.locator('#nav-hamburger');
    await expect(hamburgerAfter).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.nav-panel')).toBeHidden();
  });
});

test.describe('nav (narrow viewport — 320px)', () => {
  test.use({ viewport: NARROW_VIEWPORT });

  test('nav bar itself does not overflow its container', async ({ page }) => {
    await page.goto(HOME_URL);

    // Landing-page content (code blocks inside primitive cards) may
    // still introduce horizontal overflow at 320px — that's tracked
    // by the responsive polish feature. What we assert here is that
    // the NAV specifically renders inside the viewport, which is
    // this feature's responsibility.
    const overflow = await page.evaluate(() => {
      const header = document.querySelector('.site-header');
      const container = document.querySelector('.nav-container');
      if (!header || !container) return null;
      return {
        headerScroll: header.scrollWidth,
        headerClient: header.clientWidth,
        containerScroll: container.scrollWidth,
        containerClient: container.clientWidth,
        viewportWidth: window.innerWidth,
      };
    });

    expect(overflow).not.toBeNull();
    expect(overflow!.headerScroll).toBeLessThanOrEqual(
      overflow!.headerClient + 1,
    );
    expect(overflow!.containerScroll).toBeLessThanOrEqual(
      overflow!.containerClient + 1,
    );
    expect(overflow!.headerClient).toBeLessThanOrEqual(
      overflow!.viewportWidth + 1,
    );
  });
});

test.describe('nav (mobile viewport a11y)', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('no critical or serious axe violations with panel closed or open', async ({
    page,
  }) => {
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );

    // Closed state.
    let results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    let gating = results.violations.filter((v) =>
      GATING_IMPACTS.has(v.impact ?? ''),
    );
    expect(
      gating,
      `Mobile closed violations: ${JSON.stringify(gating, null, 2)}`,
    ).toEqual([]);

    // Open state. Wait for the panel's fade-in to complete — axe
    // samples computed colors, and if it runs mid-opacity-animation
    // the foreground reads as a blend of the link color and the
    // background, producing a false color-contrast violation.
    await page.locator('#nav-hamburger').click();
    await expect(page.locator('.nav-panel')).toBeVisible();
    await page.waitForFunction(() => {
      const panel = document.querySelector('.nav-panel');
      if (!panel) return false;
      return parseFloat(getComputedStyle(panel).opacity) === 1;
    });

    results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    gating = results.violations.filter((v) =>
      GATING_IMPACTS.has(v.impact ?? ''),
    );
    expect(
      gating,
      `Mobile open violations: ${JSON.stringify(gating, null, 2)}`,
    ).toEqual([]);
  });
});
