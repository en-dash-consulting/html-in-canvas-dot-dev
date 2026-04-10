---
title: API Reference
order: 2
---

# HTML-in-Canvas API Reference

## IDL Definitions

### HTMLCanvasElement Extensions

```idl
partial interface HTMLCanvasElement {
  [CEReactions, Reflect] attribute boolean layoutSubtree;
  attribute EventHandler onpaint;
  void requestPaint();
  ElementImage captureElementImage(Element element);
  DOMMatrix getElementTransform((Element or ElementImage) element, DOMMatrix drawTransform);
};
```

| Member | Type | Description |
|--------|------|-------------|
| `layoutSubtree` | `boolean` attribute | Opts canvas children into layout and hit testing. Reflected as HTML attribute `layoutsubtree`. |
| `onpaint` | `EventHandler` | Handler for the `paint` event, fired when child rendering changes. |
| `requestPaint()` | method | Forces a `paint` event to fire in the next frame, even if no children changed. Analogous to `requestAnimationFrame()`. |
| `captureElementImage(element)` | method | Captures a snapshot of a child element as a transferable `ElementImage` for worker use. |
| `getElementTransform(element, drawTransform)` | method | Returns the CSS transform to synchronize DOM position with a 3D draw transform. Used with WebGL/WebGPU. |

### OffscreenCanvas Extensions

```idl
partial interface OffscreenCanvas {
  DOMMatrix getElementTransform((Element or ElementImage) element, DOMMatrix drawTransform);
};
```

### CanvasDrawElementImage Mixin

Applied to both `CanvasRenderingContext2D` and `OffscreenCanvasRenderingContext2D`.

```idl
interface mixin CanvasDrawElementImage {
  // Draw at position
  DOMMatrix drawElementImage((Element or ElementImage) element,
                             unrestricted double dx, unrestricted double dy);

  // Draw at position with destination size
  DOMMatrix drawElementImage((Element or ElementImage) element,
                             unrestricted double dx, unrestricted double dy,
                             unrestricted double dwidth, unrestricted double dheight);

  // Draw with source rect at position (no dest size)
  DOMMatrix drawElementImage((Element or ElementImage) element,
                             unrestricted double sx, unrestricted double sy,
                             unrestricted double swidth, unrestricted double sheight,
                             unrestricted double dx, unrestricted double dy);

  // Draw with source rect at position with destination size
  DOMMatrix drawElementImage((Element or ElementImage) element,
                             unrestricted double sx, unrestricted double sy,
                             unrestricted double swidth, unrestricted double sheight,
                             unrestricted double dx, unrestricted double dy,
                             unrestricted double dwidth, unrestricted double dheight);
};
```

**Overload signatures** mirror `drawImage()`:

| Signature | Description |
|-----------|-------------|
| `(element, dx, dy)` | Draw at (dx, dy), auto-sized to match on-screen proportions |
| `(element, dx, dy, dw, dh)` | Draw at (dx, dy) scaled to (dw x dh) |
| `(element, sx, sy, sw, sh, dx, dy)` | Draw sub-rect (sx, sy, sw, sh) at (dx, dy) |
| `(element, sx, sy, sw, sh, dx, dy, dw, dh)` | Draw sub-rect scaled into dest rect |

**Return value:** `DOMMatrix` — the CSS transform to apply to `element.style.transform` for synchronization.

**Requirements:**
- `layoutsubtree` must be set on the canvas
- `element` must be a direct child of the canvas
- `element` must have generated boxes (not `display: none`)
- CSS transforms on the element are ignored for drawing
- Canvas CTM is applied
- Overflow clipped to element's border box

**Snapshot behavior:**
- During `paint` event: draws the current frame's snapshot
- Outside `paint` event: draws the previous frame's snapshot
- Throws if called before any snapshot has been recorded

### WebGL Extension

```idl
partial interface WebGLRenderingContext {
  void texElementImage2D(GLenum target, GLint level, GLint internalformat,
                         GLenum format, GLenum type, (Element or ElementImage) element);
};
```

Uploads the element's rendered content as a WebGL texture. Parameters match `texImage2D` but the source is an element instead of an image/canvas.

**Usage pattern:**
```js
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // LINEAR recommended for text
```

### WebGPU Extension

```idl
partial interface GPUQueue {
  void copyElementImageToTexture((Element or ElementImage) source,
                                 GPUImageCopyTextureTagged destination);
};
```

Copies element rendering to a WebGPU texture.

### PaintEvent

```idl
[Exposed=Window]
interface PaintEvent : Event {
  constructor(DOMString type, optional PaintEventInit eventInitDict);
  readonly attribute FrozenArray<Element> changedElements;
};

dictionary PaintEventInit : EventInit {
  sequence<Element> changedElements = [];
};
```

| Member | Description |
|--------|-------------|
| `changedElements` | Frozen array of canvas children whose rendering changed since the last paint event. |

### ElementImage

```idl
[Exposed=(Window,Worker), Transferable]
interface ElementImage {
  readonly attribute unsigned long width;
  readonly attribute unsigned long height;
  undefined close();
};
```

| Member | Description |
|--------|-------------|
| `width` | Width of the captured snapshot in pixels |
| `height` | Height of the captured snapshot in pixels |
| `close()` | Releases the underlying resources |

`ElementImage` is `Transferable` — it can be sent to workers via `postMessage()`.

## Common Patterns

### Basic 2D Canvas

```html
<canvas id="c" layoutsubtree>
  <div id="content">Hello</div>
</canvas>
<script>
  const ctx = c.getContext('2d');
  c.onpaint = () => {
    ctx.reset();
    const t = ctx.drawElementImage(content, 0, 0);
    content.style.transform = t.toString();
  };
  // Size canvas to device pixels
  new ResizeObserver(([e]) => {
    c.width = e.devicePixelContentBoxSize[0].inlineSize;
    c.height = e.devicePixelContentBoxSize[0].blockSize;
  }).observe(c, { box: 'device-pixel-content-box' });
</script>
```

### OffscreenCanvas with Worker

```js
// Main thread
canvas.onpaint = () => {
  const img = canvas.captureElementImage(element);
  worker.postMessage({ elementImage: img }, [img]);
};
worker.onmessage = ({ data }) => {
  element.style.transform = data.transform.toString();
};

// Worker
self.onmessage = (e) => {
  if (e.data.elementImage) {
    ctx.reset();
    const t = ctx.drawElementImage(e.data.elementImage, x, y);
    self.postMessage({ transform: t });
  }
};
```

### WebGL Texture

```js
canvas.onpaint = () => {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
};
```

### WebGPU Texture

```js
canvas.onpaint = () => {
  device.queue.copyElementImageToTexture(element, { texture: gpuTexture });
};
```

### Device Pixel Ratio Handling

Always size the canvas grid to device pixels to prevent blurriness:

```js
const observer = new ResizeObserver(([entry]) => {
  canvas.width = entry.devicePixelContentBoxSize[0].inlineSize;
  canvas.height = entry.devicePixelContentBoxSize[0].blockSize;
});
observer.observe(canvas, { box: 'device-pixel-content-box' });
```
