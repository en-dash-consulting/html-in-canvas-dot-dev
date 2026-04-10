import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'css-to-shader',
  // The visible canvas is a WebGL context with preserveDrawingBuffer:
  // false, so its pixels can't be read cross-frame. Smoke-check the
  // demo loads, mounts, and produces no console errors.
  canvasSelector: '#preview-canvas',
  skipPixelCheck: true,
});
