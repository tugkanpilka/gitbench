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
  diff.ts         # diff request/response
  errors.ts       # ErrorDto
  repository.ts   # repository picker response
  result.ts       # Result<T>
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

Domain entities never cross IPC. `src/main/ipc/mappers/worktreeMapper.ts` maps `Worktree` into `WorktreeDto`.

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

## Preload

`src/preload/index.ts` is the only file where `ipcRenderer` appears. It exposes the `DesktopApi` contract:

```ts
interface DesktopApi {
  pickRepo(): Promise<Result<string | null>>;
  listWorktrees(repoPath: string): Promise<Result<WorktreeDto[]>>;
  getDiff(worktreePath: string): Promise<Result<GetDiffResponse>>;
}
```

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
