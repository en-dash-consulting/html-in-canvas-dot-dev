---
name: ndx-zone
description: Deep-dive into an architectural zone's structure and health
argument-hint: "[zone-id]"
---

Deep-dive into an architectural zone's structure and health.

1. If no zone-id given, call `get_overview` (sourcevision MCP) and list available zones with brief descriptions. Ask which to explore.
2. Call `get_zone` (sourcevision MCP) with the zone ID for full details
3. Read `.sourcevision/zones/{zone-id}/context.md` for detailed context
4. Call `get_findings` (sourcevision MCP) and filter to findings relevant to this zone
5. Call `get_imports` (sourcevision MCP) for cross-zone dependency edges
6. Present: zone purpose, key files, cohesion/coupling metrics, findings, and cross-zone dependencies
