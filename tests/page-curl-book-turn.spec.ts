import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'page-curl-book-turn',
  // WebGL context with preserveDrawingBuffer: false — pixels aren't
  // readable cross-frame. Smoke-check the demo loads, mounts, and
  // produces no console errors.
  canvasSelector: '#gl-canvas',
  skipPixelCheck: true,
});
