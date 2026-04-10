// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { demosIntegration } from './src/integrations/demos';

// https://astro.build/config
export default defineConfig({
  site: 'https://html-in-canvas.dev',
  integrations: [sitemap(), demosIntegration()],
});
