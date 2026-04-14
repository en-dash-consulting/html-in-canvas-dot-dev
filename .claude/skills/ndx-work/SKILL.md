---
name: ndx-work
description: Pick up a task from the PRD and begin working on it
argument-hint: "[task-id]"
---

Pick up a task from the PRD and begin working on it.

1. Read `.rex/workflow.md` for the project's execution workflow. Follow its instructions — they define the expected discipline for task execution (TDD, validation, commit conventions, etc.)
2. If task-id provided, call `get_item` (rex MCP). Otherwise call `get_next_task` (rex MCP)
3. Read task details: title, description, acceptance criteria, parent chain
4. For files mentioned in the task, use `get_file_info` and `get_imports` (sourcevision MCP) to understand current state
5. Use `get_zone` (sourcevision MCP) for the relevant architectural zone
6. Present a work plan: what needs to change, which files, what tests
7. After user approves the plan, call `update_task_status` (rex MCP) to mark as `in_progress`
8. Implement the changes following the workflow discipline
9. Run validation and tests as specified in the workflow
10. Call `append_log` (rex MCP) with what was done, decisions made, and issues encountered
11. When done, use `update_task_status` (rex MCP) to mark as `completed`
