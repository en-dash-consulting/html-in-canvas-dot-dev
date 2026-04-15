#!/usr/bin/env node
/**
 * Smoke-tests for manual-pass WCAG items axe doesn't fully check:
 *   - One and only one <h1> per page, and no heading-level skips
 *   - Every focusable interactive element receives a visible focus ring
 *     (outline width ≥ 2px on :focus-visible)
 *   - Every <canvas> has either layoutsubtree children (which provide the
 *     accessibility tree per HTML-in-Canvas spec) or an aria-label
 *
 * Run against the dev server:
 *   node scripts/a11y-manual-checks.mjs
 */
import { chromium } from '@playwright/test';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

const CANARY_PATHS = [
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  process.env.CHROME_CANARY_PATH,
].filter(Boolean);
const canaryPath = CANARY_PATHS.find((p) => existsSync(p));
if (!canaryPath) {
  console.error('Chrome Canary not found');
  process.exit(1);
}

function listDemoSlugs() {
  return readdirSync(join(PROJECT_ROOT, 'src/content/demos'), {
    withFileTypes: true,
  })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}
function listDocSlugs() {
  return readdirSync(join(PROJECT_ROOT, 'spec'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

const ROUTES = [
  '/',
  '/demos/',
  ...listDemoSlugs().map((s) => `/demos/${s}/`),
  '/docs/',
  ...listDocSlugs().map((s) => `/docs/${s}/`),
  '/contributing/',
];

const browser = await chromium.launch({
  executablePath: canaryPath,
  args: ['--enable-blink-features=CanvasDrawElement'],
});

const problems = [];

for (const route of ROUTES) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(BASE_URL + route, { waitUntil: 'networkidle' });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );

    // ── Heading hierarchy ─────────────────────────────────────────
    const headings = await page.evaluate(() => {
      const hs = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
      return hs.map((h) => ({
        level: Number(h.tagName[1]),
        text: h.textContent.trim().slice(0, 60),
      }));
    });
    const h1s = headings.filter((h) => h.level === 1);
    if (h1s.length === 0) {
      problems.push(`${route}: no <h1>`);
    } else if (h1s.length > 1) {
      problems.push(`${route}: ${h1s.length} <h1> elements`);
    }
    // Detect level skips (e.g. h2 → h4)
    let prev = 0;
    for (const h of headings) {
      if (prev > 0 && h.level - prev > 1) {
        problems.push(
          `${route}: heading skip h${prev} → h${h.level} ("${h.text}")`,
        );
      }
      prev = h.level;
    }

    // ── Canvas a11y ───────────────────────────────────────────────
    const canvases = await page.evaluate(() => {
      const results = [];
      // Canvas elements live inside the demo shadow root on /demos/{slug}/
      const stage = document.getElementById('demo-stage');
      const roots = [document];
      if (stage?.shadowRoot) roots.push(stage.shadowRoot);
      for (const root of roots) {
        for (const c of root.querySelectorAll('canvas')) {
          results.push({
            hasChildren: c.children.length > 0,
            hasAriaLabel:
              c.hasAttribute('aria-label') ||
              c.hasAttribute('aria-labelledby'),
            textContent: c.textContent.trim().slice(0, 40),
          });
        }
      }
      return results;
    });
    for (const [idx, c] of canvases.entries()) {
      if (!c.hasChildren && !c.hasAriaLabel) {
        problems.push(
          `${route}: canvas #${idx} has no layoutsubtree children and no aria-label`,
        );
      }
    }

    // ── Focus ring ────────────────────────────────────────────────
    // Walk keyboard focus through the first several tab stops and
    // verify each focused element has a visible outline. Keyboard tab
    // (not programmatic .focus()) is what triggers :focus-visible.
    // Cap the walk at 30 stops — if the site has fewer, great; if more,
    // we've sampled enough to catch a broken global focus style.
    await page.evaluate(() => document.body.focus());
    const offenders = [];
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const tag = el.tagName.toLowerCase();
        // Ignore Astro's dev toolbar (injected in dev mode, not shipped
        // in the production bundle) and the shadow-host for a demo
        // (shadow content owns its own focus styling and the host
        // itself just proxies focus — outline on the host is not the
        // user-visible indicator).
        if (tag === 'astro-dev-toolbar') return { skip: true };
        if (el.id === 'demo-stage') return { skip: true };
        const style = getComputedStyle(el);
        const outlineWidth = parseFloat(style.outlineWidth);
        return {
          key: `${el.tagName}.${el.className}`,
          tag,
          cls: (el.className || '').slice(0, 30),
          outlineOk:
            outlineWidth >= 2 && style.outlineStyle !== 'none',
          outline: `${style.outlineWidth} ${style.outlineStyle}`,
        };
      });
      if (info && info.skip) continue;
      if (!info) break;
      if (seen.has(info.key)) continue;
      seen.add(info.key);
      if (!info.outlineOk) {
        offenders.push(info);
      }
    }
    for (const o of offenders.slice(0, 3)) {
      problems.push(
        `${route}: no focus ring on ${o.tag}${o.cls ? '.' + o.cls : ''} (outline: ${o.outline})`,
      );
    }
  } catch (err) {
    problems.push(`${route}: ERROR ${err.message}`);
  } finally {
    await ctx.close();
  }
}

await browser.close();

if (problems.length === 0) {
  console.log('✓ Manual-pass smoke checks all clean across', ROUTES.length, 'routes');
} else {
  console.log(`✗ ${problems.length} issue(s):`);
  for (const p of problems) console.log('  ' + p);
  process.exit(1);
}
