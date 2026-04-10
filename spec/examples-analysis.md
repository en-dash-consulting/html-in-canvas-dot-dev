---
title: Examples Analysis
order: 4
---

# Official Examples Analysis

All examples live at https://wicg.github.io/html-in-canvas/Examples/

## 1. Complex Text (complex-text.html)

**What it demonstrates:** Rich, rotated text with emoji, RTL, vertical text, inline images, and SVG — all rendered into canvas via a single `drawElementImage` call.

**Key techniques:**
- Canvas CTM rotation (`ctx.rotate`) — the drawn element follows the CTM
- Multi-script text: LTR English, RTL Persian, vertical Chinese
- Inline `<img>` and `<svg>` inside the drawn element
- DPR-aware translation (`80 * devicePixelRatio`)

**Pattern:**
```js
canvas.onpaint = (event) => {
  ctx.reset();
  ctx.rotate((15 * Math.PI) / 180);
  ctx.translate(80 * devicePixelRatio, -20 * devicePixelRatio);
  let transform = ctx.drawElementImage(draw_element, 0, 0);
  draw_element.style.transform = transform.toString();
};
canvas.requestPaint(); // trigger initial paint
```

**Insight:** This is the simplest example — one element, one draw call, one transform sync. Shows how `drawElementImage` replaces what would otherwise require complex `ctx.fillText` with font metrics, bidi algorithm, and manual line breaking.

---

## 2. Pie Chart (pie-chart.html)

**What it demonstrates:** A fully accessible, interactive pie chart with styled multi-line labels positioned radially.

**Key techniques:**
- Multiple children drawn in a loop
- ARIA roles (`role="list"`, `role="listitem"`, `tabindex="0"`)
- `ctx.drawFocusIfNeeded()` for focus ring rendering
- Radial positioning using trig — labels centered at 60% of radius at each slice's midpoint angle
- `data-*` attributes for chart data
- Radial gradient fills per wedge

**Pattern:**
```js
for (const label of canvas.children) {
  // Draw wedge with Path2D
  const path = new Path2D();
  path.arc(0, 0, radius, angle, angle + slice);
  ctx.fill(path);

  // Draw and position label
  const mid = angle + slice / 2;
  const x = Math.cos(mid) * radius * 0.60 - label_width / 2;
  const y = Math.sin(mid) * radius * 0.60 - label_height / 2;
  const transform = ctx.drawElementImage(label, x, y);
  label.style.transform = transform;
}

// Focus ring on top
if (focusedPath)
  ctx.drawFocusIfNeeded(focusedPath, document.activeElement);
```

**Insight:** This is the accessibility showcase. The labels ARE the fallback content — screen readers see `role="listitem"` elements with the actual text. Tab navigation works, and `drawFocusIfNeeded` provides proper focus indication. This is the key value prop over `ctx.fillText()`.

---

## 3. Text Input / Interactive Form (text-input.html)

**What it demonstrates:** A fully interactive HTML form (text inputs, checkboxes, radio buttons, range slider, button) rendered inside canvas.

**Key techniques:**
- Forms work normally — typing, clicking, tabbing all function
- The `paint` event fires when form state changes (cursor blink, selection, input)
- Simple positioning at `canvas.width/25, canvas.height/25`

**Insight:** This proves that `layoutsubtree` preserves full interactivity. The form elements aren't simulated — they're real DOM elements with real event handlers, just drawn into the canvas. Cursor blinking triggers paint events automatically.

---

## 4. WebGL 3D Cube (webGL.html)

**What it demonstrates:** HTML content rendered as a texture on a rotating 3D cube using WebGL.

**Key techniques:**
- `gl.texElementImage2D()` instead of `texImage2D()`
- `gl.TEXTURE_MIN_FILTER = gl.LINEAR` — important for text quality (not mipmaps)
- `gl.CLAMP_TO_EDGE` wrapping
- `inert` attribute on the drawn element to prevent hit testing in this demo
- Standard gl-matrix cube rendering
- `requestAnimationFrame` loop for rotation

**Pattern:**
```js
function loadTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, draw_element);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  return texture;
}

canvas.onpaint = () => { main(); };
canvas.requestPaint();
```

**Insight:** The `inert` attribute is noteworthy — it disables hit testing for the HTML element since it's mapped onto a 3D surface where 2D hit testing doesn't make sense. For interactive 3D HTML, you'd need to do raycasting yourself and forward events.

---

## 5. WebGPU Jelly Slider (webgpu-jelly-slider/)

**What it demonstrates:** A range slider whose value is rendered as jelly-like 3D text on a ground plane, with physics simulation and ray marching — all using TypeGPU.

**Key techniques:**
- `copyElementImageToTexture()` for WebGPU
- `canvas.requestPaint()` called on slider input
- `<input type="range">` and `<div>` as canvas children
- Physics-based Verlet integration for jelly animation
- SDF ray marching for 3D rendering
- CSS custom properties for theming (`--jelly-color`, etc.)
- Respects `prefers-reduced-motion` and `prefers-contrast`
- TypeGPU framework for WGSL shader generation

**Pattern (WebGPU):**
```js
(canvas as any).onpaint = () => {
  (root.device.queue as any).copyElementImageToTexture(
    valueElement, width, height, { texture: valueRawTexture }
  );
  // Manual transform sync (getElementTransform TODO noted in source)
};
```

**Insight:** Most complex example. Shows how HTML-in-Canvas enables mixing standard HTML controls (a range input) with advanced GPU rendering. The slider is a real `<input type="range">` — it's accessible, keyboard-navigable, and its value drives the 3D scene. The percentage text displayed on the ground plane is an HTML `<div>` captured as a GPU texture.

---

## Pattern Summary

| Example | Context | API Used | Interactive | Accessible |
|---------|---------|----------|-------------|------------|
| Complex Text | 2D | `drawElementImage` | No | Yes (text content) |
| Pie Chart | 2D | `drawElementImage` | Yes (focus/tab) | Yes (ARIA roles) |
| Text Input | 2D | `drawElementImage` | Yes (full form) | Yes (form elements) |
| WebGL Cube | WebGL | `texElementImage2D` | No (inert) | No |
| Jelly Slider | WebGPU | `copyElementImageToTexture` | Yes (range input) | Yes |

## Common Boilerplate

Every example follows this pattern:

```js
// 1. Get context
const ctx = canvas.getContext('2d');

// 2. Handle paint events
canvas.onpaint = () => {
  ctx.reset();  // Clear and reset CTM
  // ... draw elements ...
};

// 3. Request initial paint
canvas.requestPaint();

// 4. Handle DPR
new ResizeObserver(([entry]) => {
  canvas.width = entry.devicePixelContentBoxSize[0].inlineSize;
  canvas.height = entry.devicePixelContentBoxSize[0].blockSize;
}).observe(canvas, { box: 'device-pixel-content-box' });
```
