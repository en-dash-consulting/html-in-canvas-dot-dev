#!/usr/bin/env node
/**
 * Generate the default OG image (1200×630 px) for html-in-canvas.dev.
 *
 * Uses Playwright to render a self-contained HTML design with the En Dash
 * brand palette and Montserrat font, then screenshots it to public/og-image.png.
 *
 * Run: node scripts/generate-og-image.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { stat } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'public', 'og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;

/** Self-contained HTML for the OG card. */
const html = `<!DOCTYPE html>
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

  /* Decorative gradient orbs */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.35;
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

  /* Content layout */
  .content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 920px;
    padding: 0 60px;
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
    font-size: 64px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 20px;
    letter-spacing: -0.02em;
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
    max-width: 720px;
    margin: 0 auto;
  }

  /* Bottom bar */
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

  /* Subtle top border accent */
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

  <div class="content">
    <div class="eyebrow">WICG Specification</div>
    <h1 class="title">
      Render HTML into<br />Canvas <span class="accent">— natively</span>
    </h1>
    <p class="tagline">
      Draw fully-styled, accessible HTML content straight into
      &lt;canvas&gt; — no hacks, no libraries, no screenshots.
    </p>
  </div>

  <div class="bottom">
    <span class="domain">html-in-canvas.dev</span>
    <span class="brand">An <strong>En Dash</strong> project</span>
  </div>
</body>
</html>`;

async function main() {
  console.log('Launching browser…');
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  // Load the HTML and wait for the Google Font to finish loading.
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Extra safety: wait until Montserrat is loaded.
  await page.evaluate(() => document.fonts.ready);

  console.log('Taking screenshot…');
  await page.screenshot({
    path: OUTPUT,
    type: 'png',
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });

  await browser.close();

  const { size } = await stat(OUTPUT);
  const kb = (size / 1024).toFixed(1);
  console.log(`✓ Saved ${OUTPUT}`);
  console.log(`  ${WIDTH}×${HEIGHT} px  •  ${kb} KB`);

  if (size > 300 * 1024) {
    console.warn(`⚠ File exceeds 300 KB limit (${kb} KB). Consider optimizing.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
