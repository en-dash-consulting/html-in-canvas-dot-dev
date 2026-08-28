/**
 * @astrojs/sitemap always emits sitemap-index.xml + sitemap-0.xml, even
 * for a ~30 URL site. Crawlers (and humans) expect /sitemap.xml to be a
 * urlset, not an index of one shard. Copy the shard to sitemap.xml,
 * retarget the index at it so old Search Console submissions still
 * work, then drop the odd sitemap-0.xml filename.
 */
import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

const chunk = 'dist/sitemap-0.xml';
const index = 'dist/sitemap-index.xml';
const out = 'dist/sitemap.xml';
const site = 'https://html-in-canvas.dev';

if (!existsSync(chunk)) {
  throw new Error('expected dist/sitemap-0.xml from @astrojs/sitemap');
}

copyFileSync(chunk, out);

const xml = readFileSync(out, 'utf8');
if (!xml.includes('<urlset')) {
  throw new Error('sitemap.xml must be a urlset, not a sitemapindex');
}
if (!xml.includes(`${site}/demos/vgpu-shader/`)) {
  throw new Error('vgpu-shader is missing from the sitemap');
}

writeFileSync(
  index,
  `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${site}/sitemap.xml</loc></sitemap></sitemapindex>\n`,
);

unlinkSync(chunk);
console.log('flattened dist/sitemap-0.xml -> dist/sitemap.xml');
