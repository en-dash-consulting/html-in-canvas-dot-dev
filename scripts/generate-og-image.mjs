#!/usr/bin/env node
/**
 * Generate OG card images (1200×630 px) for html-in-canvas.dev.
 *
 * Renders one card per page-class:
 *   - public/og-image.png       — home / default
 *   - public/og-docs.png        — shared across all docs pages
 *   - public/og-demos.png       — demo gallery landing page
 *   - public/og-demo-{slug}.png — one per demo, using meta.json
 *
 * Run: node scripts/generate-og-image.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public');
const DEMOS_DIR = join(ROOT, 'src', 'content', 'demos');
const LOGO_PATH = join(ROOT, 'scripts', 'assets', 'endash-logo.svg');

const WIDTH = 1200;
const HEIGHT = 630;
const SIZE_LIMIT_KB = 300;

const CONTEXT_LABELS = {
  '2d': '2D Canvas',
  webgl: 'WebGL',
  webgpu: 'WebGPU',
};

/** Inline the En Dash logo as a data URL so the renderer doesn't need
 *  to make a network request — Playwright's `setContent` runs at
 *  about:blank where relative paths can't resolve. */
async function loadLogoDataUrl() {
  const buf = await readFile(LOGO_PATH);
  return `data:image/svg+xml;base64,${buf.toString('base64')}`;
}

/** Build the HTML for a single OG card. */
function buildHtml({ eyebrow, titleLead, titleAccent, tagline }, logoDataUrl) {
  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const accentMarkup = titleAccent
    ? ` <span class="accent">${esc(titleAccent)}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    font-family: 'Montserrat', system-ui, sans-serif;
    background: #0a0a0f;
    color: #f0f0f0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  .orb-purple {
    width: 500px;
    height: 500px;
    background: #6C41F0;
    top: -120px;
    right: -80px;
    opacity: 0.2;
  }

  .orb-teal {
    width: 400px;
    height: 400px;
    background: #00e5b9;
    bottom: -100px;
    left: -60px;
    opacity: 0.15;
  }

  /* En Dash square logo, top-right. Kept small so it reads as
     attribution rather than a primary brand element. */
  .endash-logo {
    position: absolute;
    top: 28px;
    right: 28px;
    width: 72px;
    height: 72px;
    z-index: 2;
    opacity: 0.95;
  }

  .content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 980px;
    padding: 0 60px;
  }

  /* Prominent project wordmark above the eyebrow — establishes the
     html-in-canvas brand on every card without leaning on the small
     bottom-left domain text. */
  .wordmark {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: #f0f0f0;
    margin-bottom: 18px;
  }

  .wordmark .accent {
    background: linear-gradient(135deg, #6C41F0, #00e5b9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .eyebrow {
    display: inline-block;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #00e5b9;
    margin-bottom: 20px;
    padding: 6px 16px;
    border: 1px solid rgba(0, 229, 185, 0.3);
    border-radius: 100px;
  }

  .title {
    font-size: 56px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 20px;
    letter-spacing: -0.02em;
    /* Cap to two lines on busy demo titles. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .title .accent {
    background: linear-gradient(135deg, #6C41F0, #00e5b9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tagline {
    font-size: 22px;
    font-weight: 400;
    line-height: 1.5;
    color: #a0a0b8;
    max-width: 760px;
    margin: 0 auto;
    /* Cap to three lines so descriptions never collide with the bottom
       brand bar. */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 48px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .domain {
    font-size: 18px;
    font-weight: 600;
    color: #f0f0f0;
    letter-spacing: -0.01em;
  }

  .brand {
    font-size: 14px;
    font-weight: 500;
    color: #6a6a80;
  }

  .brand strong {
    color: #a0a0b8;
    font-weight: 600;
  }

  .top-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #6C41F0, #00e5b9, #6C41F0);
    z-index: 2;
  }
</style>
</head>
<body>
  <div class="top-accent"></div>
  <div class="orb orb-purple"></div>
  <div class="orb orb-teal"></div>
  <img class="endash-logo" src="${logoDataUrl}" alt="" />

  <div class="content">
    <div class="wordmark">HTML-in-<span class="accent">Canvas</span></div>
    <div class="eyebrow">${esc(eyebrow)}</div>
    <h1 class="title">${esc(titleLead)}${accentMarkup}</h1>
    <p class="tagline">${esc(tagline)}</p>
  </div>

  <div class="bottom">
    <span class="domain">html-in-canvas.dev</span>
    <span class="brand">A learning and demo site by <strong>En Dash</strong></span>
  </div>
</body>
</html>`;
}

