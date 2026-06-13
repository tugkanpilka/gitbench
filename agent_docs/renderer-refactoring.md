# Renderer Refactoring Strategy

This document defines the approved direction for refactoring the React renderer. It is
based on a repository-wide review completed on 2026-06-13.

The backend and Electron process boundaries remain unchanged. The work described here is
limited to `src/renderer/src`, except for the responsive window contract in
`src/main/bootstrap/createWindow.ts` and renderer-specific ESLint rules.

## Current baseline

Before the refactor:

- Renderer type checking passes.
- All 152 tests pass.
- Renderer coverage is approximately 93.5% lines and 86.5% branches.
- The production build passes.
- ESLint reports eight React hook/ref warnings in the renderer.
- The production renderer bundle is approximately 1.79 MB of JavaScript and 46 KB of CSS.

These numbers are a regression baseline, not a target architecture.

## Implementation status

Landed so far (renderer batch):

- §1 (state boundaries): `useWorktreeBrowser` is now a thin facade composing
  `useRepositoryCatalog`, `useSelectedWorktreeDetails`, and `useRepositoryWatcher`, with a
  `useLatestRequest` freshness helper. The single shared `error` slot, transactional open,
  stale-while-revalidate refresh, watcher-restart-on-root-change, and silent auto-refresh
  behaviors are preserved exactly. The reducer-module split (`model/*State.ts`) and the
  resource-scoped status/error fields described below remain future work.
- §2 (feature-model leakage): changed-file navigation owns a neutral `ChangedFileItem`
  (`worktree-list/changed-file-item.ts`); `App` is the composition boundary mapping
  `diffModel.files -> ChangedFileItem[]` via `app/changedFileItems.ts`. `file-list-context`
  and `utils/fileTree` no longer import `DiffFileModel`. The folder split into separate
  `changed-files` / `unpushed-commits` features remains future work.
- §4 (scroll container): `useActiveFileScrollSpy` takes an injected `scrollContainerRef`
  (created in `App`, attached to `<main>` by `AppShell`); the DOM-walk and
  `.app-shell__content` fallback are gone.
- §5 (effect-driven state): `DiffView` resets collapse state via a React `key` on model
  identity; `useScrollToSection` is a command hook; `useDiffNavigation` resets during render
  by comparing the committed model. The remaining `react-hooks/refs` warning on DiffView's
  per-file handler caches and the `FileListProvider` set-state-in-effect warnings are tied to
  the generic-tree-state work (§3) and are not yet addressed.
- §3 grouping fix: `groupChangedFiles` is hoisted and memoized, so collapse state survives
  unrelated re-renders. The shared `useTreeState` / `DisclosureTree` widget is future work.

## Goals

1. Make asynchronous repository state explicit and internally consistent.
2. Separate renderer orchestration, feature behavior, and reusable UI behavior.
3. Remove accidental coupling through CSS selectors, DOM ancestry, and feature-internal
   models.
4. Introduce shared UI components only where repeated behavior or visual contracts
   already exist.
5. Preserve accessibility, race-condition handling, and automatic refresh behavior
   during incremental migration.
6. Establish renderer import rules that can be enforced by ESLint.

## Non-goals

- Replacing every `div`, `span`, `p`, `ul`, or `li` with a React component.
  Semantic HTML is not a code smell.
- Reproducing backend Clean Architecture layers inside React.
- Introducing a global state library. The current application does not justify Redux,
  Zustand, or a server-state dependency.
- Building speculative `Card`, `AppLayout`, `ListItem`, `Text`, or `Heading` APIs before
  multiple concrete consumers require them.
- Rewriting the UI in one large change.

## Architectural rules

### Dependency direction

Renderer dependencies should follow this direction:

```text
app -> features -> shared
```

- `app` composes features and owns application-wide layout and navigation state.
- A feature owns its domain-specific rendering and behavior.
- `shared` contains framework-level utilities, reusable UI behavior, and generic UI
  components.
- `shared` must not import from `features` or `app`.
- Features must not import another feature's private files.
- A feature-to-feature dependency is allowed only through the target feature's public
  `index.ts` and only when composition in `app` would be less coherent.
- Shared UI components must not import IPC DTOs or feature models.

