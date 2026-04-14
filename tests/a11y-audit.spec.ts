import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result as AxeViolation } from 'axe-core';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));

function listDemoSlugs(): string[] {
  const dir = join(PROJECT_ROOT, 'src/content/demos');
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}

function listDocSlugs(): string[] {
  const dir = join(PROJECT_ROOT, 'spec');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

const ROUTES: string[] = [
  '/',
  '/demos/',
  ...listDemoSlugs().map((s) => `/demos/${s}/`),
  '/docs/',
  ...listDocSlugs().map((s) => `/docs/${s}/`),
  '/contributing/',
];

// WCAG 2.1 AA: the target conformance level. axe's tag vocabulary layers
// A/AA across WCAG 2.0 and 2.1, so we include all four.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Gate the build on critical/serious only. Moderate/minor surface in the
// report but do not fail — they get triaged by the remediation phase.
const GATING_IMPACTS = new Set(['critical', 'serious']);

function formatTarget(target: unknown): string {
  // axe's target is a possibly-nested array for shadow-DOM selectors.
  if (Array.isArray(target)) return target.map(formatTarget).join(' >> ');
  return String(target);
}

function formatViolations(route: string, violations: AxeViolation[]): string {
  if (violations.length === 0) return `${route}: no violations`;
  const lines: string[] = [`${route}:`];
  for (const v of violations) {
    lines.push(
      `  [${v.impact ?? 'n/a'}] ${v.id} — ${v.help}`,
      `    ${v.helpUrl}`,
    );
    for (const node of v.nodes.slice(0, 5)) {
      lines.push(`    • ${formatTarget(node.target)}`);
    }
    if (v.nodes.length > 5) {
      lines.push(`    … and ${v.nodes.length - 5} more`);
    }
  }
  return lines.join('\n');
}

test.describe('a11y audit (WCAG 2.1 AA)', () => {
  for (const route of ROUTES) {
    test(`${route} has no critical or serious violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });

      // Canvas demos render async — give the page a frame after load so
      // dynamic content (fonts, canvas paints, shadow-root mounts) settles.
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => r(null))),
      );

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      const report = formatViolations(route, results.violations);
      // Always emit the full report to the test log so baseline runs are
      // useful even when no violations exist.
      console.log(report);

      const gating = results.violations.filter((v) =>
        GATING_IMPACTS.has(v.impact ?? ''),
      );
      expect(gating, `Critical/serious a11y violations on ${route}`).toEqual([]);
    });
  }
});
