# Architecture

Clean Architecture with Electron process boundaries as delivery adapters. The goal is to keep domain and application code framework-neutral, keep Git behind output ports, and prevent the renderer from knowing about Node, Electron internals, or Git processes.

## Dependency direction

```text
renderer -> preload/window.api -> main IPC handlers -> infrastructure readers
                                                    |
                                                    -> application (errors) -> domain
```

Main wires the concrete infrastructure readers (and the watcher) directly and injects
them into thin handlers. There are no single-implementation application ports or
forwarding use-case factories: this viewer commits to the git CLI with no pluggable
backend, so the port + factory ceremony was removed. The infra/application directional
boundary still holds — infrastructure may depend on application errors; application
never depends on infrastructure. Reintroduce a port only when a second implementation
or a real test seam actually exists.

Dependencies point inward:

```text
domain         -> nothing                                  (currently no files)
application    -> domain
infrastructure -> application, domain, node:*
contracts      -> nothing outside contracts
main           -> application, domain, infrastructure, contracts, electron, node:*
preload        -> contracts, electron
renderer       -> contracts (types/runtime channel contract), renderer-local modules
```

The `domain` rows describe the permission boundary that still applies the moment a
real entity is added; the `src/domain` directory itself is currently absent (see the
Responsibilities table). Violations are architecture bugs even when the code works. ESLint enforces the major import boundaries in `eslint.config.mjs`.

## Responsibilities

| Layer          | Location             | Responsibility                                                               |
| -------------- | -------------------- | ---------------------------------------------------------------------------- |
| Domain         | `src/domain`         | Business entities and invariants. Pure TypeScript. **Currently absent** — the directory was removed with the behaviorless `Worktree` alias; recreate it only when a real worktree entity with invariants exists. |
| Application    | `src/application`    | Application-level errors and the canonical commit-change types. Pure TypeScript. |
| Infrastructure | `src/infrastructure` | Output adapters. The Git CLI implementation and parsing live here.           |
| Contracts      | `src/contracts`      | IPC channels, request/response DTOs, `Result<T>`, and the preload API type.  |
| Main           | `src/main`           | Electron lifecycle, composition root, IPC input adapters, DTO/error mapping. |
| Preload        | `src/preload`        | The single `ipcRenderer` bridge exposing `window.api`.                       |
| Renderer       | `src/renderer`       | React UI organized by feature. It communicates only through `window.api`.    |

## Directory layout

```text
src/
  # domain/ — directory removed (the behaviorless Worktree alias is gone);
  #           recreate only for a future entity that carries real invariants

  application/
    worktrees/
      commits.ts           # canonical CommitFileChange/Status + UnpushedCommit(s)
      errors/
        NotARepositoryError.ts
        WorktreeNotFoundError.ts

  infrastructure/
    git/
      errors/
      mapWithConcurrency.ts
      parsers/
        commitLogParser.ts
        porcelainParser.ts   # exports ParsedWorktree (the reader's pre-DTO shape)
        worktreeSummaryParser.ts
      readers/               # concrete readers, wired directly by main (no port interface)
        GitCliCommitReader.ts
        GitCliDiffReader.ts
        GitCliWorktreeReader.ts
        GitCliWorktreeSummaryReader.ts
      runGit.ts
    watch/
      ChokidarRepoWatcher.ts # exports RepoWatchTarget/RepoWatchHandle; containsIgnoredSegment
      recursiveWatch.ts

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
        App.tsx              # composition boundary: maps diffModel.files -> ChangedFileItem[],
                             # owns the scroll-container ref injected into AppShell + DiffView
        app-shell/           # attaches the scroll-container ref to the scrollable <main>
        workspace/
        hooks/
          useDiffNavigation.ts  # model-identity reset during render (no synchronous effect)
        changedFileItems.ts  # toChangedFileItems(): DiffFileModel[] -> ChangedFileItem[]
      features/
        diff-viewer/
          index.tsx          # collapse state reset via a React key on model identity
          hooks/
            useActiveFileScrollSpy.ts  # injected scrollContainerRef param
            useScrollToSection.ts      # command hook (no pending-scroll state)
        repository-sidebar/
        worktree-detail-sidebar/
        worktree-browser/
          index.ts           # thin facade composing the three resource hooks
          hooks/
            useRepositoryCatalog.ts       # repo path, worktrees, summaries, open/refresh
            useSelectedWorktreeDetails.ts  # selection, diff, commits
            useRepositoryWatcher.ts        # watch start/stop + repo:changed subscription
            useLatestRequest.ts            # latest-wins freshness guard
        worktree-list/
          changed-file-item.ts  # neutral ChangedFileItem model (no diff-viewer import)
      shared/
        api/
        ui/
          diff-stat/          # emphasis variant ("muted") — owns its own presentation
          segmented-control/  # density variant ("compact") — owns its own presentation
      styles/
```

## Boundary rules

1. Domain and application code must not import `electron`, `node:*`, React, contracts, or outer layers.
2. Infrastructure provides the concrete readers/watcher. It may import application errors and the canonical commit types; it must not be imported by application or domain, and must not import contracts.
3. `src/main/bootstrap/compositionRoot.ts` is the only place that constructs the concrete readers/watcher and injects them into handlers.
4. Reader/application entities never cross IPC. Main IPC mappers convert them into contract DTOs (`ParsedWorktree`/`WorktreeSummary`/`UnpushedCommits` -> DTOs).
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

- Application: pure unit tests of errors and shared types, without Electron or child processes.
- Git parsers: pure fixture-based tests.
- Git readers: integration tests against temporary repositories, skipped if Git is unavailable.
- Main IPC mappers/handlers: focused unit tests when mapping or branching behavior grows.
- Renderer: component tests stub `window.api`, including errors and empty-diff behavior.

The planned renderer module boundaries, state migration, shared UI extraction criteria,
and responsive layout contract are documented in
[`renderer-refactoring.md`](renderer-refactoring.md).
