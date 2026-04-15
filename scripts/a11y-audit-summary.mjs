#!/usr/bin/env node
/**
 * Headless a11y audit summary. Launches Chrome Canary (same binary/flags as
 * the Playwright suite), visits every public route, runs axe-core with
 * WCAG 2.1 A/AA tags, and prints a compact per-route + aggregate summary.
 *
 * Run against a live dev server:
 *   npm run dev -- --port 4321   # in another shell
 *   node scripts/a11y-audit-summary.mjs
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor'];

const CANARY_PATHS = [
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  process.env.CHROME_CANARY_PATH,
].filter(Boolean);
const canaryPath = CANARY_PATHS.find((p) => existsSync(p));
if (!canaryPath) {
  console.error('Chrome Canary not found. Set CHROME_CANARY_PATH.');
  process.exit(1);
}

function listDemoSlugs() {
  const dir = join(PROJECT_ROOT, 'src/content/demos');
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => e.name)
    .sort();
}
function listDocSlugs() {
  const dir = join(PROJECT_ROOT, 'spec');
  return readdirSync(dir)
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

const aggregate = new Map(); // ruleId -> { impact, routes: Set, nodeCount }
const perRoute = [];

for (const route of ROUTES) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(BASE_URL + route, { waitUntil: 'networkidle' });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r(null))),
    );
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of results.violations) {
      const impact = v.impact || 'minor';
      counts[impact] = (counts[impact] || 0) + v.nodes.length;
      const agg = aggregate.get(v.id) || {
        impact,
        routes: new Set(),
        nodeCount: 0,
        help: v.help,
        helpUrl: v.helpUrl,
      };
      agg.routes.add(route);
      agg.nodeCount += v.nodes.length;
      aggregate.set(v.id, agg);
    }
    perRoute.push({ route, counts, violations: results.violations });
  } catch (err) {
    perRoute.push({ route, error: String(err) });
  } finally {
    await ctx.close();
  }
}

await browser.close();

// ─ Per-route summary ─────────────────────────────────────────────────
console.log('\n=== Per-route violation counts ===');
const pad = (s, n) => s.padEnd(n);
console.log(
  pad('route', 50),
  pad('crit', 6),
  pad('serious', 8),
  pad('mod', 6),
  pad('minor', 6),
);
for (const r of perRoute) {
  if (r.error) {
    console.log(pad(r.route, 50), `ERROR: ${r.error}`);
    continue;
  }
  console.log(
    pad(r.route, 50),
    pad(String(r.counts.critical), 6),
    pad(String(r.counts.serious), 8),
    pad(String(r.counts.moderate), 6),
    pad(String(r.counts.minor), 6),
  );
}

// ─ Aggregate by rule ─────────────────────────────────────────────────
console.log('\n=== Violations grouped by rule ===');
const sorted = [...aggregate.entries()].sort((a, b) => {
  const ai = IMPACT_ORDER.indexOf(a[1].impact);
  const bi = IMPACT_ORDER.indexOf(b[1].impact);
  if (ai !== bi) return ai - bi;
  return b[1].nodeCount - a[1].nodeCount;
});
for (const [ruleId, agg] of sorted) {
  console.log(
    `\n[${agg.impact}] ${ruleId} — ${agg.help}`,
    `\n  ${agg.helpUrl}`,
    `\n  ${agg.nodeCount} node(s) across ${agg.routes.size} route(s):`,
  );
  for (const route of [...agg.routes].sort()) {
    console.log(`    • ${route}`);
  }
}

// ─ Example nodes per rule ────────────────────────────────────────────
console.log('\n=== Example selectors per rule ===');
for (const [ruleId] of sorted) {
  const examples = new Set();
  for (const r of perRoute) {
    if (r.error) continue;
    for (const v of r.violations) {
      if (v.id !== ruleId) continue;
      for (const node of v.nodes.slice(0, 3)) {
        examples.add(JSON.stringify(node.target));
      }
      if (examples.size >= 5) break;
    }
    if (examples.size >= 5) break;
  }
  console.log(`\n${ruleId}:`);
  for (const ex of examples) console.log(`  ${ex}`);
}

// ─ Per-route detail — violations with nodes ──────────────────────────
if (process.env.A11Y_DETAIL) {
  console.log('\n=== Per-route detail ===');
  for (const r of perRoute) {
    if (r.error || !r.violations || r.violations.length === 0) continue;
    console.log(`\n--- ${r.route} ---`);
    for (const v of r.violations) {
      console.log(`  [${v.impact}] ${v.id} — ${v.help}`);
      for (const node of v.nodes) {
        console.log(`    target: ${JSON.stringify(node.target)}`);
        if (node.failureSummary) {
          console.log(
            `    ${node.failureSummary.replace(/\n/g, '\n    ')}`,
          );
        }
        if (node.html) {
          const snippet = node.html.slice(0, 200).replace(/\n/g, ' ');
          console.log(`    html: ${snippet}`);
        }
      }
    }
  }
}
