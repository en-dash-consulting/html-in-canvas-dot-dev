---
name: ndx-plan
description: Analyze the codebase and propose PRD updates
---

Analyze the codebase and propose PRD updates.

1. Call `get_overview` (sourcevision MCP) to understand current project state
2. Call `get_findings` (sourcevision MCP) to identify anti-patterns and suggestions
3. Call `get_prd_status` (rex MCP) to see existing PRD items and avoid duplicates
4. Call `get_next_steps` (sourcevision MCP) for prioritized recommendations
5. Based on findings, existing gaps, and any user-described goals, propose new epics/features/tasks
6. Present proposals to the user for review
7. For each approved proposal, use `add_item` (rex MCP) to create it with appropriate descriptions, acceptance criteria, and parent placement
8. Show the updated PRD tree via `get_prd_status`
