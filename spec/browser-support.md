---
title: Browser Support
order: 6
---

# Browser Support & How to Try It

## Current Status (April 2026)

- **Chromium/Chrome Canary:** Available behind a flag
  - Navigate to `chrome://flags/#canvas-draw-element`
  - Enable the flag and restart
- **Firefox:** No implementation announced
- **Safari/WebKit:** No implementation announced
- **Standards track:** WICG proposal (Web Incubator Community Group) — not yet a W3C spec

## Spec Maturity

This is a **living explainer**, not a formal spec yet. The API surface may change. Current areas of active iteration include:

- Hit testing model (issue #94)
- PaintEvent data structure (issue #95)
- Worker access patterns (issue #96)
- ElementImage lifecycle (issue #88)

## Three.js Integration

An experimental branch of three.js adds support:
- PR: https://github.com/mrdoob/three.js/pull/31233
- Adds HTML content as textures in three.js scenes
- Uses `texElementImage2D` under the hood

## Related Chrome Features

- `chrome://flags/#canvas-draw-element` — the main feature flag
- The feature participates in Chrome's origin trial / dev trial process
- Feedback requested at https://github.com/WICG/html-in-canvas/issues

## Key Chromium Contributors

- Philip Rogers (pdr@chromium.org) — primary author
- Chris Harrelson (chrishtr@chromium.org)
- Philip Jagenstedt (foolip@chromium.org)
- Khushal Sagar (khushalsagar@chromium.org)
- Vladimir Levin (vmpstr@chromium.org)
- Fernando Serboncini (fserb@chromium.org)
- Stephen Chenney (schenney@igalia.com) — Igalia
