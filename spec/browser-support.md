---
title: Browser Support
order: 6
---

# Browser Support

_Auto-synced from [`WICG/html-in-canvas` README](https://github.com/WICG/html-in-canvas/blob/main/README.md) on 2026-10-29 via `scripts/sync-spec-docs.mjs`._

> **Chrome 157:** the upstream text below still describes the flag. Chrome 157 ships the API on by default; see [How to try it](#how-to-try-it).

## Status

This is a living explainer which is continuously updated as we receive feedback.

The APIs described here are implemented behind a flag in Chromium and can be enabled with `chrome://flags/#canvas-draw-element`.

## Developer Trial Information

HTML-in-Canvas can be tried today by enabling *both* `chrome://flags/#canvas-draw-element` and `chrome://flags/#enable-experimental-web-platform-features` in Chrome Canary.

We are most interested in feedback on the following topics:
* What content works, and what fails? Which failure modes are most important to fix?
* How does the feature interact with accessibility features? How can accessibility support be improved?

Please file API feedback [here](https://github.com/WICG/html-in-canvas/issues/new), and Chromium implementation bugs [here](https://issues.chromium.org/u/0/issues/new?pli=1&component=1456440&template=0).

## How to try it

### Chrome 157 and later

HTML-in-Canvas is on by default in Chrome 157. Early Stable started rolling out in late October 2026 and full Stable is scheduled for November 3, 2026. There is no flag or origin trial token to set.

1. Update Chrome from `chrome://settings/help` (or [download it](https://www.google.com/chrome/)).
2. Load any demo from the [demo gallery](/demos/).

### Chromium 147–156 and Brave

Older Chromium builds have the API behind a flag. Brave Stable 1.89.132 / Chromium 147.0.7727.56 and later work this way.

1. Visit `chrome://flags/#canvas-draw-element` (`brave://flags/#canvas-draw-element` in Brave) and enable the flag.
2. Relaunch the browser.
3. Load any demo from the [demo gallery](/demos/).

### Checking for support in your own code

Check for the API, not the browser version:

```js
const supported = 'drawElementImage' in CanvasRenderingContext2D.prototype;
```

Use the result to pick between the native path and a fallback such as html2canvas.

## Attribute naming: `layoutsubtree` vs `content="drawable"`

Chrome 157 renamed the canvas opt-in: `<canvas layoutsubtree>` became `<canvas content="drawable">` (`HTMLCanvasElement.content`), and every element passed to `drawElementImage()` must now carry a `drawable` attribute. Without them the call throws `InvalidStateError` inside `onpaint`, which usually surfaces as a silently blank canvas. Chromium 156 and earlier, including current Brave Stable, only understand `layoutsubtree`. Each build ignores the attribute it doesn't know, so this site sets both:

```html
<canvas layoutsubtree content="drawable">
  <div drawable>…</div>
</canvas>
```

## Other browsers

- **Chrome:** on by default in 157+. Behind `chrome://flags/#canvas-draw-element` in 147–156.
- **Brave:** behind `brave://flags/#canvas-draw-element` on Stable builds ≥ 1.89.132 / Chromium 147.
- **Firefox:** no implementation — [details below](#firefox-support).
- **Safari / WebKit:** no implementation announced.
- **Edge / other Chromium forks:** they usually follow Chromium's defaults, so expect the API on Chromium 157+ builds. On older builds, try `chrome://flags/#canvas-draw-element` (or the fork's equivalent).

## Firefox support

HTML-in-Canvas does not work in Firefox today. There is no implementation and no flag to enable — `drawElementImage()`, `layoutsubtree`, and the WebGL/WebGPU element-texture methods are unavailable, so the live demos on this site need Chrome 157+ or another Chromium-based browser.

Where Firefox actually stands:

- Mozilla's formal review is open but undecided: [mozilla/standards-positions#1076](https://github.com/mozilla/standards-positions/issues/1076) (opened September 2024) is still marked "needs proposed position" — no position, positive or negative, has been published.
- No Gecko implementation work has been announced.

What works in Firefox today: the library approach — snapshotting DOM to canvas with html2canvas-style tools — runs in every browser, Firefox included. See [Render HTML to canvas: native API vs. html2canvas](/render-html-to-canvas/) for the comparison and code.

This page is refreshed from the upstream spec repo, so Firefox status changes land here when they happen.

## Feedback

Browser vendors and contributors track discussion at <https://github.com/WICG/html-in-canvas/issues> — see the [Open Questions](/docs/open-questions/) page for the current list.
