/**
 * Hand-written SEO metadata for the documentation pages.
 *
 * Descriptions live here (keyed by slug, i.e. the spec/*.md filename)
 * rather than in the markdown frontmatter because
 * scripts/sync-spec-docs.mjs rewrites browser-support.md and
 * open-questions.md in full on every upstream sync — frontmatter added
 * there would be silently lost on the next run.
 *
 * Each description is written to answer the query that lands searchers
 * on the page (e.g. "drawElementImage API", "html in canvas browser
 * support") in ~150 characters. When adding a new doc to spec/, add a
 * matching entry here; DocsLayout falls back to a generic templated
 * description when a slug is missing.
 */
export const DOC_DESCRIPTIONS: Record<string, string> = {
  overview:
    'The WICG HTML-in-Canvas spec explained: layoutsubtree, drawElementImage(), and paint events render live, accessible DOM directly in <canvas>.',
  'api-reference':
    'Complete drawElementImage() API reference: IDL for layoutsubtree, captureElementImage(), ElementImage, and paint events, with behavior notes.',
  'browser-support':
    'HTML-in-Canvas browser support: available in Chrome Canary and Brave behind the canvas-draw-element flag — and how to enable it in two minutes.',
  'design-decisions':
    'Why HTML-in-Canvas works the way it does: the layoutsubtree opt-in, why CSS transforms on source elements are ignored, and other design rationale.',
  'examples-analysis':
    'The official WICG HTML-in-Canvas examples analyzed: complex text, forms, video, transforms — the key techniques and patterns behind each one.',
  'open-questions':
    'Open issues on the WICG HTML-in-Canvas spec — interactivity, tainting, layout — summarized with links to each upstream GitHub discussion.',
};

/**
 * Description for the /docs/ hub page (a meta-refresh redirect to the
 * first doc, but still indexed and ranking in its own right).
 */
export const DOCS_HUB_DESCRIPTION =
  'HTML-in-Canvas documentation: spec overview, drawElementImage() API reference, browser support, design decisions, and open questions.';
