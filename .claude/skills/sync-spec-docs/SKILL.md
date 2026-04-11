---
name: sync-spec-docs
description: Refresh the Browser Support and Open Questions doc pages from the upstream WICG/html-in-canvas repo
---

Pull the latest content for the two "living" doc pages on the site — Browser Support and Open Questions — straight from the [WICG/html-in-canvas](https://github.com/WICG/html-in-canvas) upstream on GitHub. Use this whenever the upstream explainer or issue list has moved enough to be worth refreshing the site.

## Steps

1. **Confirm the current spec doc state.** Before running the script, note whether `spec/browser-support.md` or `spec/open-questions.md` have uncommitted local edits — the sync rewrites both files and any unsaved edits will be lost.

2. **Run the sync script** from the repo root:
   ```
   node scripts/sync-spec-docs.mjs
   ```
   The script hits the public GitHub API unauthenticated (60 requests/hour). If you've been rate-limited, set `GITHUB_TOKEN` to a personal access token with `public_repo` scope before running.

3. **Review the diff.** Check what changed against the previous state:
   ```
   git diff spec/browser-support.md spec/open-questions.md
   ```
   Scan for:
   - Broken markdown (e.g. issue bodies that used raw HTML that leaked through)
   - Issues that look like noise and should be manually trimmed after sync
   - Major shifts in the upstream "Status" section that might need a commentary update on the site

4. **Spot-check the rendered pages.** Start the dev server (`npm run dev`) and visit:
   - <http://localhost:4321/docs/browser-support/>
   - <http://localhost:4321/docs/open-questions/>

5. **Commit the sync** once the diff looks right. Use a commit message that mentions the upstream source so future developers can trace where the content came from:
   ```
   git add spec/browser-support.md spec/open-questions.md
   git commit -m "Sync spec docs from WICG/html-in-canvas upstream"
   ```

## What the script actually does

- Fetches `README.md` from `WICG/html-in-canvas/main`, extracts the `## Status` and `## Developer Trial (dev trial) Information` sections, and writes a fresh `spec/browser-support.md` with preserved frontmatter (`title`, `order`).
- Fetches all open issues from the repo's `/issues` endpoint (paginating as needed, filtering out pull requests), sorts them newest-first, and writes each as a section in `spec/open-questions.md` with title, upstream link, author, labels, and a short body preview.
- Both files include an `_Auto-synced … on YYYY-MM-DD via scripts/sync-spec-docs.mjs._` line under the page heading so readers can see how fresh the content is.

## When NOT to use this

- If you've made significant hand-edits to either page (summaries, grouping, commentary), running the sync will clobber them. Either pull those edits into the script itself, or don't sync.
- If the upstream repo has been restructured (e.g. the `## Status` heading was renamed), the extraction will silently write a placeholder. Inspect the output and adjust the extraction in `scripts/sync-spec-docs.mjs` if needed.
