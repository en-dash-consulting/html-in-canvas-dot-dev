---
title: Open Questions
order: 5
---

# Open Questions & Issues

_Auto-synced from [`WICG/html-in-canvas` issues](https://github.com/WICG/html-in-canvas/issues) on 2026-04-14 via `scripts/sync-spec-docs.mjs`._

There are currently **16** open issues on the spec repository. Each heading below links to the upstream discussion — follow the link to read the full thread and leave a comment.

## [#112: 3D Room Live Content have an error](https://github.com/WICG/html-in-canvas/issues/112)

**Author:** [@ramistodev](https://github.com/ramistodev)

Hello, I am interested on this new HTML feature, and I want to try it for my self, but this site have a bug: [https://html-in-canvas.dev/demos/3d-room-live-content/demo.html](https://html-in-canvas.dev/demos/3d-room-live-content/demo.html) I can see the error in the developments tools, in the console appears this:

## [#107: CSS-in-Canvas: Flexbox layout of canvas renderables](https://github.com/WICG/html-in-canvas/issues/107)

**Author:** [@ShaMan123](https://github.com/ShaMan123)

I am interested in using CSS abilities as part of canvas rendering. Using CSS flexbox to layout canvas renderables is a need I have encountered a number of times in canvas products (a daunting task). The most common use case is the group object, grouping a number of canvas renderables, acting as the canvas counterpart of a div. Another common use case is …

## [#96: Need some way to access all canvas elements in a worker](https://github.com/WICG/html-in-canvas/issues/96)

**Author:** [@jakearchibald](https://github.com/jakearchibald)

If I call `requestPaint()` on an offscreen canvas, the `changedElements` on the paint event is going to be empty, which means I can't update the rendering. Maybe, instead of `changedElements`, it should just be `elements`, and a property on them could indicate if they've changed or not. This would also allow non-2d cases to avoid updating textures that do…

## [#95: changedElements should be a map?](https://github.com/WICG/html-in-canvas/issues/95)

**Author:** [@jakearchibald](https://github.com/jakearchibald)

From the demo: …it looks like `changedElements` should be a map.

## [#94: Hit testing and layer ordering](https://github.com/WICG/html-in-canvas/issues/94)

**Author:** [@jakearchibald](https://github.com/jakearchibald)

The current API has a somewhat high-level model for resolving hit testing, by giving you a transform that you can apply to your elements that puts them in the correct place. However, this doesn't cater for layer order, which is obviously an important part of getting hit-testing right. It feels like the high-level model should cater for this somehow.

## [#88: Lifetime of ElementImage objects](https://github.com/WICG/html-in-canvas/issues/88)

**Author:** [@foolip](https://github.com/foolip)

@Kaiido asked in https://github.com/WICG/html-in-canvas/pull/84#discussion_r2934398521 about the lifetime of `ElementImage` objects. For the `ElementImage` objects themselves, the options are to create new objects every time the "paint" event is fired, or to maintain one `ElementImage` object for every `Element` and make it "live", so that it's updated in…

## [#85: Feature request: add `removedElements` to the `paint` event](https://github.com/WICG/html-in-canvas/issues/85)

**Author:** [@progers](https://github.com/progers)

When granular invalidation is used to only re-draw the parts of the canvas that have changed, it would be convenient to provide a list of removed elements, in addition to the current list of changed elements. Here is an example that works with the current `changedElements`, but would be much simpler if we added `removedElements`:

## [#82: Enumerate new fingeprinting vectors](https://github.com/WICG/html-in-canvas/issues/82)

**Author:** [@Kaiido](https://github.com/Kaiido)

There is already a section about privacy, which focuses on the new read-back capabilities. However, the `onpaint` event also brings new fingerprinting vectors, even without readback, for instance it is now possible to determine the rate of the cursor blinking by appending an `&lt;input&gt;` element, focus it and then measure at what frequency the `onpaint…

## [#81: Use case: DOM capture / screenshot library (snapdom)](https://github.com/WICG/html-in-canvas/issues/81)

**Author:** [@tinchox5](https://github.com/tinchox5)

I’m the author of [snapdom](https://github.com/zumerlab/snapdom) a DOM capture library similar to html2canvas. The library converts DOM elements into images (PNG, JPEG, etc.) for things like screenshots, exports, and thumbnails. Right now snapdom renders through **SVG + `&lt;foreignObject&gt;`**, but we’re experimenting with a different path using **`draw…

## [#79: Feature request: allow effects like backdrop-filter, using the current canvas content as the backdrop root](https://github.com/WICG/html-in-canvas/issues/79)

**Author:** [@progers](https://github.com/progers)

Maybe this should work?

## [#77: Surface when cross-origin content has been omitted](https://github.com/WICG/html-in-canvas/issues/77)

**Author:** [@progers](https://github.com/progers)

With privacy-preserving painting, we do not draw cross-origin content. It would be helpful to surface when this happens to developers. An exception is too disruptive, and a console warning might be too noisy, but reporting this via the devtools "Issues" tab could be a useful middle ground.

## [#71: Replace webGL demo with one that is interactive](https://github.com/WICG/html-in-canvas/issues/71)

**Author:** [@progers](https://github.com/progers)

The current webGL demo draws the html content multiple times (once for each face of a cube), which cannot support interactivity. We should replace this demo with one that supports interactivity, such as a liquid glass effect.

## [#48: DOM trees that start with an element of "display: contents" fail to be drawn into the canvas](https://github.com/WICG/html-in-canvas/issues/48)

**Author:** [@itsdouges](https://github.com/itsdouges)

Take HTML that looks like this: Drawing it to the canvas: Results in this error:

## [#47: Blending effects aren't correctly reflected in the canvas](https://github.com/WICG/html-in-canvas/issues/47)

**Author:** [@itsdouges](https://github.com/itsdouges)

From my explorations I've noticed that these styles don't get correctly reflected in the canvas: - `mix-blend-mode` (seems to be applied twice, something's going on) - `backdrop-filter` (not applied at all)

## [#33: texHTMLElement should be texSubImage2D like, not texImage2D like or both should exist](https://github.com/WICG/html-in-canvas/issues/33)

**Author:** [@greggman](https://github.com/greggman)

`texImage2D` both allocates a mip level of a texture AND, optionally copies data into mip level. `texSubImage2D` only copies data. `texSubImage2D` is usable with immutable textures (textures created with `texStorage2D`). `texImage2D` is not. `texStorage2D` created textures can use less memory and be more efficient than `texImage2D` created textures.

## [#31: Support for animated images or videos?](https://github.com/WICG/html-in-canvas/issues/31)

**Author:** [@MaksymPylypenko](https://github.com/MaksymPylypenko)

How hard would it be to support animated stuff (eg. gifs, webp, webm, mp4) in the future?
