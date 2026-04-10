---
title: Design Decisions
order: 3
---

# Design Decisions & Rationale

## Why `layoutsubtree` as an attribute?

The attribute serves as an explicit opt-in. Without it, canvas children are fallback content (for accessibility when canvas isn't supported). With it, children are promoted to first-class participants in layout and hit testing, but remain invisible until drawn.

This dual role is key: the same elements serve as both the visual content (when drawn) and the accessibility tree. They're not separate — they're one and the same.

## Why CSS transforms on source elements are ignored

When drawing an element, the canvas CTM controls positioning. If CSS transforms were also applied, you'd get double-positioning — the element's own CSS transform would compound with the canvas transform.

Instead, CSS transforms are reserved for the synchronization step: after drawing, you set `element.style.transform` to the value returned by `drawElementImage()` so that the DOM position matches the drawn position. This separation keeps drawing and synchronization clean.

**Important consequence:** Changing an element's CSS transform does NOT trigger a `paint` event, because transforms don't affect the element's painted output (only its position).

## Why `paint` fires after Paint (Option C)

Three options were considered for when the `paint` event fires:

**Option A — Resize observer timing (looping):** Would require synchronous Paint of canvas children, which is expensive and has implementation challenges in Gecko. Also, WebGL APIs like `getError()` would cause deadlocks when flushing.

**Option B — After Paint with looping:** Even more expensive — more rendering steps run per loop iteration.

**Option C — After Paint, no looping (chosen):** Runs once per frame. DOM changes during paint apply to the next frame. This mirrors the browser's own Paint step behavior. The key insight: by the time paint fires, the rendering update is locked in, except for the canvas content itself.

## Why `drawElementImage` returns a DOMMatrix

Returning the synchronization transform directly from the draw call makes the common pattern trivial:

```js
element.style.transform = ctx.drawElementImage(element, x, y).toString();
```

The alternative would be a separate `getElementTransform()` call (which exists for WebGL/WebGPU where the transform isn't a simple 2D operation).

## Why direct children only?

Restricting to direct children keeps the API simple and the containment model clear. Each drawn element has paint containment, is a containing block for its descendants, and has a stacking context. This means:

- The element's rendering is self-contained
- Overflow is predictable (clipped to border box)
- Z-ordering within the element follows normal CSS rules
- The canvas author controls the ordering of top-level elements

## Why `captureElementImage` instead of direct worker access?

Workers can't access the DOM. Rather than creating a complex proxy mechanism, the design captures a snapshot as a transferable `ElementImage` object. This fits the existing `Transferable` pattern (like `ImageBitmap`) and keeps the worker API simple — workers just call `drawElementImage()` with an `ElementImage` instead of an `Element`.

The trade-off: you need main-thread code to capture and transfer, and the transform needs to be communicated back to the main thread for synchronization.

## Why not `foreignObject`?

SVG `foreignObject` already allows HTML in a graphics context, but:

1. It runs in the SVG rendering model, not the canvas model
2. No access to canvas 2D API transforms
3. No WebGL/WebGPU integration
4. Can't use canvas pixel manipulation
5. Performance characteristics differ
6. No `requestAnimationFrame`-style control

HTML-in-Canvas is designed for the canvas use case specifically.

## Why not `html2canvas`?

Libraries like `html2canvas` re-implement browser rendering in JavaScript. They're:

1. Incomplete — can't handle all CSS
2. Slow — re-parsing and re-rendering
3. Inaccurate — miss browser-specific rendering
4. Large — significant JS payload
5. Not interactive — produce static snapshots

HTML-in-Canvas uses the browser's actual rendering engine, so it's complete, fast, accurate, small, and supports full interactivity.

## Privacy model

The design follows a principle of not exposing information that isn't already available to JavaScript. Cross-origin content, system themes, visited links, spell-check indicators, and autofill previews are all excluded from painting.

The key insight: since `drawElementImage` makes pixels readable via `getImageData()`, anything drawn must be "same-origin-equivalent" safe. This is the same security model as tainted canvases, applied proactively.

Some new information IS exposed:
- Form control rendering (already detectable via foreignObject)
- Caret blink rate (low-entropy)
- forced-colors mode (already queryable via media query)
