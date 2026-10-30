---
title: Libraries & Frameworks
order: 7
---

# Libraries & Frameworks Built on HTML-in-Canvas

The demos on this site call the raw API. These projects wrap it for a renderer or a UI framework, so you can put live HTML into an existing scene or app without writing the `paint` and upload code yourself. They're community projects, listed for reference: each one follows the API at its own pace, so check its docs for the browser builds it supports.

## Engines and GPU toolkits

- **[Three.js](https://threejs.org/)**: `THREE.HTMLTexture` takes a DOM element and works as any material's map. See [mrdoob/three.js#31233](https://github.com/mrdoob/three.js/pull/31233).
- **[Babylon.js](https://www.babylonjs.com/)**: `HtmlTexture` turns a live element into a texture on WebGL2 or WebGPU, with optional pointer routing back to the DOM; `UploadHtmlElementToTexture` fills an existing texture. See the [HTML Textures guide](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/htmlTexture/).
- **[Babylon Lite](https://doc.babylonjs.com/lite/)**: `createHtmlTexture` in `@babylonjs/lite` moves the element under the rendering canvas and keeps the texture current from a `paint` listener. See the [`createHtmlTexture` reference](https://doc.babylonjs.com/lite/typedoc/functions/createHtmlTexture).
- **[PixiJS](https://pixijs.com/)**: `HTMLSource` from `pixi.js/html-source`, drawn through an ordinary `Sprite`. See [pixijs/pixijs#12077](https://github.com/pixijs/pixijs/pull/12077).
- **[PlayCanvas](https://playcanvas.com/)**: a texture's `setSource(element)`, called after the canvas `paint` event, on WebGL and WebGPU. See [playcanvas/engine#8810](https://github.com/playcanvas/engine/pull/8810) and [#9824](https://github.com/playcanvas/engine/pull/9824) for the Chrome 157 names.
- **[TypeGPU](https://docs.swmansion.com/TypeGPU/)**: typed WebGPU in TypeScript. The WICG [jelly-slider example](https://github.com/WICG/html-in-canvas/tree/main/Examples/webgpu-jelly-slider) uses it with `drawElementImageToTexture`.

## UI frameworks and components

- **[Underglass](https://github.com/RaananW/underglass)**: React and Vue adapters (`@underglass/react`, `@underglass/vue`) that present an app's own UI through WebGPU. Layers move, fade and run WGSL effects while clicks, focus and typing still reach the original controls; without the API the app runs as ordinary DOM. Its experimental companion, **Strata** (`@underglass/ui`), is a 3D design language and component library: tokens, CSS and components for DOM, React, Vue and Astro, drawn through the GPU when Underglass is on. See the [live gallery](https://raananw.github.io/underglass/).
- **[CanvasUI](https://canvasui.dev/)**: an open-source library of UI components built on HTML-in-Canvas.

Built something on the API? Open a pull request that adds it here.
