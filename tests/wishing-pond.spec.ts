import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'wishing-pond',
  // Several canvases: the 2D one that drawElementImage paints the live page into.
  canvasSelector: '#page-canvas',
});