Add renderer-specific `no-restricted-imports` rules after the modules have been moved.
Rules should prevent imports such as:

```text
features/a/internal-file -> features/b/internal-file
shared/*                 -> features/*
shared/*                 -> app/*
```

### Component extraction threshold

Create a shared component when at least one of these conditions is true:

1. The same behavior exists in two or more places.
2. Accessibility behavior must be implemented consistently.
3. A visual contract is intentionally shared and has supported variants.
4. The component removes feature knowledge from a reusable behavior.

Do not extract a component only because markup contains several HTML elements or a CSS
file is long.

## 1. Stabilize repository state before splitting hooks

### Problems

`features/worktree-browser/index.ts` currently combines repository selection, worktree
queries, summary queries, selected-worktree details, request freshness, errors, loading
flags, and watcher lifecycle.

There are also state consistency issues:

- A failed attempt to open another repository keeps the previous `repoPath` while
  clearing its worktree list.
- A manual refresh failure clears previously valid data.
- One shared `error` slot is written and cleared by unrelated repository and diff
  requests.
- Splitting the hook without first defining transitions would distribute these bugs
  across more files.

### Solution

Keep `useWorktreeBrowser` as the public facade, but split implementation around coherent
resources:

```text
features/worktree-browser/
  index.ts                         # public facade
  index.types.ts
  hooks/
    useRepositoryCatalog.ts        # repo path, worktrees, summaries, open/refresh
    useSelectedWorktreeDetails.ts  # selection, diff, commits
    useRepositoryWatcher.ts        # start/stop/subscription lifecycle
    useLatestRequest.ts            # latest-request freshness helper
  model/
    repositoryCatalogState.ts      # reducer, transitions, selectors
    selectedWorktreeState.ts       # reducer, transitions, selectors
```

Use reducers for state that must change atomically. Do not replace nine `useState` calls
with nine independent hooks.

The facade remains responsible for cross-resource workflows:

```ts
type WorktreeBrowserController = {
  repository: {
    path: string | null;
    worktrees: WorktreeDto[];
    summaries: WorktreeSummaryDto[];
    status: 'idle' | 'opening' | 'ready' | 'refreshing';
    error: string | null;
  };
  selection: {
    worktreePath: string | null;
    diff: DiffState | null;
    commits: CommitsState | null;
    status: 'idle' | 'loading' | 'ready';
    error: string | null;
  };
  openRepository(): Promise<void>;
  refreshRepository(): Promise<void>;
  selectWorktree(path: string): Promise<void>;
};
```

Exact names may change, but repository and selected-worktree failures must not share one
mutable error slot.

### State transition rules

1. Opening a repository is transactional:
   - Pick the path.
   - Load its worktrees.
   - Commit the new repository state only after the query succeeds.
   - On failure, keep the previously committed repository and selection unchanged.
2. Manual refresh is stale-while-revalidate:
   - Keep the existing list visible while refreshing.
   - Replace it only after success.
   - On failure, retain the list and expose a repository-scoped error.
3. Selecting a worktree:
   - Immediately commits the new selected path.
   - Clears details from the old selection.
   - Loads diff and commits independently.
4. A diff failure must not be cleared by a successful list refresh.
5. Commit loading remains secondary. Its failure may be non-blocking, but that policy
   must be represented explicitly rather than implemented by an empty `catch`.
6. IPC requests cannot actually be cancelled. `AbortController` or request sequence IDs
   are freshness guards only. Keep independent latest-wins guards for summaries, diff,
   and commits.
7. Repository replacement invalidates all in-flight detail requests before committing
   the new repository.

### Context decision

Do not introduce React Context for the browser controller during this phase. Context
does not inherently prevent re-renders and would hide dependencies. Continue passing
feature-specific props from `App` until profiling proves that a context selector or
external store is necessary.

### Acceptance criteria

- Failed repository replacement preserves the complete previous repository state.
- Failed refresh preserves the last successful worktree list and summaries.
- Repository and diff errors can coexist without clearing one another.
- Existing race-condition and watcher tests continue to pass.
- New tests cover transactional open and stale-while-revalidate refresh behavior.

## 2. Remove feature-model leakage from changed-file navigation

### Problems

`features/worktree-list` currently contains three different responsibilities:

