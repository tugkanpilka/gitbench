# Codebase Audit — gitbench (Worktree Diff Viewer)

Audit date: 2026-06-13

> Senior-architect audit against a fixed value system: short over clever, explicit over abstract,
> readability over configurability, simplicity over extensibility, local reasoning over indirection.
> Deletion is preferred over abstraction; obvious code over elegant code.
>
> Method: 8 module-group auditors fanned out across ~120 source files, every finding passed through an
> adversarial verifier that defaulted to _refute_, then a synthesis pass. The project's intentional
> constraints (git-CLI choice, `Result<T>` envelopes, pure domain/application layers, the deliberate
> "design palette" of unused UI variants/tokens) were treated as ground truth and **not** counted against it.
> 12 findings survived verification.

---

## Module assessments at a glance

| Module group                                    | Verdict                                                                                             | Confirmed findings |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| `main/ipc` (handlers, mappers, watchController) | **Exemplary** — thin adapters, tripwire tests, no business logic in the boundary                    | 0                  |
| `infrastructure/git`                            | **Strong** — `runGit` choke point, pure parsers, proven reuse                                       | 1 (Low)            |
| `contracts` + `preload`                         | **Solid** — explicit IPC surface, one vestigial type copy                                           | 1 (in top-10)      |
| `infrastructure/watch` + `bootstrap`            | **Good** — port-isolated watcher, sound debounce; minor naming/identity-wrapper noise               | 1 (Low)            |
| `domain` + `application`                        | **Over-abstracted at the thin end** — single-impl ports, forwarding factories, behaviorless entity  | 2                  |
| `renderer/app` + `shared`                       | **Good with leaks** — clean shell/primitives, but cross-feature coupling + `:global` CSS            | 3                  |
| `renderer/worktree-list`                        | **Acceptable pre-refactor baseline** — clean flat list; changed-files subtree leaks across features | 1 (Low)            |
| `renderer/diff-viewer` + sidebars               | **Clean components, heavy hooks** — god-hook + effect-driven derived state                          | 5                  |

---

## Findings

Ordered by severity. Each finding was independently verified; severities reflect post-verification adjustment.

### 1. `:global` CSS reaches through SegmentedControl's private class names — silently broken in production

- **Severity:** High
- **File:** `src/renderer/src/features/worktree-detail-sidebar/index.module.scss:160`
- **Issue:** `.worktree-detail-sidebar__view-toggle :global(.gb-segmented-control__item)` overrides padding/font-size by reaching into SegmentedControl's private CSS-module class.
- **Why this matters:** CSS-module class names are hashed in production (e.g. `_gb-segmented-control__item_1299k_20`), so the `:global` selector targeting the unhashed literal **never matches in the shipped build** — the override is silently lost. This is a latent production bug, not just a smell, and it couples the consumer to a private internal. `renderer-refactoring.md` §6 explicitly calls the pattern out.
- **Minimal refactor direction:** Add a real `density`/`size` variant (e.g. `density="compact"`) to SegmentedControl, or expose CSS custom properties (`--gb-segmented-item-padding`). The component owns its styling; the feature passes a supported prop.
- **Expected improvement:** Production CSS contains only selectors that match; styling intent becomes explicit and testable; one less silent failure.

### 2. `:global` CSS reaches through DiffStat's private class names — same production failure

- **Severity:** High
- **File:** `src/renderer/src/features/worktree-list/index.module.scss:18-24`
- **Issue:** `.file-navigation-row :global(.gb-diff-stat)` and `.file-navigation-row--flat :global(.gb-diff-stat)` override DiffStat opacity/transform via its private class.
- **Why this matters:** Identical mechanism to finding 1 — the hashed production class (`_gb-diff-stat_oceur_1`) means the override never applies in the shipped app. Impact is subtler (opacity/scale) but the failure mode is the same and equally invisible.
- **Minimal refactor direction:** Add an `emphasis`/`visual` variant to DiffStat (e.g. `emphasis="muted"`); pass it from `file-navigation-row`. DiffStat becomes the single source of truth for its presentation.
- **Expected improvement:** Styling declared at the component level, no silent production CSS failures, one DiffStat presentation contract across all contexts.

