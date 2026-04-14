import { test, expect } from '@playwright/test';

const HOME_URL = '/';

const BREAKPOINTS: Array<{ name: string; width: number; height: number }> = [
  { name: '320 (iPhone SE / small)', width: 320, height: 568 },
  { name: '375 (iPhone X)', width: 375, height: 812 },
  { name: '414 (iPhone Plus)', width: 414, height: 896 },
  { name: '768 (iPad portrait)', width: 768, height: 1024 },
  { name: '1024 (iPad landscape / small desktop)', width: 1024, height: 768 },
  { name: '1280 (desktop)', width: 1280, height: 800 },
];

test.describe('responsive polish: no horizontal page overflow', () => {
  for (const bp of BREAKPOINTS) {
    test(`landing page fits the viewport at ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(HOME_URL, { waitUntil: 'networkidle' });

      // Report what's causing overflow (if any) for easier debugging.
      const snapshot = await page.evaluate(() => {
        const worst: {
          tag: string;
          cls: string;
          id: string;
          w: number;
          right: number;
        }[] = [];
        const viewport = window.innerWidth;
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > viewport + 1) {
            worst.push({
              tag: el.tagName,
              cls:
                (el as HTMLElement).className?.toString().slice(0, 40) ?? '',
              id: el.id,
              w: Math.round(r.width),
              right: Math.round(r.right),
            });
          }
        });
        return {
          bodyScroll: document.body.scrollWidth,
          bodyClient: document.body.clientWidth,
          docScroll: document.documentElement.scrollWidth,
          docClient: document.documentElement.clientWidth,
          viewport,
          worst: worst.slice(0, 5),
        };
      });

      expect(
        snapshot.bodyScroll,
        `body scroll overflows at ${bp.name}. Top offenders: ${JSON.stringify(
          snapshot.worst,
          null,
          2,
        )}`,
      ).toBeLessThanOrEqual(snapshot.bodyClient + 1);

      expect(
        snapshot.docScroll,
        `document scroll overflows at ${bp.name}`,
      ).toBeLessThanOrEqual(snapshot.docClient + 1);
    });
  }
});

test.describe('responsive polish: card content respects its column', () => {
  test('primitive cards do not exceed the viewport at 320px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(HOME_URL, { waitUntil: 'networkidle' });

    const widths = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>('.primitive-card'),
      );
      return cards.map((c) => ({
        width: Math.round(c.getBoundingClientRect().width),
        right: Math.round(c.getBoundingClientRect().right),
      }));
    });

    for (const w of widths) {
      expect(w.right, `primitive-card right edge: ${w.right}`).toBeLessThanOrEqual(321);
    }
  });
});