- The repository's flat worktree list.
- Changed-file navigation and tree behavior.
- Unpushed commit presentation.

Changed-file modules import `DiffFileModel` from `diff-viewer`, coupling navigation to
the viewer's parsing/token model. `file-list-context.tsx` also combines domain lookup
with generic expansion state.

### Solution

First split the current folder by responsibility:

```text
features/
  worktree-list/             # repository worktree rows only
  changed-files/             # changed-file navigation, grouping, tree adapter
  unpushed-commits/          # commit disclosure and file groups
  worktree-detail-sidebar/   # composes changed-files and unpushed-commits
```

Define a narrow navigation view model owned by `changed-files`:

```ts
type ChangedFileItem = {
  id: string;
  path: {
    directory: string;
    name: string;
  };
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  additions: number;
  deletions: number;
};
```

`App` is the composition boundary and maps the diff viewer model into
`ChangedFileItem[]`. The changed-file feature must not import syntax tokens, diff hunks,
or `react-diff-view` types.

This removes the need for `file-list-context.tsx` to understand `DiffFileModel` or call
`directoryPathsForFile`.

### Acceptance criteria

- `changed-files` has no import from `diff-viewer`.
- `worktree-list` contains only repository worktree list behavior.
- `worktree-detail-sidebar` imports feature public APIs rather than private subfolders.
- Existing flat/tree mode behavior remains unchanged.

## 3. Implement generic tree behavior with an explicit accessibility contract

### Problems

The current changed-file tree manually handles recursion and disclosure, but it is not a
complete ARIA tree widget. Calling a new abstraction `TreeView` creates an expectation
of keyboard navigation and focus management.

Expansion state also resets based on array identity. Grouping changed files creates new
arrays during render, so collapse state can reset even when the logical tree has not
changed.

### Solution

Create two layers:

```text
shared/ui/tree/
  useTreeState.ts
  index.tsx
  index.types.ts
  index.module.scss

features/changed-files/
  model/buildChangedFileTree.ts
  changed-file-tree/index.tsx
```

The shared tree works only with generic nodes:

```ts
type TreeNode<T> = {
  id: string;
  parentId: string | null;
  children: TreeNode<T>[];
  value: T;
};
```

`useTreeState` should support:

- Controlled `expandedIds`.
- Uncontrolled `defaultExpandedIds`.
- `onExpandedChange`.
- `activeId`.
- `reveal(id)` to expand ancestors as an explicit navigation command.
- A stable `instanceKey` or component `key` for intentional resets.

Do not reset expansion state merely because a `nodes` array has a new reference.

### Accessibility decision

If the component uses `role="tree"` and `role="treeitem"`, it must implement:

- Roving `tabIndex`.
- Up/Down navigation between visible nodes.
- Right Arrow to expand or move to the first child.
- Left Arrow to collapse or move to the parent.
- Home/End navigation.
- Focus preservation when nodes collapse.
- `aria-expanded`, `aria-level`, `aria-setsize`, and `aria-posinset` where required.

If this keyboard model is not implemented, name the component `DisclosureTree` and keep
native nested-list semantics instead of claiming full tree-widget semantics.

### Acceptance criteria

- Collapse state survives equivalent node-array re-creation.
- Selecting a hidden file calls `reveal(fileId)` and makes it visible.
- Expansion resets only when the selected worktree/tree instance changes.
- Keyboard behavior has component tests.
- The feature adapter owns file-specific labels, icons, statuses, and selection logic.

## 4. Inject the scroll container

### Problem

`useActiveFileScrollSpy` discovers its scroll root by walking computed styles and falls
back to the global `.app-shell__content` CSS class. This couples reusable behavior to
layout implementation and makes tests depend on a magic class name.

### Solution

Make the scroll container a required dependency:

```ts
function useActiveFileScrollSpy(
  scrollContainerRef: RefObject<HTMLElement | null>,
  sectionRefs: RefObject<Map<string, HTMLElement>>,
  fileIds: readonly string[],
  onActiveFileChange: (fileId: string) => void
): void;
```

`App` creates the ref and passes the same object to:

- `AppShell`, which attaches it to `<main>`.
- `Workspace`/`DiffView`, which passes it to the hook.

This small amount of prop passing is intentional dependency injection.

