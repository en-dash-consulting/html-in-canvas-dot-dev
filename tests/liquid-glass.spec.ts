import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'liquid-glass',
  // Two canvases on this page (source 2D + glass WebGL distortion).
  // The source canvas is the one drawElementImage paints into.
  canvasSelector: '#source-canvas',
});
