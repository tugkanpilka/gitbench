---
name: Feature request
about: Suggest an idea for GitBench
title: ''
labels: enhancement
assignees: ''
---

## The workflow you're trying to support

GitBench's MVP is deliberately small: `repo:pick` → `worktrees:list` → `diff:get`.
Describe the worktree or agent workflow you want to make easier — the concrete problem
matters more than the proposed UI.

## Proposed solution

What would you like GitBench to do?

## Does this need a new IPC channel?

New capabilities start as a new IPC channel designed in `agent_docs/ipc-contract.md`
first, code second. If you know the shape of the data you'd need across the boundary,
sketch it here.

## Alternatives considered

Any workarounds you use today, or other approaches you weighed.

## Additional context

Anything else — screenshots, links, related issues.
