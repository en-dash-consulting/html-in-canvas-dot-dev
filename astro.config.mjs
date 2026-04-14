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

/** @type {Map<string, { lastmod?: string; priority: number; changefreq: string }>} */
const sitemapHints = new Map();

const SITE_ROUTE_DEFAULTS = [
  { path: '/', priority: 1.0, changefreq: 'monthly' },
  { path: '/demos/', priority: 0.9, changefreq: 'weekly' },
  { path: '/docs/', priority: 0.8, changefreq: 'weekly' },
  { path: '/contributing/', priority: 0.6, changefreq: 'monthly' },
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

// https://astro.build/config
export default defineConfig({
  site: 'https://html-in-canvas.dev',
  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const hint = sitemapHints.get(pathname);
        if (!hint) return item;
        return {
          ...item,
          ...(hint.lastmod ? { lastmod: hint.lastmod } : {}),
          priority: hint.priority,
          changefreq: hint.changefreq,
        };
      },
    }),
    demosIntegration(),
  ],
});