The hook should depend on file IDs and section positions, not the full `DiffModel`.

### Acceptance criteria

- The hook contains no CSS class names, `closest`, or ancestor-style discovery.
- Tests provide an explicit scroll-container ref.
- Active-file behavior and scroll-position preservation remain unchanged.

## 5. Remove effect-driven derived state and ref access during render

### Problems

React 19 lint rules currently identify:

- Synchronous state resets in effects.
- Navigation state derived from `diffModel` through an effect.
- Pending scroll state cleared inside a layout effect.
- Ref-backed callback caches read during render.
- Segmented-control layout state written synchronously in a layout effect.

These are warnings today but indicate avoidable cascading renders and brittle state
ownership.

### Solution

Apply these patterns:

1. Reset component-local state with an intentional React `key` when the logical instance
   changes.
2. Derive values during render when they can be computed from props.
3. Represent user commands as events rather than mirroring props into state.
4. Store callback creation in child components or use stable callbacks without reading
   mutable ref maps during render.
5. Use DOM measurement only when CSS cannot express the result. For
   `SegmentedControl`, prefer a CSS grid/transform solution or `ResizeObserver` over
   one-time `offsetLeft`/`offsetWidth` reads.

Specific intended changes:

- `useDiffNavigation`: reset by a worktree/diff instance key or reducer transition, not
  a synchronous effect.
- `DiffView`: own collapse state per keyed diff instance. Navigation should dispatch an
  explicit `reveal-and-scroll` command.
- `useScrollToSection`: expose a command that performs the scroll after the target is
  mounted without maintaining redundant long-lived state.
- `FileListProvider`: replaced by generic tree state described above.
- `SegmentedControl`: remove measured indicator state if CSS can position it from the
  selected index; otherwise observe size changes and test resize behavior.

### Acceptance criteria

- Renderer lint has no `react-hooks/set-state-in-effect` or `react-hooks/refs` warnings.
- Renderer hook rules can be promoted from warnings to errors.
- Existing navigation and collapse tests pass without timing-dependent assertions.

## 6. Fix CSS Module ownership before extracting more components

### Problems

Feature styles currently try to modify shared component internals with selectors such as:

```scss
:global(.gb-diff-stat): global(.gb-segmented-control__item);
```

The shared classes are CSS Module classes and are hash-renamed in production. Those
global selectors do not match the generated class names, so the intended overrides are
not applied.

### Solution

Shared components expose supported variants instead of requiring consumers to reach
inside them:

```tsx
<DiffStat size="compact" emphasis="muted" />
<SegmentedControl density="compact" />
```

Alternatively, use documented CSS custom properties on the component root when a value
must be consumer-configurable:

```scss
.gb-segmented-control {
  --gb-segmented-item-padding: 3px 12px;
  --gb-segmented-item-font-size: var(--gb-text-sm);
}
```

Consumers may style the root through `className`, but they must not depend on private
descendant class names.

### CSS file split

Split styles by component ownership, not by arbitrary line count:

```text
features/worktree-list/
  index.module.scss
  worktree-row/index.module.scss

features/changed-files/
  changed-files-section/index.module.scss
  changed-file-row/index.module.scss
  changed-file-tree/index.module.scss

features/diff-viewer/
  index.module.scss
  diff-file-section/index.module.scss
  diff-library-theme.module.scss
  syntax-theme.module.scss
```

The large diff stylesheet is mostly a third-party integration theme. It should remain
feature-owned rather than being moved into generic shared UI.

### Acceptance criteria

- No feature stylesheet targets a private shared-component class.
- Production CSS contains only selectors that match rendered classes.
- Every moved component imports its own stylesheet.
- Visual checks cover dark/light themes and selected/unselected rows.

## 7. Add only the shared UI primitives that have proven consumers

### Approved primitives

#### Alert

Used by Welcome and Workspace.

```ts
type AlertProps = {
  tone?: 'error' | 'warning' | 'info';
  children: ReactNode;
  className?: string;
};
```

- Error alerts use `role="alert"`.
- Non-urgent messages may use `role="status"` or no live role.
- The component owns border, background, text color, and base spacing.

#### EmptyState

Used by worktree list, changed files, workspace placeholder, and clean/no-diff states.

