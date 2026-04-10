import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'offscreen-canvas-worker',
  canvasSelector: '#output',
  // The canvas backing store has been transferred to a Web Worker via
  // transferControlToOffscreen(), so the main thread can't read pixels
  // from it. Smoke-check the demo loads + mounts + has no console errors.
  skipPixelCheck: true,
});
