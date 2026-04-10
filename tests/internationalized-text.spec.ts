import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'internationalized-text',
  // Lots of side-by-side comparison canvases. Verify the first
  // drawElementImage one (RTL).
  canvasSelector: '#html-rtl',
});
