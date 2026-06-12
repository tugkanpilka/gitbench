# IPC Contract

`src/contracts/ipc` is the code-level source of truth for everything crossing the renderer/main boundary. Changing a channel, request, response, DTO, or error code requires updating this document in the same commit.

## Result envelopes

Electron IPC does not preserve custom `Error` instances. Handlers catch failures and return:

```ts
type Result<T> = { ok: true; data: T } | { ok: false; error: ErrorDto };
```

`src/renderer/src/shared/api/desktopApi.ts` is the only renderer module that unwraps these envelopes.

## Contract files

```text
src/contracts/ipc/
  api.ts          # DesktopApi exposed as window.api
  channels.ts     # canonical IPC channel names
  commits.ts      # unpushed-commits request/response and CommitDto
  diff.ts         # diff request/response
  errors.ts       # ErrorDto
  repository.ts   # repository picker response
  result.ts       # Result<T>
  watch.ts        # watch lifecycle request
  worktreeSummaries.ts # per-worktree status/stat/push summaries
  worktrees.ts    # worktree request/response and WorktreeDto
  index.ts        # public exports
```

Contracts must contain only structured-clone-safe data and standalone constants/types. No class instances, functions in payloads, domain entities, Electron imports, or Node imports.

## DTOs

```ts
interface WorktreeDto {
  path: string;
  branch: string | null;
  headSha: string;
  isMain: boolean;
  isLocked: boolean;
}

interface GetDiffResponse {
  diffText: string; // "" is a valid clean-worktree result
}

interface WorktreeSummaryDto {
  worktreePath: string;
  fileCount: number;
  additions: number;
  deletions: number;
  conflictCount: number;
  unpushedCount: number;
  behindCount: number | null; // null when the worktree has no upstream
}

type CommitFileChangeStatus =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'typeChanged'
  | 'unmerged'
  | 'unknown';

interface CommitFileChange {
  status: CommitFileChangeStatus;
  path: string; // destination path for renames/copies
  previousPath: string | null; // source path for renames/copies, else null
}

interface CommitDto {
  sha: string;
  shortSha: string;
  author: string;
  committedAt: string; // committer date, ISO 8601
  subject: string;
  files: CommitFileChange[];
}

interface ListUnpushedCommitsResponse {
  commits: CommitDto[]; // newest first; [] is a valid "nothing unpushed" result
  truncated: boolean; // true when the list was capped (more exist than shown)
}

interface ErrorDto {
  code: ErrorCode; // see ERROR_CODES below
  message: string;
}
```

Error codes have a single source of truth in `src/contracts/ipc/errors.ts`:

```ts
const ERROR_CODES = {
  GIT_NOT_INSTALLED: 'GIT_NOT_INSTALLED',
  NOT_A_REPOSITORY: 'NOT_A_REPOSITORY',
  WORKTREE_NOT_FOUND: 'WORKTREE_NOT_FOUND',
  GIT_COMMAND_FAILED: 'GIT_COMMAND_FAILED',
} as const;
type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
```

`ErrorDto.code` derives its union from `ERROR_CODES`; the string values themselves are unchanged. Add or rename a code only here, and update this document in the same commit.

Domain entities never cross IPC. `src/main/ipc/mappers/worktreeMapper.ts` maps `Worktree` into `WorktreeDto`; `src/main/ipc/mappers/commitMapper.ts` maps the application-layer `UnpushedCommits` into `ListUnpushedCommitsResponse`.

Error mapping lives in `src/main/ipc/mappers/errorMapper.ts` (it imports `ERROR_CODES` rather than inlining literals):

- `GitNotInstalledError` -> `GIT_NOT_INSTALLED`
- `NotARepositoryError` -> `NOT_A_REPOSITORY`
- `WorktreeNotFoundError` -> `WORKTREE_NOT_FOUND`
- Any other failure -> `GIT_COMMAND_FAILED`

## Channels

### `repo:pick`

- Request: none
- Response: `Result<string | null>`
- `null` means the user cancelled.
- This handler deliberately bypasses application use cases because folder picking is pure Electron UI.

### `worktrees:list`

- Request: `ListWorktreesRequest` with `{ repoPath: string }`
- Response: `Result<ListWorktreesResponse>`
- Flow: IPC handler -> `listWorktrees` -> `WorktreeReader` -> Git CLI reader -> parser -> domain entities -> DTO mapper.

