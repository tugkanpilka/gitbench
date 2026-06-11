# Contributing to GitBench

Thanks for your interest in GitBench. It's a small, deliberately-scoped open-source
app, and contributions are welcome — bug fixes, docs, and well-justified features alike.

## Ground rules

GitBench follows a strict Clean Architecture with the Electron process boundaries as
delivery adapters. The layering is enforced by ESLint, and **a boundary violation is a
bug even when the code works.** Before you change anything non-trivial, skim the docs
that govern it:

| If your change touches…                     | Read first                                                 |
| ------------------------------------------- | ---------------------------------------------------------- |
| IPC channels, DTOs, error codes             | [`agent_docs/ipc-contract.md`](agent_docs/ipc-contract.md) |
| Anything that runs git or parses its output | [`agent_docs/git-notes.md`](agent_docs/git-notes.md)       |
| Layer boundaries, new modules, imports      | [`agent_docs/architecture.md`](agent_docs/architecture.md) |

A few rules are non-negotiable (the full list lives in [`CLAUDE.md`](CLAUDE.md)):

1. `contextIsolation: true`, `nodeIntegration: false` — never weaken these.
2. `ipcRenderer` exists in exactly one file: `src/preload/index.ts`.
3. `src/domain` and `src/application` are pure TypeScript — no `electron`, no `node:*`.
4. Nothing throws across IPC. Handlers return `Result<T>` envelopes; domain entities
   never cross the boundary — map them under `src/main/ipc/mappers`.
5. Git is spawned only through `src/infrastructure/git/runGit.ts`, with argument arrays.
   Never interpolate a path into a shell string.
6. `diffText === ""` is a valid success state ("clean worktree"), never an error.

## Designing a new capability

The MVP surface is three IPC channels: `repo:pick` → `worktrees:list` → `diff:get`.
Any **new capability starts as a new IPC channel designed in
[`agent_docs/ipc-contract.md`](agent_docs/ipc-contract.md) first, code second.** Changes
to channels, DTOs, or error codes must update that document **in the same commit**.

Please resist scope creep — if a feature stretches the MVP, open an issue to discuss it
before writing code.

## Development workflow

```bash
npm install
npm run dev          # electron-vite dev mode
```

Before opening a pull request, make sure all three checks pass:

```bash
npm run typecheck    # all targets: main / preload / renderer
npm run test         # vitest — domain, application, and parsers run without Electron
npm run lint
```

The same checks run in CI on every pull request.

## Testing expectations

- **Domain / application** — unit tests with fake port implementations; no Electron, no
  child processes.
- **Git parsers** — pure fixture-based tests.
- **Git readers** — integration tests against temporary repositories (skipped if `git`
  is unavailable).
- **Renderer** — component tests that stub `window.api`, including error and empty-diff
  states.

New behavior should arrive with the matching kind of test.

## Pull requests

- Keep PRs focused; one logical change per PR.
- Write a clear description of _what_ and _why_. Link any related issue.
- Make sure `typecheck`, `test`, and `lint` are green locally.
- If you changed an IPC channel, DTO, or error code, confirm `agent_docs/ipc-contract.md`
  is updated in the same commit.

## Reporting bugs and requesting features

Use the issue templates. For bugs, include your OS, your `git --version`, and the exact
steps to reproduce. For features, describe the worktree/agent workflow you're trying to
support — that context helps us keep the MVP coherent.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