```ts
type EmptyStateProps = {
  title?: ReactNode;
  description: ReactNode;
  tone?: 'neutral' | 'success';
  size?: 'compact' | 'fill';
  action?: ReactNode;
};
```

The component must allow the caller to choose the surrounding semantic element or use a
neutral `div`. It must not force every message into a heading.

#### LoadingState

Use one component for visible loading messages:

```ts
type LoadingStateProps = {
  label: string;
  size?: 'compact' | 'fill';
};
```

It owns `role="status"` and an accessible label. Add a spinner only if the design
actually requires one; do not create an unused `LoadingSpinner` abstraction.

#### Collapsible

Approved because the behavior is repeated by diff files, the unpushed section, and
individual commits.

```tsx
<Collapsible.Root open={open} defaultOpen={false} onOpenChange={setOpen} unmountOnClose>
  <Collapsible.Trigger>...</Collapsible.Trigger>
  <Collapsible.Content>...</Collapsible.Content>
</Collapsible.Root>
```

Requirements:

- Controlled and uncontrolled modes.
- IDs generated with `useId`.
- Automatic `aria-expanded` and `aria-controls`.
- Trigger rendered as a real button.
- Optional content unmounting for expensive diff bodies.
- No feature-specific icons, labels, or styles.

### Existing primitives to improve

- Keep `Button`, `Badge`, `DiffStat`, and `SegmentedControl`.
- Add explicit variants where consumers currently rely on CSS descendant overrides.
- Keep domain-specific statuses and file icons in their feature.

### Deferred primitives

Do not create these in the initial refactor:

- `Text` and `Heading`: typography tokens already exist, and semantic heading levels
  remain feature decisions.
- `Tag`: there is no second semantic use beyond the existing `Badge`.
- Generic `List`/`ListItem`: native lists are currently clearer, and row semantics differ.
- `Card`: Welcome is the only concrete card-like layout.
- Generic `Sidebar`: the repository and detail sidebars have materially different
  headers, scroll behavior, and window-drag responsibilities.
- `AppLayout`: `AppShell` already owns the application layout.

Create a deferred primitive only after another real consumer demonstrates a stable API.

## 8. Keep layout application-specific and define responsive behavior

### Problem

The layout tokens currently describe:

- Two 300 px sidebars.
- A 760 px minimum content width.
- A 760 px minimum Electron window width.

The three values cannot be satisfied simultaneously. At common window sizes the layout
depends on overflow and clipping rather than an explicit responsive contract.

### Solution

Keep `AppShell` as the application layout component and define three modes:

1. **Wide (`>= 1360 px`)**
   - Repository sidebar, detail sidebar, and content are shown side by side.
2. **Medium (`1060-1359 px`)**
   - Detail sidebar and at least 760 px of content remain in flow.
   - Repository sidebar opens as an overlay instead of consuming content width.
3. **Compact (`760-1059 px`)**
   - Content remains the primary surface.
   - Both sidebars use overlay/drawer behavior.
   - Opening one sidebar must not make the other or the content unreachable.

The exact breakpoints may be expressed as container/media queries, but the React state
and accessibility state must agree with what CSS displays. Hidden sidebars must be
`inert` and `aria-hidden`; visible overlays need predictable focus order and Escape-key
handling.

Do not replace `AppShell` with a generic `AppLayout`. Its sidebar transitions, macOS
traffic-light clearance, drag regions, and scroll-container ref are application-specific.

### Acceptance criteria

- No horizontal clipping at the Electron minimum width.
- The diff pane remains reachable at every supported width.
- Sidebar toggle state matches visual and accessibility state.
- Wide, medium, and compact modes are checked in both themes.

## 9. Consolidate status metadata without genericizing domain concepts

### Problem

Changed files and commit files define overlapping status labels, letters, tones, and
group ordering in several modules.

### Solution

Move status metadata into the feature that owns changed-file presentation:

```ts
type FileChangeStatusMeta = {
  label: string;
  shortLabel: string;
  tone: 'added' | 'modified' | 'deleted' | 'neutral';
  order: number;
};
```

Adapters map `react-diff-view` file types and IPC `CommitFileChangeStatus` into this
presentation status. The metadata remains feature-specific; it is not a generic shared
UI primitive.

### Acceptance criteria