### `diff:get`

- Request: `GetDiffRequest` with `{ worktreePath: string }`
- Response: `Result<GetDiffResponse>`
- Flow: IPC handler -> `getUncommittedDiff` -> `DiffReader` -> Git CLI reader -> raw unified diff.

### `worktrees:summaries`

- Request: `ListWorktreeSummariesRequest` with `{ worktreePaths: string[] }`
- Response: `Result<ListWorktreeSummariesResponse>`
- Returns lightweight status data for every worktree row without loading full diffs or commit details.
- Flow: IPC handler -> `listWorktreeSummaries` -> `WorktreeSummaryReader` -> bounded-concurrency Git CLI queries -> DTO mapper.
- `fileCount` and `conflictCount` come from porcelain status; additions/deletions include tracked and untracked files; push counts use upstream ahead/behind when available and the existing remote fallback for branches without upstreams.

### `commits:unpushed`

- Request: `ListUnpushedCommitsRequest` with `{ worktreePath: string }`
- Response: `Result<ListUnpushedCommitsResponse>`
- Flow: IPC handler -> `listUnpushedCommits` -> `CommitReader` -> Git CLI reader -> `parseCommitLog` -> `CommitDto` mapper.
- "Unpushed" is resolved per worktree: ahead of `@{upstream}` when set, else commits not on any remote-tracking ref, else empty (no remote). An empty `commits` array is a valid success state, never an error. The list is capped (`truncated: true` when more exist). See `agent_docs/git-notes.md`.

### `watch:start`

- Request: `StartWatchRequest` with `{ repoPath: string; worktreePaths: string[] }`
- Response: `Result<null>` (`null` data is the start acknowledgement)
- Starts (and replaces any existing) filesystem watcher for the active repo. Watches the repo's `.git` for worktree-list changes and every worktree root for row-summary and selected-diff changes.
- Flow: IPC handler -> `watchRepository` -> `RepoWatcher` port -> infrastructure watcher. On change it emits the `repo:changed` event (below).

### `watch:stop`

- Request: none
- Response: `Result<null>`
- Disposes the active watcher. Idempotent — stopping when nothing is watched succeeds.

### `repo:changed` (push: main -> renderer)

- This is the **only** main-initiated channel; every other channel is renderer-initiated request/response.
- **No payload and not a `Result` envelope** — it is a debounced "something changed, re-query now" signal, not data. The renderer responds by re-invoking `worktrees:list`, `worktrees:summaries`, and the selected `diff:get` / `commits:unpushed` queries. Git stays the single source of truth; the watcher never computes data itself.

## Preload

`src/preload/index.ts` is the only file where `ipcRenderer` appears. It exposes the `DesktopApi` contract:

```ts
interface DesktopApi {
  pickRepo(): Promise<Result<string | null>>;
  listWorktrees(repoPath: string): Promise<Result<WorktreeDto[]>>;
  listWorktreeSummaries(worktreePaths: string[]): Promise<Result<WorktreeSummaryDto[]>>;
  getDiff(worktreePath: string): Promise<Result<GetDiffResponse>>;
  listUnpushedCommits(worktreePath: string): Promise<Result<ListUnpushedCommitsResponse>>;
  startWatch(repoPath: string, worktreePaths: string[]): Promise<Result<null>>;
  stopWatch(): Promise<Result<null>>;
  onRepoChanged(listener: () => void): () => void; // returns an unsubscribe fn
}
```

`onRepoChanged` is the one non-`Promise` member: it subscribes to the `repo:changed`
push event via `ipcRenderer.on` and returns an unsubscribe function. The listener
receives no arguments — the preload wrapper strips Electron's event object, which is
not structured-clone-safe.

`contextIsolation: true` and `nodeIntegration: false` are non-negotiable.

## Adding a channel

1. Design the channel name, request, response, and errors here first.
2. Add the channel constant and transport types under `src/contracts/ipc`.
3. Add an application use case and port when domain/application behavior is involved.
4. Implement external behavior in infrastructure.
5. Register a focused handler under `src/main/ipc/handlers`.
6. Map domain entities and errors under `src/main/ipc/mappers`.
7. Expose the method through `DesktopApi` and `src/preload/index.ts`.
8. Unwrap it in `src/renderer/src/shared/api/desktopApi.ts`.
9. Cover success, failure, and valid empty states with tests.
