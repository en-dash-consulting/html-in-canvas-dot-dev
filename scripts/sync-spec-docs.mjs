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
  const devTrial =
    extractSection(readme, "Developer Trial (dev trial) Information") ??
    "## Developer Trial (dev trial) Information\n\n_(not found in upstream README)_";

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
    status,
    "",
    devTrial,
    "",
    "## How to try it",
    "",
    "You can run the demos on either Chrome Canary or a current Brave Stable — the flag lives in Chromium and rides along with any fork whose base milestone includes it.",
    "",
    "### Option A — Chrome Canary",
    "",
    "1. Install [Chrome Canary](https://www.google.com/chrome/canary/).",
    "2. Visit `chrome://flags/#canvas-draw-element` and enable the flag.",
    "3. Restart the browser.",
    "4. Load any demo from the [demo gallery](/demos/).",
    "",
    "### Option B — Brave Stable (Chromium 147+)",
    "",
    "Confirmed working on [Brave](https://brave.com/) Stable 1.89.132 / Chromium 147.0.7727.56. Older builds may not expose the flag.",
    "",
    "1. Update Brave to a current Stable build (Menu → Brave → About Brave triggers an update).",
    "2. Visit `brave://flags/#canvas-draw-element` and enable the flag.",
    "3. Restart the browser.",
    "4. Load any demo from the [demo gallery](/demos/).",
    "",
    "## Other browsers",
    "",
    "- **Brave:** supported on recent Stable builds (≥ 1.89.132 / Chromium 147) behind `brave://flags/#canvas-draw-element`.",
    "- **Firefox:** no implementation announced.",
    "- **Safari / WebKit:** no implementation announced.",
    "- **Edge / other Chromium forks:** the flag rides along wherever the underlying Chromium milestone has shipped the canvas-draw-element code. Try `chrome://flags/#canvas-draw-element` (or the fork's equivalent) on a recent build.",
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
    .replace(/<!--[\s\S]*?-->/g, "")
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
  return joined.length > 360 ? joined.slice(0, 357) + "…" : joined;
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