- Status label, glyph, tone, and order have one source of truth.
- Unknown and unmerged states have explicit presentation behavior.
- Grouping functions are pure and directly tested.

## 10. Treat bundle optimization as measured follow-up work

### Observation

`refractor` currently includes the full language set, contributing to a renderer bundle
of approximately 1.79 MB. A test explicitly verifies support beyond a small language
subset.

### Decision

Do not remove language support during the structural refactor. First measure:

- Renderer startup time.
- Diff parsing/highlighting time for large diffs.
- Packaged application size.

If startup or memory is a demonstrated problem, switch to `refractor/core` with an
explicit supported-language registry or lazy-load language groups. That change requires
a product decision about supported syntax languages and belongs in a separate PR.

## Migration plan

Each phase must be independently releasable.

### Phase 0: Characterization and correctness

1. Add tests for failed repository replacement preserving old state.
2. Change refresh failure behavior to preserve stale data.
3. Add tests for independent repository/diff errors.
4. Add collapse-state regression tests.
5. Record wide/medium/compact layout screenshots or manual checks.

### Phase 1: State boundaries

1. Introduce repository and selection reducers.
2. Extract latest-request handling.
3. Extract watcher lifecycle.
4. Keep `useWorktreeBrowser` as the facade.
5. Preserve its external API temporarily to limit component churn.
6. Migrate `App` to resource-scoped status/error fields after behavior is stable.

### Phase 2: Feature ownership

1. Split repository worktrees, changed files, and unpushed commits.
2. Introduce `ChangedFileItem`.
3. Remove `DiffFileModel` imports from changed-file navigation.
4. Add renderer import-boundary lint rules.

### Phase 3: Behavioral primitives

1. Inject the scroll-container ref.
2. Implement `Collapsible`.
3. Implement generic tree state and the changed-file adapter.
4. Remove effect-driven resets and ref access during render.
5. Promote renderer hook lint rules to errors.

### Phase 4: Visual primitives and CSS ownership

1. Fix `DiffStat` and `SegmentedControl` customization APIs.
2. Add `Alert`, `EmptyState`, and `LoadingState`.
3. Split feature styles by component ownership.
4. Remove invalid global selectors.

### Phase 5: Responsive AppShell

1. Define layout modes and breakpoint tests/manual checks.
2. Add overlay focus and Escape behavior.
3. Align renderer tokens and Electron minimum-window behavior.

### Phase 6: Optional performance work

Profile first. Optimize Refractor or large-list rendering only if measurements justify
the additional complexity.

## Verification requirements

Run after every phase:

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

Also run coverage before merging a phase that moves state or shared behavior:

```bash
npm run test:coverage
```

Required behavioral coverage:

- Latest selected diff wins when requests resolve out of order.
- Superseded request errors are ignored.
- Repository replacement invalidates old detail requests.
- Watchers start, restart only when roots change, and stop on unmount.
- Silent refresh does not show the initial-loading state.
- Refresh failure preserves stale data.
- Tree disclosure and keyboard navigation work.
- Sidebar navigation reveals and scrolls to collapsed files.
- Alerts and loading states expose correct live-region roles.
- Collapsible trigger/content IDs and ARIA attributes remain connected.

Required manual visual matrix:

```text
Themes:       dark, light
Widths:       wide, medium, compact
Repository:   none selected, open, replacement error
Worktree:     loading, clean, changed, diff error
File view:    flat grouped, flat ungrouped, tree
Sidebars:     repository open/closed, overlay open/closed
```

## Completion criteria

The renderer refactor is complete when:

1. Repository and selected-worktree state transitions are atomic and resource-scoped.
2. The public browser facade is small enough to describe as orchestration rather than
   implementation.
3. Changed-file navigation does not depend on the diff viewer's internal model.
4. Scroll behavior has no CSS-class or ancestor-discovery dependency.
5. Renderer hook/ref lint warnings are zero and enforced as errors.
6. Shared components expose supported variants instead of private CSS selectors.
7. Tree and collapsible accessibility behavior is tested.
8. AppShell has explicit responsive behavior down to the supported minimum width.
9. Tests, type checking, lint, build, and coverage thresholds pass.
10. No deferred abstraction was introduced without a demonstrated consumer.