### 3. Effect-driven state reset on diff-model change causes render-then-repaint double passes

- **Severity:** High
- **File:** `src/renderer/src/features/diff-viewer/index.tsx:24-27`
- **Issue:** A `useEffect` synchronously resets `collapsedFiles` and `pendingScrollId` whenever the diff model changes, forcing a second render before the new diff paints.
- **Why this matters:** Resetting local state through an effect (rather than at the logical instance boundary) yields two render passes and timing-coupled behavior. `renderer-refactoring.md` §5 requires resetting component-local state with an intentional React `key` when the logical instance changes, not via effects.
- **Minimal refactor direction:** Put a `key` (model identity) on the `DiffView` subtree so a new diff resets child state automatically, or move the local state into a reducer keyed by model identity.
- **Expected improvement:** Single render pass, no flicker, state transitions tied explicitly to "a new diff," easier to test.

### 4. Five single-implementation application ports + forwarding-only use-case factories

- **Severity:** Medium
- **File:** `src/application/worktrees/ports/` (`WorktreeReader`, `CommitReader`, `DiffReader`, `WorktreeSummaryReader`, `RepoWatcher`) and the use-case factory closures that only forward
- **Issue:** Every port has exactly one implementation, and the use-case factories are pure forwarding closures — no validation, composition, or error handling. Abstraction depth without matching application complexity.
- **Why this matters:** Ports earn their keep when multiple strategies exist or infrastructure must change without the application knowing. `CLAUDE.md` deliberately commits to git-CLI with no pluggable backends, and this is a viewer with almost no domain logic. The result is one-consumer indirection that adds reading burden ("interface contract vs. implementation?") and pass-through layers that violate "simplicity over extensibility" and "generic code only when reuse is proven." _Note: the infrastructure/application boundary itself is a legitimate hard rule — the issue is the port-plus-forwarding-wrapper ceremony, not the boundary._
- **Minimal refactor direction:** Collapse the port + forwarding-factory pattern. Wire concrete readers into handlers (or behind one narrow interface) while preserving the infra/application boundary. Reintroduce a port the moment a second implementation (or a real test seam) actually exists.
- **Expected improvement:** Removes 5 port files plus 5 forwarding factories; shorter call paths; intent reads as "this runs git," not "delegate to a port that delegates to a git reader."

### 5. `useActiveFileScrollSpy` discovers its scroll root via DOM traversal + a magic CSS class

- **Severity:** Medium
- **File:** `src/renderer/src/features/diff-viewer/hooks/useActiveFileScrollSpy.ts`
- **Issue:** The hook walks the DOM and falls back to the `.app-shell__content` class to find its scroll container, coupling reusable scroll-tracking to layout implementation details.
- **Why this matters:** This is a dependency-injection violation — a generic behavior is tied to a specific layout class and is untestable in isolation. `renderer-refactoring.md` §4 flags it. (The DOM-walk works today and the class is only a jsdom test fallback, which is why this is Medium, not High.)
- **Minimal refactor direction:** Accept `scrollContainerRef: RefObject<HTMLElement | null>` as an explicit parameter; App creates the ref and injects it into both AppShell and the hook. Delete `findScrollRoot()`/`.closest()`.
- **Expected improvement:** Hook becomes a pure, composable, testable scroll-tracker with explicit dependencies; tests supply a ref instead of a DOM fixture.

### 6. `useWorktreeBrowser` is a ~300-line god-hook fusing three independent state domains

- **Severity:** Medium
- **File:** `src/renderer/src/features/worktree-browser/index.ts`
- **Issue:** One hook combines 9 state slices (`repoPath`, `worktrees`, `summaries`, `selectedPath`, `diff`, `commits`, `error`, `loading`, `diffLoading`), 3 `AbortController` refs for request freshness, watcher lifecycle, and auto-refresh subscriptions.
- **Why this matters:** A single shared `error` slot and intertwined transitions cause real state-consistency hazards (a failed repo replacement clears the worktree list; a failed refresh wipes data). The cognitive load violates "local reasoning." `renderer-refactoring.md` §1 documents this as Phase-1 stabilization work. (Medium because it is correct, well-tested, and on the roadmap — not a current correctness defect.)
- **Minimal refactor direction:** Split into `useRepositoryCatalog` (path, worktrees, summaries, open/refresh), `useSelectedWorktreeDetails` (selection, diff, commits), and `useRepositoryWatcher` (start/stop/subscription); keep `useWorktreeBrowser` as the facade. Use reducers for repo and selection transitions so atomic updates stay atomic.
- **Expected improvement:** Failure transitions become explicit and testable; the public API stays the same while internal clarity rises sharply.

