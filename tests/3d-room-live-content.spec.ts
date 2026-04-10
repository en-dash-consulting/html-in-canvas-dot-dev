import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: '3d-room-live-content',
  // The Three.js viewport is a WebGL canvas. preserveDrawingBuffer is
  // unset (defaults to false), so we can't sample its pixels
  // cross-frame. Smoke-check the demo loads, mounts, and doesn't error.
  canvasSelector: '#viewport',
  skipPixelCheck: true,
  // Three.js loads from CDN; allow more time for the external script.
  firstPaintTimeoutMs: 10000,
});
