---
name: ndx-capture
description: Capture a requirement, feature idea, or task from conversation context
argument-hint: "[description]"
---

Capture a requirement, feature idea, or task from conversation context.

1. If a description is provided, use it. Otherwise, review recent conversation for feature requests, requirements, or product decisions
2. Call `get_prd_status` (rex MCP) to understand current PRD structure
3. Determine the appropriate level:
   - Epic: large initiative spanning multiple features
   - Feature: a capability or user-facing behavior
   - Task: a concrete, implementable work item
4. Find the appropriate parent by matching to existing epics/features
5. Draft the item: title, description, acceptance criteria
6. Present to the user for confirmation before creating
7. Use `add_item` (rex MCP) to create, then confirm placement in hierarchy
8. Check for dependencies: does this item block or depend on other pending items? If so, set `blockedBy` via `edit_item` (rex MCP)

## Always do these without being asked

- **Place under a parent** — never leave items at root level. Match to the closest existing epic/feature.
- **Set dependencies** — if multiple items are being captured, or if existing pending items have ordering relationships, wire `blockedBy` edges.
- **Set priority** — infer from context (urgency, blocking status, user language like "critical", "should", "nice to have").
