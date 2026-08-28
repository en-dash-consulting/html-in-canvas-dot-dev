import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { demosLoader } from './integrations/demos';

// ---------------------------------------------------------------------------
// Demos — each folder in src/content/demos/{slug}/ has meta.json + demo.html
// ---------------------------------------------------------------------------

const demos = defineCollection({
  loader: demosLoader({ base: 'src/content/demos' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
    dateCreated: z.string().optional(),
    dateUpdated: z.string().optional(),
    /** Canvas API context used by this demo */
    context: z.enum(['2d', 'webgl', 'webgpu']).default('2d'),
    difficulty: z
      .enum(['beginner', 'intermediate', 'advanced'])
      .default('beginner'),
    /** Which HTML-in-Canvas spec features this demo exercises */
    features: z.array(z.string()).default([]),
    /** Optional companion tutorial/article covering this demo's technique */
    relatedArticle: z
      .object({
        title: z.string(),
        url: z.string(),
      })
      .optional(),
    browserSupport: z
      .object({
        chrome: z.boolean().default(false),
        firefox: z.boolean().default(false),
        safari: z.boolean().default(false),
      })
      .default({ chrome: false, firefox: false, safari: false }),
    /** Pin on the homepage featured grid */
    featured: z.boolean().optional(),
    /** Crawlable FAQ on the demo page (AEO + FAQPage JSON-LD) */
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .optional(),
    /** Outbound / related links shown under the demo */
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .optional(),
    /** Optional commentary block under the live demo */
    why: z
      .object({
        heading: z.string(),
        lede: z.string(),
        points: z.array(z.object({ title: z.string(), body: z.string() })),
      })
      .optional(),
  }),
});

// ---------------------------------------------------------------------------
// Docs — spec markdown files in spec/
// ---------------------------------------------------------------------------

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'spec' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { demos, docs };
