# Architecture

Clean Architecture with Electron process boundaries as delivery adapters. The goal is to keep domain and application code framework-neutral, keep Git behind output ports, and prevent the renderer from knowing about Node, Electron internals, or Git processes.

## Dependency direction

```text
renderer -> preload/window.api -> main IPC handlers -> application -> domain
                                                    |
                                                    -> infrastructure implements application ports
```

Dependencies point inward:

```text
domain         -> nothing
application    -> domain
infrastructure -> application, domain, node:*
contracts      -> nothing outside contracts
main           -> application, domain, infrastructure, contracts, electron, node:*
preload        -> contracts, electron
renderer       -> contracts (types/runtime channel contract), renderer-local modules
```

Violations are architecture bugs even when the code works. ESLint enforces the major import boundaries in `eslint.config.mjs`.

## Responsibilities

| Layer          | Location             | Responsibility                                                               |
| -------------- | -------------------- | ---------------------------------------------------------------------------- |
| Domain         | `src/domain`         | Business entities and invariants. Pure TypeScript.                           |
| Application    | `src/application`    | Use cases, output ports, and application-level errors. Pure TypeScript.      |
| Infrastructure | `src/infrastructure` | Output adapters. The Git CLI implementation and parsing live here.           |
| Contracts      | `src/contracts`      | IPC channels, request/response DTOs, `Result<T>`, and the preload API type.  |
| Main           | `src/main`           | Electron lifecycle, composition root, IPC input adapters, DTO/error mapping. |
| Preload        | `src/preload`        | The single `ipcRenderer` bridge exposing `window.api`.                       |
| Renderer       | `src/renderer`       | React UI organized by feature. It communicates only through `window.api`.    |

## Directory layout

```text
src/
  domain/
    worktree/
      Worktree.ts

  application/
    worktrees/
      errors/
      ports/
        CommitReader.ts
        DiffReader.ts
        WorktreeReader.ts
      use-cases/
        getUncommittedDiff.ts
        listUnpushedCommits.ts
        listWorktrees.ts

  infrastructure/
    git/
      errors/
      parsers/
        commitLogParser.ts
        porcelainParser.ts
      readers/
        GitCliCommitReader.ts
        GitCliDiffReader.ts
        GitCliWorktreeReader.ts
      runGit.ts

  contracts/
    ipc/
      api.ts
      channels.ts
      commits.ts
      diff.ts
      errors.ts
      repository.ts
      result.ts
      worktrees.ts
      index.ts

  main/
    bootstrap/
      compositionRoot.ts
      createWindow.ts
    ipc/
      handle.ts            # wraps a handler so it always returns a Result<T>, never throws across IPC
      handlers/            # one input adapter per channel
        pickRepositoryHandler.ts
        listWorktreesHandler.ts
        getDiffHandler.ts
        listUnpushedCommitsHandler.ts
      mappers/             # domain entities -> contract DTOs, application errors -> error codes
        worktreeMapper.ts
        commitMapper.ts
        errorMapper.ts
      registerHandlers.ts  # binds each channel to its handler on app startup
      result.ts            # ok()/err() helpers for building Result<T> envelopes
    index.ts

  preload/
    index.ts

  renderer/
    src/
      app/
      features/
        diff-viewer/
        repository-picker/
        worktree-browser/
        worktree-list/
      shared/
        api/
      styles/
```

## Boundary rules

1. Domain and application code must not import `electron`, `node:*`, React, contracts, or outer layers.
2. Infrastructure implements application ports. It must not be imported by application or domain.
3. `src/main/bootstrap/compositionRoot.ts` is the only place that constructs concrete Git adapters and injects them into use cases.
4. Domain entities never cross IPC. Main IPC mappers convert them into contract DTOs.
5. IPC handlers catch all failures and return `Result<T>` envelopes.
6. `src/preload/index.ts` is the only file that imports `ipcRenderer`.
7. Renderer code accesses IPC only through `src/renderer/src/shared/api/desktopApi.ts`.
8. Renderer organization is feature-based; do not reproduce backend layers inside React.
9. `repo:pick` deliberately bypasses application because folder selection is pure Electron UI with no domain behavior.

## Key decisions

1. **Git CLI over libraries.** Linked worktrees use a `.git` file, and the system Git CLI handles this correctly without Electron native-module rebuilds.
2. **Worktrees are a flat list.** They are sibling checkouts, not a hierarchy.
3. **Result envelopes instead of cross-process exceptions.** Electron IPC does not preserve custom `Error` instances.
4. **Empty diff is data.** `diffText === ""` is the successful clean-worktree state.
5. **Contracts are explicit.** Channel names and transport shapes live together under `src/contracts/ipc`.

## Testing strategy

- Domain/application: unit tests with fake port implementations, without Electron or child processes.
- Git parsers: pure fixture-based tests.
- Git readers: integration tests against temporary repositories, skipped if Git is unavailable.
- Main IPC mappers/handlers: focused unit tests when mapping or branching behavior grows.
- Renderer: component tests stub `window.api`, including errors and empty-diff behavior.
