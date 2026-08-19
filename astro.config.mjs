// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { demosIntegration } from './src/integrations/demos';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------
// Pre-load per-URL sitemap hints from source-of-truth files so the
// @astrojs/sitemap `serialize` callback can emit accurate lastmod and
// priority values. Done at config-load time because `serialize` is sync
// and runs once per URL.
// ---------------------------------------------------------------------

/** @typedef {import('@astrojs/sitemap').ChangeFreq} ChangeFreq */
/** @typedef {{ lastmod?: string; priority: number; changefreq: ChangeFreq }} SitemapHint */
/** @type {Map<string, SitemapHint>} */
const sitemapHints = new Map();

/** @type {ReadonlyArray<SitemapHint & { path: string }>} */
const SITE_ROUTE_DEFAULTS = [
  { path: '/', priority: 1.0, changefreq: 'monthly' },
  { path: '/demos/', priority: 0.9, changefreq: 'weekly' },
  { path: '/docs/', priority: 0.8, changefreq: 'weekly' },
  { path: '/contributing/', priority: 0.6, changefreq: 'monthly' },
  { path: '/render-html-to-canvas/', priority: 0.8, changefreq: 'monthly' },
];
for (const route of SITE_ROUTE_DEFAULTS) sitemapHints.set(route.path, route);

// Per-demo lastmod pulled from each meta.json's dateUpdated / dateCreated.
const demosDir = 'src/content/demos';
for (const entry of readdirSync(demosDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  try {
    const meta = JSON.parse(
      readFileSync(join(demosDir, entry.name, 'meta.json'), 'utf-8'),
    );
    sitemapHints.set(`/demos/${entry.name}/`, {
      lastmod: meta.dateUpdated ?? meta.dateCreated,
      priority: 0.7,
      changefreq: 'monthly',
    });
  } catch {
    // skip demos with unreadable metadata
  }
}

// Per-doc lastmod pulled from file mtime — spec/*.md is rewritten by
// scripts/sync-spec-docs.mjs, so mtime reflects the last upstream sync.
const docsDir = 'spec';
for (const entry of readdirSync(docsDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
  const slug = entry.name.replace(/\.md$/, '');
  const stats = statSync(join(docsDir, entry.name));
  sitemapHints.set(`/docs/${slug}/`, {
    lastmod: stats.mtime.toISOString().slice(0, 10),
    priority: 0.6,
    changefreq: 'monthly',
  });
}

// Hub pages get a lastmod too: each hub inherits the max lastmod of
// its children (a hub's content changes when a child is added or
// updated), and the home page gets the newest content date site-wide.
// /contributing/ has no child URLs, so it uses its own source file's
// mtime — the same mtime-based signal the docs pages use.

/** @param {(string | undefined)[]} dates ISO YYYY-MM-DD strings */
const maxDate = (dates) => {
  const defined = dates.filter((d) => typeof d === 'string');
  // ISO dates sort lexicographically, so string max is date max.
  return defined.length
    ? defined.reduce((a, b) => (a > b ? a : b))
    : undefined;
};

/** @param {string} prefix */
const childLastmods = (prefix) =>
  [...sitemapHints.entries()]
    .filter(([path]) => path.startsWith(prefix) && path !== prefix)
    .map(([, hint]) => hint.lastmod);

const demosLastmod = maxDate(childLastmods('/demos/'));
const docsLastmod = maxDate(childLastmods('/docs/'));
const contributingLastmod = statSync('src/pages/contributing/index.astro')
  .mtime.toISOString()
  .slice(0, 10);
// Standalone article page — same mtime-based signal /contributing/ uses.
const renderHtmlToCanvasLastmod = statSync(
  'src/pages/render-html-to-canvas.astro',
)
  .mtime.toISOString()
  .slice(0, 10);

/** @type {Record<string, string | undefined>} */
const hubLastmods = {
  '/': maxDate([demosLastmod, docsLastmod]),
  '/demos/': demosLastmod,
  '/docs/': docsLastmod,
  '/contributing/': contributingLastmod,
  '/render-html-to-canvas/': renderHtmlToCanvasLastmod,
};
for (const [path, lastmod] of Object.entries(hubLastmods)) {
  const hint = sitemapHints.get(path);
  if (hint && lastmod) sitemapHints.set(path, { ...hint, lastmod });
}

// https://astro.build/config
export default defineConfig({
  site: 'https://html-in-canvas.dev',
  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const hint = sitemapHints.get(pathname);
        if (!hint) return item;
        // sitemap's `SitemapItemLoose.changefreq` is typed as the nominal
        // `EnumChangefreq` (a string-valued enum), so a bare string literal
        // isn't assignable. The runtime value IS one of the enum's string
        // members — the cast just tells TypeScript that.
        return {
          ...item,
          ...(hint.lastmod ? { lastmod: hint.lastmod } : {}),
          priority: hint.priority,
          changefreq: /** @type {import('sitemap').EnumChangefreq} */ (
            hint.changefreq
          ),
        };
      },
    }),
    demosIntegration(),
  ],
});
