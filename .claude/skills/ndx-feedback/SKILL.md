---
name: ndx-feedback
description: Submit feedback, bug reports, or feature requests for n-dx
argument-hint: "[description]"
---

Submit feedback about n-dx — bug reports, feature requests, suggestions, or general observations.

## Process

1. If a description is provided, use it. Otherwise, ask the user what feedback they'd like to share.
2. Categorize the feedback:
   - **Bug** — something broken, unexpected behavior, error messages
   - **Feature request** — new capability or workflow improvement
   - **Improvement** — enhancement to existing functionality
   - **Question** — confusion about how something works (may indicate a docs gap)
3. Gather context automatically (see below)
4. Ask the user: "Would you like to include project context (languages, file count, zone structure)? No code or sensitive data is shared." If yes, include the project profile.
5. Draft a GitHub issue with:
   - Clear title (concise, actionable)
   - Description with context (what happened, what was expected, steps to reproduce for bugs)
   - Relevant labels: `bug`, `enhancement`, `question`, or `documentation`
   - Environment and optional project profile sections
6. Present the draft to the user for review before submitting
7. Create the issue using `gh issue create` on `en-dash-consulting/n-dx`
8. If `gh` is not available or auth fails, provide the formatted issue content for manual submission

## Context gathering

**Always included (automatic):**
- n-dx version from package.json or ndx --version
- Node.js version
- OS platform
- LLM provider (claude/codex) and mode (api/cli)
- Recent error output if available from conversation context

**Opt-in project profile** (only with user consent, never includes code):
- Call `get_overview` (sourcevision MCP) to get:
  - Primary languages and file count
  - Number of architectural zones
  - Analysis freshness (last run date)
- Call `get_prd_status` (rex MCP) to get:
  - Total PRD items and completion percentage
  - Number of epics
- This helps the n-dx team understand what kinds of projects hit which issues

**Never included:**
- Source code, file contents, or file paths
- API keys, tokens, or credentials
- Git history or commit messages
- PRD item titles or descriptions

## Labels

| Category | Label |
|----------|-------|
| Bug | `bug` |
| Feature request | `enhancement` |
| Improvement | `enhancement` |
| Question / docs gap | `question` |
| UX / ergonomics | `ux` |
