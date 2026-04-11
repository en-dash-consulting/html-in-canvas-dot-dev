---
title: Browser Support
order: 6
---

# Browser Support

_Auto-synced from [`WICG/html-in-canvas` README](https://github.com/WICG/html-in-canvas/blob/main/README.md) on 2026-04-11 via `scripts/sync-spec-docs.mjs`._

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

1. Install [Chrome Canary](https://www.google.com/chrome/canary/) — the feature ships in Chromium's unstable channel.
2. Visit `chrome://flags/#canvas-draw-element` and enable the flag.
3. Restart the browser.
4. Load any demo from the [demo gallery](/demos/).

## Other browsers

- **Firefox:** no implementation announced.
- **Safari / WebKit:** no implementation announced.
- **Other Chromium forks:** the feature rides along wherever the Chromium unstable channel is shipped (Edge Canary, etc.).

## Feedback

Browser vendors and contributors track discussion at <https://github.com/WICG/html-in-canvas/issues> — see the [Open Questions](/docs/open-questions/) page for the current list.
