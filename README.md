# html-in-canvas.dev

> Interactive demos and documentation for the WICG **HTML-in-Canvas**
> specification — render real, styled, accessible DOM elements
> directly into a `<canvas>` via `drawElementImage()`.

[**html-in-canvas.dev →**](https://html-in-canvas.dev) ·
[Demo gallery](https://html-in-canvas.dev/demos/) ·
[Spec docs](https://html-in-canvas.dev/docs/) ·
[Contributing](https://html-in-canvas.dev/contributing/)

A community resource maintained by [En Dash Consulting](https://endash.us)
that shows what becomes possible when the browser can paint live HTML
into a canvas: real text editing, native i18n, accessible chart labels,
video recording from HTML scenes, GPU shader effects on DOM content, and
3D scenes that use HTML elements as textures.

The relevant Chromium feature ships behind
`chrome://flags/#canvas-draw-element` in **Chrome Canary**. Other
browsers have not announced implementations yet.

---

## Why HTML-in-Canvas

Canvas is great for pixels. The DOM is great for everything else —
text shaping, accessibility, internationalization, form controls,
contenteditable, focus management, hit testing, screen readers. Until
now, putting the two together meant either:

- Hand-rolling text layout into `ctx.fillText()` (no bidi, no shaping,
  no writing modes, no ruby, broken emoji)
- Shipping a 130 KB `html2canvas` clone that approximates CSS rendering
  in JavaScript (slow, incomplete, never quite right)

The WICG HTML-in-Canvas proposal lets the browser do what it's already
great at — render HTML and CSS — and gives canvas authors zero-cost
access to those pixels. Three primitives:

```html
<canvas layoutsubtree>
  <div id="content">Real, accessible HTML content</div>
</canvas>
```

```js
const ctx = canvas.getContext('2d');
canvas.onpaint = () => {
  const transform = ctx.drawElementImage(content, 0, 0);
  if (transform) content.style.transform = transform.toString();
};
```

That's the whole API surface. Every demo on the site is built from those
primitives plus the existing canvas (2D / WebGL / WebGPU) APIs.

---

## Quick start

```bash
git clone https://github.com/en-dash-consulting/html-in-canvas-dot-dev.git
cd html-in-canvas-dot-dev
npm install
npm run dev
```

Visit `http://localhost:4321` in **Chrome Canary** with the
`canvas-draw-element` flag enabled. Setup instructions:
[/docs/browser-support/](https://html-in-canvas.dev/docs/browser-support/).

### Available scripts

| script             | what it does                                                |
| ------------------ | ----------------------------------------------------------- |
| `npm run dev`      | Run the Astro dev server with hot reload                    |
| `npm run build`    | Build the static site to `dist/`                            |
| `npm run preview`  | Preview the built site                                      |
| `npm run check`    | Run `astro check` (type-check Astro + TS)                   |
| `npm test`         | Run the Playwright suite against Chrome Canary              |
| `npm run test:ui`  | Run Playwright with the interactive UI                      |

### Tech stack

- [Astro 6](https://astro.build/) — static site generation, content
  collections, file-based routing
- TypeScript for the site infrastructure (vanilla JS in the demos
  themselves so they're easy to fork)
- [Playwright](https://playwright.dev/) for end-to-end tests against
  Chrome Canary
- Zero runtime framework — every demo is plain HTML/CSS/JS in a single
  file, mounted into the wrapped page via shadow DOM

---

## How the site works

### Demos

Each demo lives in its own folder under `src/content/demos/{slug}/`:

```
src/content/demos/hello-world/
├── meta.json    # title, description, tags, browser support
└── demo.html    # the demo itself (single self-contained file)
```

Drop a new folder in there with the same shape and it appears in the
gallery automatically. The contributing page has a step-by-step guide
and there's a scaffold script:

```bash
./scripts/new-demo.sh my-cool-demo
```

Each `demo.html` is authored to work in **two contexts**:

1. As a **standalone HTML page** at `/demos/{slug}/demo.html`. Anyone
   can visit it directly, fork it from the GitHub repo, or open it in
   their own editor. This is what makes the site useful as a learning
   resource — you can grab any demo and run it locally with zero build
   tooling.
2. **Mounted via shadow DOM** on the wrapped `/demos/{slug}/` page,
   alongside metadata, the source viewer, and page chrome.

The dual-context authoring is glued together by two small conventions:

- Use `body, :host { ... }` instead of just `body { ... }` for root
  styling. The `:host` selector matches the shadow host in mounted
  context; `body` matches in standalone.
- Use `const root = window.__demoRoot ?? document` at the top of every
  script, then `root.getElementById(...)` for queries. The wrapped
  page hands the script its shadow root via a transient global.

These conventions are documented in the `_template/demo.html`
contributor template — just copy it.

### Pages

- `/` — landing page
- `/demos/` — filterable gallery
- `/demos/{slug}/` — wrapped demo page with metadata + source viewer
- `/demos/{slug}/demo.html` — standalone demo (open in new tab,
  fork on GitHub, etc.)
- `/docs/` — spec docs synced from the WICG proposal
- `/contributing/` — how to add a demo

### Tests

Every demo has a Playwright smoke test:

```ts
import { runDemoSmokeTests } from './helpers/demo-smoke';
runDemoSmokeTests({ slug: 'hello-world' });
```

The shared helper tests both contexts:

1. **Standalone** (`/demos/{slug}/demo.html`) — page loads, canvas
   paints non-blank pixels, no console errors.
2. **Wrapped** (`/demos/{slug}/`) — `#demo-stage` has an open shadow
   root, the canvas inside it paints, no console errors.

The full suite runs in a few seconds against Chrome Canary. See
`tests/helpers/demo-smoke.ts` for the runner and `playwright.config.ts`
for the Chrome Canary launch config (the bundled Chromium that ships
with Playwright doesn't expose the spec, so we point at Canary
directly).

---

## Contributing

We welcome PRs that add demos, fix bugs, improve the docs, or refine the
site itself. The full contributor guide is at
**[/contributing/](https://html-in-canvas.dev/contributing/)**, but the
short version is:

1. Fork the repo
2. Run `./scripts/new-demo.sh my-demo-name` (or copy
   `src/content/demos/_template/`)
3. Edit `meta.json` and `demo.html`
4. Run `npm test` to make sure your demo paints in both standalone and
   wrapped contexts
5. Open a PR

Some good first contributions:

- A demo of a spec primitive that isn't currently shown
- A real-world use case for HTML-in-Canvas you've hit at work
- A bug fix or visual polish on an existing demo
- Tests for an existing demo's interactive behavior beyond the smoke
  test (the smoke helper has `setup` / `interact` hooks)

## License

MIT — see [`LICENSE`](./LICENSE).

The WICG HTML-in-Canvas spec itself is licensed separately by the
[Web Incubator Community Group](https://github.com/WICG/html-in-canvas).
This project is an unaffiliated community resource and is not endorsed
by the spec authors or by Chromium.

---

## Acknowledgements

- The [WICG HTML-in-Canvas](https://github.com/WICG/html-in-canvas)
  authors and contributors who proposed and shipped the spec —
  especially Philip Rogers, Stephen Chenney (Igalia), Chris Harrelson,
  Philip Jagenstedt, Khushal Sagar, Vladimir Levin, and Fernando
  Serboncini
- The Chromium team for the dev-trial implementation behind
  `canvas-draw-element`
- Built with care by [En Dash Consulting](https://endash.us). We build
  tools that make work better and feel better.
