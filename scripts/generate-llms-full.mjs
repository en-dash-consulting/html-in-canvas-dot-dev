#!/usr/bin/env node
/**
 * Generate public/llms-full.txt — a single-file bundle of every spec
 * doc on the site, formatted for one-shot ingestion by LLMs.
 *
 * The shorter public/llms.txt lives alongside this and is maintained
 * by hand (table of contents, project overview, demo list).
 * llms-full.txt is the "give me everything" companion: full text of
 * every markdown file in spec/ concatenated with clear delimiters.
 *
 * Run: node scripts/generate-llms-full.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_DIR = join(ROOT, 'spec');
const OUT_PATH = join(ROOT, 'public', 'llms-full.txt');
const SITE_URL = 'https://html-in-canvas.dev';

/** Pull the frontmatter + first `# Heading` line out of a markdown doc
 *  so we can emit a clean delimiter block without repeating the
 *  frontmatter in the final file. */
function parseDoc(md) {
  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n?/);
  const body = fmMatch ? md.slice(fmMatch[0].length) : md;

  const titleMatch = /^title:\s*(.+)$/m.exec(fmMatch?.[1] ?? '');
  const orderMatch = /^order:\s*(\d+)$/m.exec(fmMatch?.[1] ?? '');

  return {
    title: titleMatch?.[1]?.replace(/^['"]|['"]$/g, '').trim() ?? 'Untitled',
    order: orderMatch ? Number(orderMatch[1]) : 999,
    body: body.trimStart(),
  };
}

async function main() {
  const entries = await readdir(SPEC_DIR, { withFileTypes: true });
  const docs = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const slug = entry.name.replace(/\.md$/, '');
    const raw = await readFile(join(SPEC_DIR, entry.name), 'utf-8');
    const { title, order, body } = parseDoc(raw);
    docs.push({ slug, title, order, body });
  }

  docs.sort((a, b) => a.order - b.order);

  const today = new Date().toISOString().slice(0, 10);
  const parts = [
    '# HTML-in-Canvas — Full Documentation',
    '',
    `> Single-file bundle of every spec doc on ${SITE_URL}. Generated ${today}.`,
    '> The shorter companion at /llms.txt has the project overview and',
    '> demo index; this file contains the full markdown of the spec docs',
    '> so an LLM can ingest the whole reference in one request.',
    '',
    '---',
    '',
  ];

  for (const doc of docs) {
    parts.push(`# ${doc.title}`);
    parts.push('');
    parts.push(`_Source: ${SITE_URL}/docs/${doc.slug}/_`);
    parts.push('');
    parts.push(doc.body.trimEnd());
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  await writeFile(OUT_PATH, parts.join('\n'));
  console.log(`✓ ${OUT_PATH}  (${docs.length} docs)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
