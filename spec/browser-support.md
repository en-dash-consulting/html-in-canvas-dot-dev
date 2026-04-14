---
title: Browser Support
order: 6
---

# Browser Support

_Auto-synced from [`WICG/html-in-canvas` README](https://github.com/WICG/html-in-canvas/blob/main/README.md) on 2026-04-14 via `scripts/sync-spec-docs.mjs`._

## Status

This is a living explainer which is continuously updated as we receive feedback.

The APIs described here are implemented behind a flag in Chromium and can be enabled with `chrome://flags/#canvas-draw-element`.

## Developer Trial (dev trial) Information
The HTML-in-Canvas features may be enabled with `chrome://flags/#canvas-draw-element` in Chrome Canary.

We are most interested in feedback on the following topics:
* What content works, and what fails? Which failure modes are most important to fix?
* How does the feature interact with accessibility features? How can accessibility support be improved?

Please file bugs or design issues [here](https://github.com/WICG/html-in-canvas/issues/new).

## How to try it

You can run the demos on either Chrome Canary or a current Brave Stable — the flag lives in Chromium and rides along with any fork whose base milestone includes it.

### Option A — Chrome Canary

1. Install [Chrome Canary](https://www.google.com/chrome/canary/).
2. Visit `chrome://flags/#canvas-draw-element` and enable the flag.
3. Restart the browser.
4. Load any demo from the [demo gallery](/demos/).

### Option B — Brave Stable (Chromium 147+)

Confirmed working on [Brave](https://brave.com/) Stable 1.89.132 / Chromium 147.0.7727.56. Older builds may not expose the flag.

1. Update Brave to a current Stable build (Menu → Brave → About Brave triggers an update).
2. Visit `brave://flags/#canvas-draw-element` and enable the flag.
3. Restart the browser.
4. Load any demo from the [demo gallery](/demos/).

## Other browsers

- **Brave:** supported on recent Stable builds (≥ 1.89.132 / Chromium 147) behind `brave://flags/#canvas-draw-element`.
- **Firefox:** no implementation announced.
- **Safari / WebKit:** no implementation announced.
- **Edge / other Chromium forks:** the flag rides along wherever the underlying Chromium milestone has shipped the canvas-draw-element code. Try `chrome://flags/#canvas-draw-element` (or the fork's equivalent) on a recent build.

## Feedback

Browser vendors and contributors track discussion at <https://github.com/WICG/html-in-canvas/issues> — see the [Open Questions](/docs/open-questions/) page for the current list.
