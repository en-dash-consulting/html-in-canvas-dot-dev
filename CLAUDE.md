# Project notes

Context and gotchas that outlive a single conversation. Add to this file
when you hit something non-obvious that a future reader (human or agent)
would want to know about.

## Commit verification

When the user asks for a commit, run these first and report the results
before staging anything. Don't commit if any step fails.

1. `npm run check` — Astro typecheck, must be 0 errors / 0 warnings.
2. `npx playwright test <affected-demo(s)> --project=chrome-canary` —
   smoke tests for any demo whose `src/content/demos/<slug>/` changed.
3. `npx playwright test a11y-audit --project=chrome-canary` — full WCAG
   audit whenever visible UI changed (copy, layout, color, new pages).
   For changes isolated to one demo, scope with `-g "<slug>"`.
4. If a test fails, fix the root cause before committing — don't skip
   (`test.skip`) or ignore. The `bugfix/a11ychart` work, for example,
   started as "tests pass but Brave crashes"; always reproduce the
   user's reported symptom before declaring done.

## Known browser bugs

### `drawFocusIfNeeded` crashes Brave's renderer on `layoutsubtree` canvases

Both `ctx.drawFocusIfNeeded(el)` and `ctx.drawFocusIfNeeded(path2d, el)` crash
Brave Stable's renderer ("Aw, Snap! Error code: 5",
`STATUS_ACCESS_VIOLATION`) on canvases with the `layoutsubtree` attribute.
The crash fires ~500ms–1s after first paint, with no console output.
Chrome Canary with `--enable-blink-features=CanvasDrawElement` is
unaffected — which is why the Playwright smoke suite couldn't reproduce it.

First seen on the accessible-charts demo (April 2026).

**Don't use `drawFocusIfNeeded` in any demo** until Brave picks up a fix.
Hand-draw focus rings instead: retrace the fill/stroke path, then stroke it
(e.g., inner white 2px + outer brand-purple 4px @ 0.55 alpha) when
`el === (root.activeElement ?? document.activeElement)`. Trigger repaints on
the `focus`/`blur` events of each focusable child so the ring updates. Also
leave `drawFocusIfNeeded` out of any demo's `meta.json` features until it
works in both supported browsers.
