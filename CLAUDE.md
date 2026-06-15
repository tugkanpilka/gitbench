# Worktree Diff Viewer

Electron desktop app: pick a repository, browse Git worktrees in a source sidebar, inspect the selected worktree in a detail sidebar, and view its uncommitted diff and unpushed commits. Open source. TypeScript everywhere.

Capabilities map one-to-one onto IPC channels: `repo:pick` → `worktrees:list` → `diff:get` → `commits:unpushed`. Any new capability starts as a new IPC channel designed in `agent_docs/ipc-contract.md` first, code second.

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

renderer → preload (`window.api`) → main IPC handlers → concrete infrastructure readers, with application holding errors/shared types and domain reserved for future entities (no single-impl ports or forwarding factories)

Layer rules, import matrix, directory layout: `agent_docs/architecture.md`.

## Hard rules

1. `contextIsolation: true`, `nodeIntegration: false`. Never weaken these.
2. `ipcRenderer` exists in exactly one file: `src/preload/index.ts`.
3. `src/domain` and `src/application` are pure TypeScript — no `electron`, no `node:*` imports. Side effects live in `src/infrastructure` (concrete readers), which never imports `contracts`, `main`, or `preload`.
4. Nothing throws across IPC. Handlers return `Result<T>` envelopes; reader/application entities never cross IPC — map them to DTOs under `src/main/ipc/mappers`. The contract lives in `agent_docs/ipc-contract.md` and changes to channels/DTOs/error codes must update that file **in the same commit**.
5. Git is spawned only through `src/infrastructure/git/runGit.ts`, with argument arrays. Never interpolate a path into a shell string.
6. `diffText === ""` is a valid success state ("clean worktree"), never an error.
7. Worktrees render as a **flat list** — `git worktree list` returns sibling checkouts, not a hierarchy. Tree UI is reserved for changed files _within_ a worktree, if that view is ever added.
8. JSX describes _what_ renders, not _how_ it is decided. No control-flow operators in markup for conditional rendering — no `&&`, ternary, or whole-component early-return to choose output. Use `<Switch>/<Match>` (first-match-wins) for mutually-exclusive states and `<Visibility>` for show/hide, so exclusivity is structural rather than maintained by hand-written guards. Primitives live in `src/renderer/src/shared/ui`. Rationale and worked example: `agent_docs/architecture.md`.

## Read this before touching that

| Task touches…                               | Read first                   |
| ------------------------------------------- | ---------------------------- |
| IPC channels, DTOs, error codes             | `agent_docs/ipc-contract.md` |
| Anything that runs git or parses git output | `agent_docs/git-notes.md`    |
| Layer boundaries, new modules, imports      | `agent_docs/architecture.md` |
| Renderer markup / conditional rendering     | `agent_docs/architecture.md` |

## Open decisions — surface them, do not decide silently

- ~~Diff rendering library~~ — **decided (2026-06-10): `react-diff-view`** (consumes git unified diff directly via `parseDiff`; lives only in `renderer/src/features/diff-viewer/DiffView.tsx`).
- ~~Refresh model: MVP is manual refresh. No file watching yet.~~ — **decided (2026-06-11): Chokidar-based file watching** (debounced `.git` + working-tree signals via `watch:start` / `watch:stop` / `repo:changed` IPC channels; renderer auto-refreshes silently without loading spinners).
- Untracked files: MVP shows changes to tracked files only (`git diff HEAD` limitation — see `agent_docs/git-notes.md`). UI copy must say "uncommitted changes to tracked files".

If a task forces one of these decisions, stop and raise it instead of picking one implicitly.