/** Read every demo's meta.json and return the jobs to render. */
async function loadDemoJobs() {
  const entries = await readdir(DEMOS_DIR, { withFileTypes: true });
  const jobs = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_')) continue; // skip _template

    const metaPath = join(DEMOS_DIR, entry.name, 'meta.json');
    const meta = JSON.parse(await readFile(metaPath, 'utf-8'));
    const ctxLabel = CONTEXT_LABELS[meta.context] ?? meta.context ?? 'Demo';

    jobs.push({
      filename: `og-demo-${entry.name}.png`,
      eyebrow: `${ctxLabel} Demo`,
      titleLead: meta.title,
      titleAccent: '',
      tagline: meta.description,
    });
  }

  jobs.sort((a, b) => a.filename.localeCompare(b.filename));
  return jobs;
}

/** Render apple-touch-icon and PWA icon variants from the En Dash SVG.
 *  The source already has a navy background + teal border, so we just
 *  need to scale it to the right pixel dimensions. Generated alongside
 *  the social cards so we only spin up Playwright once per build. */
async function renderIcons(browser, logoDataUrl) {
  const variants = [
    { filename: 'apple-touch-icon.png', size: 180 },
    { filename: 'pwa-icon-512.png', size: 512 },
  ];

  for (const { filename, size } of variants) {
    const html = `<!DOCTYPE html><html><head><style>
      html, body { margin: 0; padding: 0; background: #001769; }
      img { display: block; width: ${size}px; height: ${size}px; }
    </style></head><body><img src="${logoDataUrl}" alt="" /></body></html>`;

    const iconPage = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await iconPage.setContent(html, { waitUntil: 'networkidle' });
    const outPath = join(OUT_DIR, filename);
    await iconPage.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: size, height: size },
      omitBackground: false,
    });
    await iconPage.close();

    const { size: bytes } = await stat(outPath);
    console.log(`✓ ${filename}  ${(bytes / 1024).toFixed(1)} KB`);
  }
}

async function renderJob(page, job, logoDataUrl) {
  const html = buildHtml(job, logoDataUrl);
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const outPath = join(OUT_DIR, job.filename);
  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });

  const { size } = await stat(outPath);
  const kb = (size / 1024).toFixed(1);
  const oversize = size > SIZE_LIMIT_KB * 1024;
  const tag = oversize ? '⚠' : '✓';
  console.log(`${tag} ${job.filename}  ${kb} KB`);
  return oversize;
}

async function main() {
  const homeJob = {
    filename: 'og-image.png',
    eyebrow: 'WICG Specification',
    titleLead: 'Render HTML into',
    titleAccent: 'Canvas — natively',
    tagline:
      'Draw fully-styled, accessible HTML content straight into <canvas> — no hacks, no libraries, no screenshots.',
  };

  const docsJob = {
    filename: 'og-docs.png',
    eyebrow: 'Documentation',
    titleLead: 'Spec reference,',
    titleAccent: 'browser support, FAQs',
    tagline:
      'Everything you need to start building with the WICG HTML-in-Canvas proposal — API surface, browser flags, and open questions.',
  };

  const demosLandingJob = {
    filename: 'og-demos.png',
    eyebrow: 'Live Demos',
    titleLead: 'Real apps,',
    titleAccent: 'real DOM, in <canvas>',
    tagline:
      'A growing collection of interactive demos exploring HTML-in-Canvas use cases — Three.js scenes, layered text, accessible charts, and more.',
  };

  const demoJobs = await loadDemoJobs();
  const jobs = [homeJob, docsJob, demosLandingJob, ...demoJobs];

  console.log(`Rendering ${jobs.length} OG cards…`);

  const logoDataUrl = await loadLogoDataUrl();

  // CI sets CHROME_CANARY_PATH to the Chrome Dev binary it installs for
  // the Playwright suite — reuse it here so the build doesn't need a
  // second `npx playwright install` step. Local runs fall back to the
  // bundled Playwright Chromium.
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_CANARY_PATH || undefined,
  });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  let anyOversize = false;
  for (const job of jobs) {
    const oversize = await renderJob(page, job, logoDataUrl);
    anyOversize = anyOversize || oversize;
  }

  await renderIcons(browser, logoDataUrl);

  await browser.close();

  if (anyOversize) {
    console.warn(`\n⚠ One or more cards exceed ${SIZE_LIMIT_KB} KB.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
