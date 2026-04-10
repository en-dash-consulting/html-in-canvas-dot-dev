---
title: Open Questions
order: 5
---

# Open Questions & Issues

Tracked at https://github.com/WICG/html-in-canvas/issues

## Active Design Issues

### Hit testing and layer ordering (#94)
**Author:** jakearchibald  
How should hit testing work when elements are drawn at different positions or overlapping? Layer ordering between drawn elements and canvas-drawn content isn't well-defined.

### changedElements should be a map? (#95)
**Author:** jakearchibald  
Whether `PaintEvent.changedElements` should be a different data structure to provide more information about what changed.

### Need some way to access all canvas elements in a worker (#96)
**Author:** jakearchibald  
Feature request for worker thread access patterns beyond `captureElementImage`. Current worker story requires capturing and transferring individual elements.

### Lifetime of ElementImage objects (#88)
**Author:** foolip  
Memory management and lifecycle of `ElementImage` snapshots needs clarification.

### Feature request: removedElements in paint event (#85)
**Author:** progers  
How to know when a canvas child has been removed from the DOM. Currently the paint event only reports changed elements, not removed ones.

### Feature request: backdrop-filter effects (#79)
**Author:** progers  
Allow effects like backdrop-filter that reference current canvas content, not just element content.

### Surface when cross-origin content has been omitted (#77)
**Author:** progers  
Should there be an explicit signal when cross-origin content is excluded from painting for privacy reasons?

### Enumerate new fingerprinting vectors (#82)
**Author:** Kaiido  
Need a comprehensive analysis of new fingerprinting surface area.

## Active Bugs

### DOM trees with display: contents fail (#48)
Elements starting with `display: contents` don't render properly.

### Blending effects not reflected correctly (#47)
CSS blending modes like mix-blend-mode aren't accurately captured.

### Demos are broken (#108)
As of April 2026, some live demos need fixes.

## API Design Discussions (Closed but informative)

### drawHTMLElement naming (#32) — Closed
Debated renaming to `drawHTMLElement`/`texHTMLElement` but settled on `drawElementImage`/`texElementImage2D`.

### texSubImage2D-like vs texImage2D-like (#33) — Reopened
Whether WebGL API should be more like `texSubImage2D` for partial updates.

### Async drawing (#62) — Closed
Explored making drawing async with full render steps but rejected for complexity.

### devicePixelRatio interaction (#30) — Closed
Clarified how canvas grid coordinates relate to CSS pixels and DPR.

### OffscreenCanvas support (#2) — Closed
Led to the `captureElementImage()` + transferable `ElementImage` design.

### Nested canvas (#46) — Closed
Nested canvas with layoutsubtree is not supported.

## Feature Requests

### CSS-in-Canvas / Flexbox layout (#107)
Request for CSS layout primitives (flexbox) for canvas rendering, separate from HTML elements.

### Animated images / video support (#31) — Reopened
Whether `<video>` and animated GIF/APNG should work inside drawn elements.

### Interactive WebGL demo (#71)
Request to make the WebGL example interactive rather than just display.

### DOM capture / snapdom use case (#81)
Using the API for screenshot/DOM capture libraries.

## Future Considerations (from the spec)

### Auto-updating canvas mode
For threaded effects (scrolling, animations), the spec envisions a future mode where `drawElementImage` records placeholders and the canvas command buffer auto-replays with updated content after scroll/animation updates, without blocking on script. Viable for 2D, possibly WebGPU.

### Worker thread effects
A design was explored where canvas children snapshots are sent to workers for threaded scroll/animation rendering, but rejected because it requires synchronous JS execution on scroll updates, which is architecturally difficult in restricted processes.
