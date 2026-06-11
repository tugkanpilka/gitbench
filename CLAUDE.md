# Worktree Diff Viewer

Electron desktop app: pick a repository, browse its Git worktrees in a sidebar, view the uncommitted diff of any worktree. Open source. TypeScript everywhere.

MVP scope is deliberately small: `repo:pick` → `worktrees:list` → `diff:get`. Resist scope creep; any new capability starts as a new IPC channel designed in `agent_docs/ipc-contract.md` first, code second.

## Stack

- Electron + electron-vite, React renderer, strict TypeScript, Vitest
- Git access: shell out to the system `git` CLI. **Not** isomorphic-git (cannot resolve refs when `.git` is a file — which is exactly what linked worktrees are), **not** nodegit (native rebuilds against Electron's ABI, recurring breakage). Rationale and quirks: `agent_docs/git-notes.md`.

## Commands

```bash
npm run dev          # electron-vite dev mode
npm run build        # production build
npm run typecheck    # all three targets: main / preload / renderer
npm run test         # vitest — domain, application, and parsers run without Electron
npm run lint
```

## Architecture, one line

renderer → preload (`window.api`) → main IPC handlers → application use cases → domain, with infrastructure implementing application ports

Layer rules, import matrix, directory layout: `agent_docs/architecture.md`.

## Hard rules

1. `contextIsolation: true`, `nodeIntegration: false`. Never weaken these.
2. `ipcRenderer` exists in exactly one file: `src/preload/index.ts`.
3. `src/domain` and `src/application` are pure TypeScript — no `electron`, no `node:*` imports. Side effects live behind application ports and are implemented in `src/infrastructure`.
4. Nothing throws across IPC. Handlers return `Result<T>` envelopes; domain entities never cross IPC — map them under `src/main/ipc/mappers`. The contract lives in `agent_docs/ipc-contract.md` and changes to channels/DTOs/error codes must update that file **in the same commit**.
5. Git is spawned only through `src/infrastructure/git/runGit.ts`, with argument arrays. Never interpolate a path into a shell string.
6. `diffText === ""` is a valid success state ("clean worktree"), never an error.
7. Worktrees render as a **flat list** — `git worktree list` returns sibling checkouts, not a hierarchy. Tree UI is reserved for changed files _within_ a worktree, if that view is ever added.

## Read this before touching that

| Task touches…                               | Read first                   |
| ------------------------------------------- | ---------------------------- |
| IPC channels, DTOs, error codes             | `agent_docs/ipc-contract.md` |
| Anything that runs git or parses git output | `agent_docs/git-notes.md`    |
| Layer boundaries, new modules, imports      | `agent_docs/architecture.md` |

## Open decisions — surface them, do not decide silently

- ~~Diff rendering library~~ — **decided (2026-06-10): `react-diff-view`** (consumes git unified diff directly via `parseDiff`; lives only in `renderer/src/features/diff-viewer/DiffView.tsx`).
- Refresh model: MVP is manual refresh. No file watching yet.
- Untracked files: MVP shows changes to tracked files only (`git diff HEAD` limitation — see `agent_docs/git-notes.md`). UI copy must say "uncommitted changes to tracked files".

If a task forces one of these decisions, stop and raise it instead of picking one implicitly.
