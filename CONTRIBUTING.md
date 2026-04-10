# Contributing to html-in-canvas.dev

Thanks for being interested! This is a community resource and we welcome
PRs that add demos, fix bugs, improve docs, or polish the site.

The full step-by-step contributor guide lives on the site itself:
**[html-in-canvas.dev/contributing](https://html-in-canvas.dev/contributing/)**.

The very short version is below.

## Adding a demo

1. Fork and clone the repo, then `npm install`.
2. Scaffold a new demo folder:
   ```bash
   ./scripts/new-demo.sh my-demo-name
   ```
   This copies `src/content/demos/_template/` into a new folder.
3. Edit `src/content/demos/my-demo-name/meta.json` (title, description,
   tags, browser support).
4. Edit `src/content/demos/my-demo-name/demo.html` — that's the demo
   itself, a single self-contained HTML file. Authoring conventions
   are documented inline in the template.
5. Run the dev server in **Chrome Canary** (with the
   `canvas-draw-element` flag enabled):
   ```bash
   npm run dev
   ```
   Open `http://localhost:4321/demos/my-demo-name/`.
6. Add a Playwright smoke test at `tests/my-demo-name.spec.ts`:
   ```ts
   import { runDemoSmokeTests } from './helpers/demo-smoke';
   runDemoSmokeTests({ slug: 'my-demo-name' });
   ```
7. Run the suite:
   ```bash
   npm test
   ```
8. Open a PR.

## Authoring rules (the dual-context contract)

Every demo file is served in two contexts:

- **Standalone** at `/demos/{slug}/demo.html` — anyone can fork it
- **Mounted via shadow DOM** on the wrapped `/demos/{slug}/` page

Both contexts use the same source file. The two conventions that make
this work, both copied for free by the template:

1. CSS root rule uses a selector list, not just `body`:
   ```css
   body,
   :host {
     /* root styling here */
   }
   ```
   `body` matches the document body in standalone; `:host` matches the
   shadow host in mounted context.
2. JS scopes its DOM queries via `window.__demoRoot`:
   ```js
   const root = window.__demoRoot ?? document;
   const $ = (id) => root.getElementById(id);
   ```
   The wrapped page hands the script its shadow root via this transient
   global. In standalone, `window.__demoRoot` is undefined and `root`
   falls back to `document`.

A few more gotchas worth knowing about:

- Use `canvas.requestPaint()`, **not** `canvas.onpaint()`, when you
  need to schedule a repaint after a resize. `requestPaint` runs the
  browser's paint pipeline and generates the cached paint records that
  `drawElementImage()` depends on. Calling `onpaint()` directly throws
  "No cached paint record for element."
- Direct children of `<canvas layoutsubtree>` cannot use
  `position: absolute` — Chrome forces them to `position: static`. Use
  `display: grid` on the canvas with `grid-area: stack` on the children
  if you need to overlay them, plus CSS `transform` for offset within
  the cell.
- The element you pass to `drawElementImage()` must be a **direct**
  child of the canvas. Grandchildren throw "Only immediate children of
  the &lt;canvas&gt; element can be passed to DrawElementImage."
- When painting many copies of one element, only one of them can be
  the "real" DOM element for hit testing. Apply the returned
  `DOMMatrix` to that copy's CSS transform; the others are decoration.
- External scripts (Three.js etc.) are loaded via `<script src>` and
  execute in document order. The wrapped-page mount waits for each
  external script to load before running subsequent inline scripts.

## Bug reports

Open an issue with:

- Which demo / page is affected
- Chrome Canary version (`chrome://version`)
- Whether the `canvas-draw-element` flag is enabled
- Console errors (DevTools → Console)
- Steps to reproduce

## Code style

- Astro components use `<style>` blocks (scoped automatically)
- TypeScript for site infrastructure (`src/lib/`, `src/pages/`)
- Vanilla JS in demos so they're easy to fork without build tooling
- Don't add lint-disable / `@ts-ignore` to suppress diagnostics — fix
  the underlying issue or open a discussion

## License

By contributing, you agree that your contributions will be licensed
under the MIT License (see [`LICENSE`](./LICENSE)).
