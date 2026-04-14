---
title: Spec Overview
order: 1
---

# HTML-in-Canvas Spec Overview

**Source:** https://github.com/WICG/html-in-canvas  
**Status:** Living explainer, continuously updated. Dev trial behind `chrome://flags/#canvas-draw-element` in Chrome Canary, and also available in recent Brave Stable builds (≥ 1.89.132 / Chromium 147) at `brave://flags/#canvas-draw-element`.  
**Authors:** Philip Rogers (pdr@chromium.org), Stephen Chenney (Igalia), Chris Harrelson, Philip Jagenstedt, Khushal Sagar, Vladimir Levin, Fernando Serboncini (all Chromium)

## Problem

There is no web API to render complex HTML layouts into a `<canvas>`. Canvas-based content (games, charts, creative tools, 3D scenes) suffers in:

- **Accessibility** — canvas fallback content doesn't reliably match what's rendered
- **Internationalization** — canvas text APIs can't handle RTL, vertical text, complex scripts
- **Performance** — developers resort to `html2canvas`-style hacks (slow, incomplete)
- **Quality** — `ctx.fillText()` can't match browser-rendered text with fonts, ligatures, subpixel rendering

## Use Cases

1. **Styled, laid-out content in canvas** — chart labels, rich text boxes in creative tools, in-game menus
2. **Accessibility** — drawn elements ARE the fallback content, so they always match
3. **HTML + WebGL shaders** — apply general GPU effects to HTML elements
4. **HTML in 3D** — render rich 2D content as textures in 3D scenes
5. **Media export** — export HTML content as images or video via canvas

## Solution: Three Primitives + One Helper

### 1. `layoutsubtree` attribute

An attribute on `<canvas>` that opts its direct children into layout and hit testing.

```html
<canvas layoutsubtree>
  <div id="content">I'm laid out but invisible until drawn</div>
</canvas>
```

Children behave as if visible (participate in layout, hit testing, accessibility tree) but their rendering is NOT visible to the user until explicitly drawn via `drawElementImage()`.

Technical effects on direct children:
- Creates a stacking context
- Becomes a containing block for all descendants
- Has paint containment

### 2. `drawElementImage()` (and WebGL/WebGPU equivalents)

Draws a direct child of the canvas into the canvas. Returns a `DOMMatrix` transform for synchronization.

```js
const transform = ctx.drawElementImage(element, x, y);
const transform = ctx.drawElementImage(element, x, y, width, height);
const transform = ctx.drawElementImage(element, sx, sy, sw, sh, dx, dy);
const transform = ctx.drawElementImage(element, sx, sy, sw, sh, dx, dy, dw, dh);
```

**Key behaviors:**
- Canvas CTM is applied when drawing
- CSS transforms on the source element are IGNORED for drawing (but still affect hit testing)
- Overflow is clipped to the element's border box
- If width/height omitted, element maintains its on-screen size proportions
- Returns a CSS transform to synchronize DOM position with drawn position

**WebGL equivalent:** `gl.texElementImage2D(target, level, internalformat, format, type, element)`
**WebGPU equivalent:** `queue.copyElementImageToTexture(element, destination)`

### 3. `paint` event

Fires when rendering of any canvas children has changed. Fires just after intersection observer steps during `update-the-rendering`.

```js
canvas.onpaint = (event) => {
  // event.changedElements — array of children whose rendering changed
  ctx.reset();
  const transform = ctx.drawElementImage(myElement, 0, 0);
  myElement.style.transform = transform.toString();
};
```

**Key behaviors:**
- Contains `changedElements` — list of children that changed
- CSS transform changes do NOT trigger paint (transforms are ignored for rendering)
- Canvas drawing commands in paint event appear in current frame
- DOM changes in paint event appear in NEXT frame
- `requestPaint()` forces paint event to fire (like `requestAnimationFrame()`)

### 4. `captureElementImage()` — for OffscreenCanvas/workers

```js
const elementImage = canvas.captureElementImage(element);
worker.postMessage({ elementImage }, [elementImage]); // transferable
```

Creates a transferable `ElementImage` snapshot for use in workers with `OffscreenCanvas`.

## Synchronization

The element's DOM position must match its drawn position for hit testing, accessibility, and intersection observer to work. `drawElementImage()` returns the CSS transform to apply:

```js
const transform = ctx.drawElementImage(element, x, y);
element.style.transform = transform.toString();
```

For 3D contexts, use `canvas.getElementTransform(element, drawTransform)`.

The general formula:

```
T_origin^-1 * S_css_to_grid^-1 * T_draw * S_css_to_grid * T_origin
```

Where:
- `T_draw` = CTM * Translation(x,y) * Scale(destScale)
- `T_origin` = element's computed transform-origin
- `S_css_to_grid` = CSS pixels to canvas grid pixels

## Privacy-Preserving Painting

`drawElementImage()` must not reveal security/privacy-sensitive information:

**Excluded from painting:**
- Cross-origin data in embedded content (iframes, images, url() refs, SVG use)
- System colors, themes, preferences
- Spelling/grammar markers
- Visited link information
- Pending autofill information
- Subpixel text anti-aliasing

**Allowed (not considered sensitive):**
- Find-in-page / text-fragment markers
- Scrollbar and form element appearance (already detectable via foreignObject)
- Caret blink rate
- forced-colors (already available via media query)

## Paint Event Timing (Option C — chosen approach)

The paint event fires immediately after the browser's own Paint step, runs only once per frame. DOM invalidations during paint apply to the next frame, not the current one. This avoids the complexity and performance issues of looping approaches.