### 7. `FileListProvider` imports diff-viewer's internal `DiffFileModel`

- **Severity:** Medium
- **File:** `src/renderer/src/features/worktree-list/file-list-context.tsx`
- **Issue:** The provider imports `DiffFileModel` and calls `directoryPathsForFile()` from diff-viewer — solely to read `file.path.directory` for tree navigation.
- **Why this matters:** Changed-file navigation should own its model independently of how the diff viewer parses hunks/tokens. This is the codebase's worst cross-feature coupling and blocks the Phase-2 feature split (`renderer-refactoring.md` §2). (Medium, not High: only `path.directory` leaks, and the fix is already specified.)
- **Minimal refactor direction:** Define a neutral `ChangedFileItem` type owned by `worktree-list` (id, path {directory, name}, status, additions/deletions). App becomes the composition boundary, mapping `diffModel.files → ChangedFileItem[]` before passing to the sidebar. Drop the `DiffFileModel` import.
- **Expected improvement:** Features test and evolve independently; the detail sidebar can accept changed files from any source, not only the diff parser.

### 8. `Worktree` domain entity is a behaviorless alias of `WorktreeDto`

- **Severity:** Low
- **File:** `src/domain/worktree/Worktree.ts`
- **Issue:** A bare interface with no invariants, validation, methods, or behavior — structurally identical to `WorktreeDto`. Naming-only indirection.
- **Why this matters:** It implies a domain model that does not exist; readers expecting invariants or methods find none. It exists only to satisfy "domain entities never cross IPC," but there is no domain content to protect. (Low: harmless today, and removing it would push `WorktreeDto` imports into more layers, so the trade-off is genuine.)
- **Minimal refactor direction:** Either delete it and map readers directly to `WorktreeDto`, or — if/when worktree invariants appear (`isDetached()`, non-empty path) — give it the methods that justify a domain type. Until one of those is true, keep it only as a consciously-documented placeholder.
- **Expected improvement:** Removes ~6 lines of interface boilerplate and the false impression of a domain-rich service.

### 9. `GitCliDiffReader` hand-rolls batching instead of using the shared `mapWithConcurrency`

