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
    'The WICG HTML-in-Canvas spec explained: layoutsubtree (content="drawable" in Chrome 157+), drawElementImage(), and paint events render live, accessible DOM directly in <canvas>.',
  'api-reference':
    'Complete drawElementImage() API reference: IDL for layoutsubtree, captureElementImage(), ElementImage, and paint events, with behavior notes.',
  'browser-support':
    'HTML-in-Canvas browser support: on by default in Chrome 157+, behind chrome://flags/#canvas-draw-element in Chromium 147–156 and Brave, not yet in Firefox or Safari.',
  'design-decisions':
    'Why HTML-in-Canvas works the way it does: the layoutsubtree opt-in, why CSS transforms on source elements are ignored, and other design rationale.',
  'examples-analysis':
    'The official WICG HTML-in-Canvas examples analyzed: complex text, forms, video, and transforms, with the techniques behind each one.',
  'open-questions':
    'Open issues on the WICG HTML-in-Canvas spec (interactivity, tainting, layout), summarized with links to each upstream GitHub discussion.',
  libraries:
    'Libraries and frameworks built on HTML-in-Canvas: Three.js, Babylon.js, Babylon Lite, PixiJS, PlayCanvas, TypeGPU, Underglass (with Strata) and CanvasUI.',
};

/**
 * Per-slug <title> overrides for docs pages whose SERP intent isn't
 * served by the markdown frontmatter title. Frontmatter can't carry
 * these for the synced docs (see DOC_DESCRIPTIONS above), and the
 * sidebar/breadcrumb should keep the short frontmatter name anyway —
 * only the <title> tag and TechArticle headline use the override.
 *
 * browser-support: searchers type the literal flag name
 * ("chrome://flags/#canvas-draw-element" / "canvas-draw-element"), so
 * the title leads with the flag and the setup intent.
 */
export const DOC_TITLES: Record<string, string> = {
  'browser-support':
    'Enable the canvas-draw-element Chrome Flag — Setup & Browser Support',
};

/**
 * Description for the /docs/ hub page (a meta-refresh redirect to the
 * first doc, but still indexed and ranking in its own right).
 */
export const DOCS_HUB_DESCRIPTION =
  'HTML-in-Canvas documentation: spec overview, drawElementImage() API reference, browser support, design decisions, and open questions.';
