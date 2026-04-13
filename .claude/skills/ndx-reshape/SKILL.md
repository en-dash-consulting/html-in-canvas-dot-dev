---
name: ndx-reshape
description: Restructure the PRD hierarchy — regroup epics, change levels, merge overlaps, create new containers
---

Restructure the PRD hierarchy to keep it organized as a coherent product spec.

Use this when the PRD has grown organically and needs cleanup: too many top-level epics, features that should be tasks, overlapping areas that should be merged, or items that belong under different parents.

## Process

1. Call `get_prd_status` (rex MCP) to see the full epic/feature structure and item counts
2. Analyze the current structure for problems:
   - **Too many epics** — related epics that should be features under a broader epic
   - **Wrong levels** — epics with no children that are really tasks, features that are really subtasks
   - **Overlapping areas** — multiple epics/features covering the same domain
   - **Orphaned items** — tasks at root level that belong under an existing epic
   - **Naming inconsistency** — similar items with different naming conventions
3. Propose a target structure to the user:
   - Group related epics into ~7-12 top-level epics max (one per product area)
   - Each epic should have 3-15 features; each feature should have 2-10 tasks
   - Suggest new parent epics if needed to group scattered items
   - Suggest level changes (epic->feature, feature->task, etc.)
   - Suggest merges for overlapping items
4. After user approval, execute the restructuring:
   - Create new parent epics/features with `add_item` (rex MCP)
   - Reparent items with `move_item` (rex MCP)
   - Change levels with `edit_item` (rex MCP) using the `level` field
   - Merge overlapping items with `merge_items` (rex MCP)
   - Rename items for consistency with `edit_item` (rex MCP)
5. Run `reorganize` (rex MCP) with mode `fast` to verify no structural issues remain
6. Show the updated structure via `get_prd_status`

## Guidelines

- **Batch by area**: restructure one domain at a time, confirm with the user, then move on
- **Preserve meaning**: when changing levels or merging, keep the original intent clear in descriptions
- **Natural groupings**: organize by product area (e.g., SourceVision, Rex, Hench, Web, CLI, Infrastructure) rather than by work type (bugfixes, features, refactors)
- **Living spec**: the PRD should read as a product spec, not a task backlog. Epic titles should describe product capabilities, not work items
- **Level cascade**: when demoting an epic to a feature, its children may need to move down too (features->tasks, tasks->subtasks)

## MCP Tools Used

- `get_prd_status` — read current structure
- `add_item` — create new parent containers
- `move_item` — reparent items under new parents
- `edit_item` — change level, rename, update descriptions
- `merge_items` — consolidate overlapping items
- `reorganize` — verify structural health after changes
