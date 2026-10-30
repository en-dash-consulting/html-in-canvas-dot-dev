import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'margin-dragon',
  // Several canvases: the 2D one that drawElementImage paints the live page into.
  canvasSelector: '#page-canvas',
});
