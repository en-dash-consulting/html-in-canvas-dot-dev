import { runDemoSmokeTests } from './helpers/demo-smoke';

runDemoSmokeTests({
  slug: 'accessible-charts',
  // Two canvases on this page; verifying the first is enough for smoke.
  canvasSelector: '#bar-chart',
});
