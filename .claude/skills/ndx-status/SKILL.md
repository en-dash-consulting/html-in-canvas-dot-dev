---
name: ndx-status
description: Show comprehensive project status combining PRD progress and codebase health
---

Show comprehensive project status combining PRD progress and codebase health.

1. Call `get_prd_status` (rex MCP) for PRD tree with completion stats
2. Call `get_overview` (sourcevision MCP) for codebase metrics (files, zones, languages)
3. Call `get_findings` (sourcevision MCP) with severity "warning" or "critical" for active issues
4. Call `health` (rex MCP) for structure health score
5. Call `get_next_task` (rex MCP) to show recommended next action
6. Present a unified report: progress, health, critical findings, and next steps
