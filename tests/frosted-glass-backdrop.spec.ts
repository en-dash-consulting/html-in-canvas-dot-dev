import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'frosted-glass-backdrop',
  // 2D context with WebGL processing happening offscreen. The visible
  // canvas is 2D so getImageData works.
  canvasSelector: '#canvas',
});
