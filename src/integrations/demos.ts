import type { AstroIntegration } from 'astro';
import type { Loader } from 'astro/loaders';
import { readdir, readFile, cp, mkdir, unlink } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Custom content loader: reads src/content/demos/{slug}/meta.json
// ---------------------------------------------------------------------------

interface DemosLoaderOptions {
  /** Directory containing demo folders, relative to project root */
  base: string;
}

export function demosLoader(options: DemosLoaderOptions): Loader {
  return {
    name: 'demos-loader',
    async load(context) {
      const { config, store, logger, parseData, generateDigest, watcher } =
        context;
      const baseDir = join(fileURLToPath(config.root), options.base);

      if (!existsSync(baseDir)) {
        logger.warn(`Demos directory not found: ${baseDir}`);
        return;
      }

      const entries = await readdir(baseDir, { withFileTypes: true });
      const dirs = entries.filter(
        (e) => e.isDirectory() && !e.name.startsWith('_'),
      );

      store.clear();

      for (const dir of dirs) {
        const slug = dir.name;
        const metaPath = join(baseDir, slug, 'meta.json');

        if (!existsSync(metaPath)) {
          logger.warn(`No meta.json in demos/${slug}/, skipping`);
          continue;
        }

        const demoPath = join(baseDir, slug, 'demo.html');
        if (!existsSync(demoPath)) {
          logger.warn(`No demo.html in demos/${slug}/, skipping`);
          continue;
        }

        const raw = await readFile(metaPath, 'utf-8');
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          logger.error(`Invalid JSON in demos/${slug}/meta.json, skipping`);
          continue;
        }

        const digest = generateDigest(data);
        const filePath = relative(fileURLToPath(config.root), metaPath);

        const parsedData = await parseData({ id: slug, data, filePath });

        store.set({ id: slug, data: parsedData, filePath, digest });
      }

      // Watch for changes in dev mode
      watcher?.add(baseDir);
    },
  };
}

// ---------------------------------------------------------------------------
// Build integration: copies demo assets to /demos/{slug}/ in output
// ---------------------------------------------------------------------------

export function demosIntegration(): AstroIntegration {
  const demosBase = 'src/content/demos';

  return {
    name: 'demos-integration',
    hooks: {
      // Serve demo files during development
      'astro:server:setup': ({ server }) => {
        const srcBase = join(process.cwd(), demosBase);

        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/demos/')) return next();

          const relPath = req.url.slice('/demos/'.length);
          const filePath = join(srcBase, relPath);

          // Only serve files inside demo directories, skip _template
          if (relPath.startsWith('_') || !existsSync(filePath)) {
            return next();
          }

          const ext = filePath.split('.').pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            html: 'text/html',
            css: 'text/css',
            js: 'application/javascript',
            json: 'application/json',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            svg: 'image/svg+xml',
            gif: 'image/gif',
            webp: 'image/webp',
          };

          res.setHeader(
            'Content-Type',
            mimeTypes[ext ?? ''] ?? 'application/octet-stream',
          );
          createReadStream(filePath).pipe(res);
        });
      },

      // Copy demo assets into build output
      'astro:build:done': async ({ dir, logger }) => {
        const srcBase = join(process.cwd(), demosBase);
        const destBase = join(fileURLToPath(dir), 'demos');

        if (!existsSync(srcBase)) {
          logger.warn('No demos directory found, skipping asset copy');
          return;
        }

        const entries = await readdir(srcBase, { withFileTypes: true });
        const dirs = entries.filter(
          (e) => e.isDirectory() && !e.name.startsWith('_'),
        );

        for (const d of dirs) {
          const src = join(srcBase, d.name);
          const dest = join(destBase, d.name);
          await mkdir(dest, { recursive: true });
          await cp(src, dest, { recursive: true });

          // Remove meta.json from output — it's already in the data store
          const metaDest = join(dest, 'meta.json');
          if (existsSync(metaDest)) {
            await unlink(metaDest);
          }

          logger.info(`Copied demo: ${d.name}`);
        }
      },
    },
  };
}