- **Severity:** Low
- **File:** `src/infrastructure/git/readers/GitCliDiffReader.ts:27-32`
- **Issue:** Manual offset loop + `slice` + `Promise.all` reimplements the concurrency helper that `GitCliWorktreeSummaryReader` already uses.
- **Why this matters:** Duplicated concurrency logic drifts and hides subtle batching bugs; every other reader reads identically via the helper. (Low: the manual code is locally transparent and it's a single instance.)
- **Minimal refactor direction:** `const results = await mapWithConcurrency(untrackedPaths, UNTRACKED_DIFF_CONCURRENCY, (path) => this.getUntrackedFileDiff(worktreePath, path));` and consume the array directly.
- **Expected improvement:** Removes the duplication, unifies concurrency tuning, and makes all readers reason the same way.

### 10. `isWorkingTreePathIgnored` name hides its actual any-segment semantics

- **Severity:** Low
- **File:** `src/infrastructure/watch/ChokidarRepoWatcher.ts:90-95`
- **Issue:** The name implies a working-tree-root check, but the logic matches **any** path segment against the ignored set; the input-format contract (absolute vs. already-relative) is undocumented.
- **Why this matters:** The name misleads about why nested `node_modules`/`.git` are caught, and the path-normalization assumption between `ChokidarRepoWatcher` and `startRecursiveWatch` is implicit. (Low: private 5-line helper, single caller, correct behavior.)
- **Minimal refactor direction:** Rename to `containsIgnoredSegment` / `pathContainsIgnoredComponent` and add a one-line comment documenting "any segment match; inputs may be absolute (relativized) or already-relative."
- **Expected improvement:** Reader no longer has to reverse-engineer the matching rule or worry about the path-format contract.

### 11. `useScrollToSection` holds `pendingScrollId` state cleared inside a layout effect

- **Severity:** Low
- **File:** `src/renderer/src/features/diff-viewer/hooks/useScrollToSection.ts`
- **Issue:** The hook keeps pending-scroll state, then clears it in a `useLayoutEffect` after scrolling — effect-driven derived state plus ref-backed callback caches whose behavior depends on render/effect timing.
- **Why this matters:** React 19 lint warns against `set-state-in-effect`; mixing state-tracking with an imperative scroll command is brittle under batching. `renderer-refactoring.md` §5 already targets it. (Low: functional today, lint-warning level.)
- **Minimal refactor direction:** Reframe as a command hook — expose a function that checks whether the target is mounted and scrolls immediately; drop `pendingScrollId`; let the caller own any retry.
- **Expected improvement:** No async state machine, scroll happens when conditions are met, tests stop depending on effect timing.

### 12. `groupChangedFiles()` mints new arrays/objects every render, resetting collapse state

- **Severity:** Low
- **File:** `src/renderer/src/features/worktree-list/changed-files-section/index.tsx`
- **Issue:** Called inline on every render, it returns new group references even when `changedFiles` is unchanged; `FileListProvider`'s effect then resets `collapsedDirectories` to empty.
- **Why this matters:** Unrelated parent re-renders (e.g. a sidebar toggle) can silently collapse expanded folders — a UX bug that is hard to diagnose without understanding the reference semantics, which violates "local reasoning."
- **Minimal refactor direction:** `useMemo(() => groupChangedFiles(changedFiles), [changedFiles])`, and hoist `groupChangedFiles` out of the component since it uses no component state.
- **Expected improvement:** Group references change only when the file list actually changes; collapse state stays stable across unrelated renders.

---

## Repository Score: **7.5 / 10**

A disciplined, well-bounded codebase that scores high where it matters most — explicit naming, local
reasoning, and clean one-directional layer boundaries. The IPC handlers/mappers, the git parsers, and the
shared UI primitives are exemplary: short, obvious, well-tested.

Points are deducted in two places. **(1) Premature abstraction at the thin ends:** five single-implementation
ports and forwarding-only use-case factories add the exact indirection the value system rejects, and the
`Worktree` entity is a behaviorless alias of its DTO. **(2) Renderer coupling and effect-driven state:** real
feature-boundary leaks (changed-file navigation reaching into diff-viewer's `DiffFileModel`), CSS reaching
through private class names with `:global` (a latent production bug), a ~300-line god-hook, and several
effect-driven derived-state patterns that hurt local reasoning.

None of these are correctness defects, and most are already catalogued in `renderer-refactoring.md`, which
keeps the score well above average. The deliberate constraints (git CLI, `Result` envelopes, pure
domain/application, the design palette) are respected and were not counted against it.

---

## Top 10 highest-ROI refactors

1. **Break the diff-viewer feature-boundary leak.** Stop sharing `DiffFileModel`/`directoryPathsForFile` across features; give `worktree-list` its own neutral file-navigation model. _Files:_ `worktree-list/file-list-context.tsx`, `worktree-list/changed-files-section/index.tsx`, `diff-viewer/`. Eliminates the worst cross-feature coupling and unblocks the Phase-2 split.
2. **Delete the single-implementation ports + forwarding use-case factories.** _Files:_ `application/worktrees/ports/*`, the forwarding factory closures. Removes 5 one-consumer abstractions and pass-through indirection; main can depend on infrastructure readers directly without losing the boundaries that matter.
3. **Split `useWorktreeBrowser` by state domain** into `useRepositoryCatalog` / `useSelectedWorktreeDetails` / `useRepositoryWatcher` behind the same facade. _File:_ `worktree-browser/index.ts`. Makes state transitions and error handling explicit and independently testable.
4. **Stop CSS reaching through private component class names.** Replace `:global(.gb-segmented-control__item)` / `:global(.gb-diff-stat)` with real props/variants on SegmentedControl and DiffStat. _Files:_ `worktree-detail-sidebar/index.module.scss:160`, `worktree-list/index.module.scss:18-24`. Fixes a latent production bug, not just a smell.
5. **Inject the scroll container into `useActiveFileScrollSpy`** instead of discovering it via DOM + `.app-shell__content`. _File:_ `diff-viewer/hooks/useActiveFileScrollSpy.ts`. Turns it into a pure, testable, reusable scroll-tracker.
6. **Remove effect-driven derived state in the diff render path.** Use a `key`-reset (or computed state) for the model-change reset; drop `pendingScrollId`-cleared-in-effect. _Files:_ `diff-viewer/index.tsx:24-27`, `diff-viewer/hooks/useScrollToSection.ts`. Kills double renders and timing-dependent behavior.
7. **Collapse the duplicated `CommitFileChange` / `CommitFileChangeStatus` types** into one canonical source and re-export. _Files:_ `contracts/ipc/` (vestigial copy), `application/worktrees/ports/` (the imported-from copy). Removes a DTO/port drift trap.
8. **Delete the `Worktree` domain entity or give it real invariants.** _File:_ `domain/worktree/Worktree.ts`. Removes naming-only indirection over `WorktreeDto`.
9. **Use `mapWithConcurrency` in `GitCliDiffReader`** instead of hand-rolled batching. _File:_ `infrastructure/git/readers/GitCliDiffReader.ts:27-32`. Restores reader consistency and deletes error-prone concurrency code.
10. **Watch-layer + grouping cleanup (cheap wins).** Rename `isWorkingTreePathIgnored` → any-segment semantics and document the path contract; delete the trivial `makeWatchRepository` identity wrapper; memoize/hoist `groupChangedFiles`. _Files:_ `ChokidarRepoWatcher.ts:90-95`, `makeWatchRepository`, `worktree-list/changed-files-section/index.tsx`.

---

## Files that should remain untouched

| File / area                                                                                           | Why leave it alone                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main/ipc/` (handlers + mappers, incl. `worktreeMapper.test.ts`)                                  | Thin adapters that delegate → map → return `Result`, with zero business logic. Tripwire tests prevent domain leakage. ~477 LOC, exemplary local reasoning. |
| `src/infrastructure/git/runGit.ts`                                                                    | The single git-spawning choke point using argument arrays — the security/consistency anchor for all git access. Does one thing, clearly.                   |
| `src/infrastructure/git/` parsers + helpers (`refResolves`, `unpushedStrategy`, `mapWithConcurrency`) | Pure, well-separated parsing/concurrency with **proven** multi-reader reuse and integration tests.                                                         |
| `src/preload/index.ts`                                                                                | Single facade isolating `ipcRenderer` behind `window.api` per the hard rule; no logic beyond the bridge.                                                   |
| `src/renderer/src/shared/ui/` (Button, Badge, DiffStat, SegmentedControl)                             | Genuine reusable primitives with real consumers. The unused variants/tokens are the **intentional design palette** — do not prune.                         |
| `worktree-list/` flat list (`WorktreeList`, `WorktreeRow`)                                            | Clean, focused rendering that honors the "worktrees are a flat list" rule. Nothing to abstract.                                                            |
| `diff-viewer/index.tsx` (DiffView core body)                                                          | Clean with appropriate memoization/callback caching; only the model-reset effect (finding 3) needs attention — the component itself does not.              |

---

## Architecture philosophy (summary)

1. Clean Architecture applied to an Electron git-viewer: a strict one-directional pipeline
2. renderer → preload → main IPC → application use-cases → domain.
3. All side effects (git, filesystem) hide behind application ports, implemented in infrastructure.
4. Contract-first discipline is real: IPC channels, DTOs, and error codes are explicit and mapped at the boundary.
5. Domain entities and exceptions never cross the wire — `Result<T>` envelopes carry everything.
6. The infrastructure and IPC layers embody the values best: short, explicit, locally reasoned, well-tested.
7. Where it strays: mechanically applying full ceremony to a viewer with almost no domain logic —
8. ports without alternative implementations, factories that only forward, an entity with no invariants.
9. The renderer is solid at the component level but lets features leak and concentrates orchestration into oversized hooks.
10. Net: a strong backbone that over-abstracts at the thin ends, where deletion would serve clarity better than structure.
