#!/usr/bin/env node
//
// scripts/sync-spec-docs.mjs
// -------------------------------------------------------------------------
// Pull the latest content for the two "living" doc pages on the site —
// Browser Support and Open Questions — straight from the WICG/html-in-canvas
// upstream on GitHub. Run this whenever the upstream explainer or issue
// list has moved enough to be worth refreshing the site.
//
// Usage:
//   node scripts/sync-spec-docs.mjs
//   GITHUB_TOKEN=ghp_xxx node scripts/sync-spec-docs.mjs   # higher rate limit
//
// What it writes:
//   spec/browser-support.md
//     – frontmatter (title, order) + the "Status" and "Developer Trial"
//       sections pulled verbatim from the upstream README.
//   spec/open-questions.md
//     – frontmatter + one section per open issue in the WICG repo,
//       with author, labels, and a 2–3 line body preview.
//
// Both files are rewritten in full each run, so any local edits between
// syncs will be lost. Review `git diff spec/` before committing.
// -------------------------------------------------------------------------

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "WICG/html-in-canvas";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_DIR = join(ROOT, "spec");

const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------
// GitHub fetch helpers
// ---------------------------------------------------------------------

function ghHeaders() {
  const h = { Accept: "application/vnd.github+json", "User-Agent": "html-in-canvas-dev-sync" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------
// Browser Support — extract from the upstream README
// ---------------------------------------------------------------------

/**
 * Grab everything between `## <heading>` and the next `## ` heading.
 * Returns the full section including its heading line, or null if the
 * heading wasn't found.
 */
function extractSection(md, heading) {
  const lines = md.split("\n");
  const startIdx = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (startIdx === -1) return null;
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx, endIdx).join("\n").trimEnd();
}

async function syncBrowserSupport() {
  const readme = await fetchText(
    `https://raw.githubusercontent.com/${REPO}/main/README.md`,
  );

  const status =
    extractSection(readme, "Status") ?? "## Status\n\n_(not found in upstream README)_";
  // Upstream renamed this heading in October 2026; accept either.
  const devTrial =
    extractSection(readme, "Developer Trial Information") ??
    extractSection(readme, "Developer Trial (dev trial) Information") ??
    "## Developer Trial Information\n\n_(not found in upstream README)_";

  const lines = [
    "---",
    "title: Browser Support",
    "order: 6",
    "---",
    "",
    "# Browser Support",
    "",
    `_Auto-synced from [\`WICG/${REPO.split("/")[1]}\` README](https://github.com/${REPO}/blob/main/README.md) on ${TODAY} via \`scripts/sync-spec-docs.mjs\`._`,
    "",
    "> **Chrome 157:** the upstream text below still describes the flag. Chrome 157 ships the API on by default; see [How to try it](#how-to-try-it).",
    "",
    status,
    "",
    devTrial,
    "",
    "## How to try it",
    "",
    "### Chrome 157 and later",
    "",
    "HTML-in-Canvas is on by default in Chrome 157. Early Stable started rolling out in late October 2026 and full Stable is scheduled for November 3, 2026. There is no flag or origin trial token to set.",
    "",
    "1. Update Chrome from `chrome://settings/help` (or [download it](https://www.google.com/chrome/)).",
    "2. Load any demo from the [demo gallery](/demos/).",
    "",
    "### Chromium 147–156 and Brave",
    "",
    "Older Chromium builds have the API behind a flag. Brave Stable 1.89.132 / Chromium 147.0.7727.56 and later work this way.",
    "",
    "1. Visit `chrome://flags/#canvas-draw-element` (`brave://flags/#canvas-draw-element` in Brave) and enable the flag.",
    "2. Relaunch the browser.",
    "3. Load any demo from the [demo gallery](/demos/).",
    "",
    "### Checking for support in your own code",
    "",
    "Check for the API, not the browser version:",
    "",
    "```js",
    "const supported = 'drawElementImage' in CanvasRenderingContext2D.prototype;",
    "```",
    "",
    "Use the result to pick between the native path and a fallback such as html2canvas.",
    "",
    "## Attribute naming: `layoutsubtree` vs `content=\"drawable\"`",
    "",
    "Chrome 157 renamed the canvas opt-in: `<canvas layoutsubtree>` became `<canvas content=\"drawable\">` (`HTMLCanvasElement.content`), and every element passed to `drawElementImage()` must now carry a `drawable` attribute. Without them the call throws `InvalidStateError` inside `onpaint`, which usually surfaces as a silently blank canvas. Chromium 156 and earlier, including current Brave Stable, only understand `layoutsubtree`. Each build ignores the attribute it doesn't know, so this site sets both:",
    "",
    "```html",
    "<canvas layoutsubtree content=\"drawable\">",
    "  <div drawable>…</div>",
    "</canvas>",
    "```",
    "",
    "## Other browsers",
    "",
    "- **Chrome:** on by default in 157+. Behind `chrome://flags/#canvas-draw-element` in 147–156.",
    "- **Brave:** behind `brave://flags/#canvas-draw-element` on Stable builds ≥ 1.89.132 / Chromium 147.",
    "- **Firefox:** no implementation — [details below](#firefox-support).",
    "- **Safari / WebKit:** no implementation announced.",
    "- **Edge / other Chromium forks:** they usually follow Chromium's defaults, so expect the API on Chromium 157+ builds. On older builds, try `chrome://flags/#canvas-draw-element` (or the fork's equivalent).",
    "",
    "## Firefox support",
    "",
    "HTML-in-Canvas does not work in Firefox today. There is no implementation and no flag to enable \u2014 `drawElementImage()`, `layoutsubtree`, and the WebGL/WebGPU element-texture methods are unavailable, so the live demos on this site need Chrome 157+ or another Chromium-based browser.",
    "",
    "Where Firefox actually stands:",
    "",
    "- Mozilla's formal review is open but undecided: [mozilla/standards-positions#1076](https://github.com/mozilla/standards-positions/issues/1076) (opened September 2024) is still marked \"needs proposed position\" \u2014 no position, positive or negative, has been published.",
    "- No Gecko implementation work has been announced.",
    "",
    "What works in Firefox today: the library approach \u2014 snapshotting DOM to canvas with html2canvas-style tools \u2014 runs in every browser, Firefox included. See [Render HTML to canvas: native API vs. html2canvas](/render-html-to-canvas/) for the comparison and code.",
    "",
    "This page is refreshed from the upstream spec repo, so Firefox status changes land here when they happen.",
    "",
    "## Feedback",
    "",
    `Browser vendors and contributors track discussion at <https://github.com/${REPO}/issues> — see the [Open Questions](/docs/open-questions/) page for the current list.`,
    "",
  ];

  await writeFile(join(SPEC_DIR, "browser-support.md"), lines.join("\n"));
  console.log("  ✓ spec/browser-support.md");
}

// ---------------------------------------------------------------------
// Open Questions — one section per open issue in the WICG repo
// ---------------------------------------------------------------------

/**
 * Pick the first few lines of an issue body as a compact preview.
 * Strips GitHub markdown artifacts we don't want bleeding into the
 * site (HTML comments, images, front-of-file tables).
 */
function issuePreview(body) {
  if (!body) return "";
  const cleaned = body
    // Drop HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Drop entire fenced code blocks — their truncated middles used to
    // leak raw tags like <canvas> into the rendered docs page, where
    // the markdown renderer interprets them as real HTML instead of
    // code samples.
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/<img[^>]*>/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // Take up to ~3 lines or 320 chars, whichever hits first.
  const chunks = [];
  let total = 0;
  for (const line of cleaned) {
    if (chunks.length >= 3 || total > 320) break;
    chunks.push(line);
    total += line.length + 1;
  }
  const joined = chunks.join(" ").replace(/\s+/g, " ").trim();
  // Escape any remaining angle brackets so HTML tags in the preview
  // render as text instead of being parsed by markdown's raw-HTML mode.
  const escaped = joined.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.length > 360 ? escaped.slice(0, 357) + "…" : escaped;
}

async function syncOpenQuestions() {
  // The /issues endpoint includes pull requests unless filtered. Request
  // up to 100 items per page and walk pages until we've drained the list.
  const pageSize = 100;
  let page = 1;
  const issues = [];
  while (true) {
    const batch = await fetchJson(
      `https://api.github.com/repos/${REPO}/issues?state=open&per_page=${pageSize}&page=${page}`,
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const item of batch) {
      if (!item.pull_request) issues.push(item);
    }
    if (batch.length < pageSize) break;
    page += 1;
  }

  // Sort by issue number descending so the newest discussions surface at
  // the top of the page.
  issues.sort((a, b) => b.number - a.number);

  const lines = [
    "---",
    "title: Open Questions",
    "order: 5",
    "---",
    "",
    "# Open Questions & Issues",
    "",
    `_Auto-synced from [\`${REPO}\` issues](https://github.com/${REPO}/issues) on ${TODAY} via \`scripts/sync-spec-docs.mjs\`._`,
    "",
    `There are currently **${issues.length}** open issues on the spec repository. Each heading below links to the upstream discussion — follow the link to read the full thread and leave a comment.`,
    "",
  ];

  for (const issue of issues) {
    const labelNames = (issue.labels || [])
      .map((l) => (typeof l === "string" ? l : l.name))
      .filter(Boolean);
    const labelList = labelNames.length
      ? ` · **Labels:** ${labelNames.map((n) => `\`${n}\``).join(", ")}`
      : "";
    const preview = issuePreview(issue.body);

    lines.push(`## [#${issue.number}: ${issue.title}](${issue.html_url})`);
    lines.push("");
    lines.push(`**Author:** [@${issue.user.login}](${issue.user.html_url})${labelList}`);
    if (preview) {
      lines.push("");
      lines.push(preview);
    }
    lines.push("");
  }

  if (issues.length === 0) {
    lines.push("_(No open issues — maybe the spec is perfect, or maybe the sync script hit a snag. Check the repo directly.)_");
    lines.push("");
  }

  await writeFile(join(SPEC_DIR, "open-questions.md"), lines.join("\n"));
  console.log(`  ✓ spec/open-questions.md (${issues.length} issues)`);
}

// ---------------------------------------------------------------------

console.log(`Syncing spec docs from ${REPO}…`);
try {
  await syncBrowserSupport();
  await syncOpenQuestions();
  console.log("Done.");
} catch (err) {
  console.error("Sync failed:", err.message);
  process.exitCode = 1;
}
