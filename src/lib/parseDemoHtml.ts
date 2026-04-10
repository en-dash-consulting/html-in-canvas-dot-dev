import { parse } from 'node-html-parser';

/**
 * A single demo script — either external (`src`) or inline (`body`).
 * The mount script materializes each entry as a real `<script>` element
 * and executes them in document order, awaiting external loads before
 * running subsequent inline scripts.
 */
export interface DemoScript {
  src?: string;
  type?: string;
  body: string;
}

/**
 * Parsed demo HTML, ready to inject into a shadow root.
 *
 * `styles` — concatenated CSS from every `<style>` tag in the source file.
 * `headLinks` — `<link rel="stylesheet">` and `<link rel="preconnect">`
 *               tags from `<head>`, serialized as HTML strings. These let
 *               shadow-mounted demos pull in external fonts/stylesheets
 *               that the standalone version loads via the document head.
 * `bodyContent` — the inner HTML of `<body>`, with `<script>` tags removed.
 *                 Safe to drop into a `<template>` and clone into a shadow
 *                 root: nothing in here will execute on insertion.
 * `scripts` — scripts in document order, both external and inline. The
 *             mount script re-materializes each as a real `<script>`
 *             element so they actually run. This split avoids the gotcha
 *             that scripts cloned out of `<template>` content can execute
 *             on insertion.
 */
export interface ParsedDemo {
  styles: string;
  headLinks: string;
  bodyContent: string;
  scripts: DemoScript[];
}

/**
 * Extract the styles + body content + scripts from a complete demo HTML
 * document.
 *
 * Demo files live as standalone HTML pages so they can be served and
 * "open-in-new-tab"'d directly. The wrapped demo route also needs to mount
 * them inside a shadow root in the parent page; that's what this function
 * supports.
 */
export function parseDemoHtml(html: string): ParsedDemo {
  const root = parse(html, {
    blockTextElements: {
      script: true,
      style: true,
    },
  });

  const styles = root
    .querySelectorAll('style')
    .map((el) => el.textContent)
    .join('\n');

  // Stylesheet/preconnect <link> tags from <head>. Including these in
  // the shadow root lets demos that pull Google Fonts (or other
  // external CSS) render with the same typography as their standalone
  // version. We deliberately exclude rel="icon" and friends.
  const head = root.querySelector('head');
  const linkRels = new Set(['stylesheet', 'preconnect', 'preload']);
  const headLinks = head
    ? head
        .querySelectorAll('link')
        .filter((el) => {
          const rel = (el.getAttribute('rel') ?? '').toLowerCase();
          return linkRels.has(rel);
        })
        .map((el) => el.toString())
        .join('\n')
    : '';

  const body = root.querySelector('body');
  if (!body) {
    throw new Error('parseDemoHtml: demo file is missing a <body>');
  }

  // Capture scripts in document order, then strip the script tags out
  // of the body before serializing. Both external (`src`) and inline
  // scripts are preserved; the mount script handles loading order.
  const scripts: DemoScript[] = [];
  for (const scriptEl of body.querySelectorAll('script')) {
    const src = scriptEl.getAttribute('src') ?? undefined;
    const type = scriptEl.getAttribute('type') ?? undefined;
    scripts.push({
      src,
      type,
      body: scriptEl.textContent ?? '',
    });
    scriptEl.remove();
  }

  return {
    styles,
    headLinks,
    bodyContent: body.innerHTML,
    scripts,
  };
}
