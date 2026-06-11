## What & why

<!-- What does this change do, and what problem does it solve? Link any related issue. -->

Closes #

## Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] New behavior has matching tests
- [ ] If this touches an IPC channel, DTO, or error code, `agent_docs/ipc-contract.md` is updated in the same commit
- [ ] No new `electron` / `node:*` imports in `src/domain` or `src/application`
- [ ] Change stays within the MVP scope (or an issue was opened to discuss expanding it)

## Notes for reviewers

<!-- Anything that needs context: trade-offs, follow-ups, areas you're unsure about. -->
