# Git Notes

Everything quirky about driving git from this app. Read this before touching `src/infrastructure/git/`.

## Spawning git — rules baked into `runGit.ts`

All application-runtime git invocations go through `runGit.ts`. Integration tests may invoke Git directly to create and modify fixture repositories.

- `execFile('git', ['-C', targetPath, ...args])` — **argument arrays only**. Never template a shell string with a user-controlled path (spaces, quotes, injection).
- `-C <path>` instead of setting `cwd`: the invocation is self-describing and immune to process-cwd drift.
- Environment additions on every call:
  - `GIT_TERMINAL_PROMPT: '0'` — never hang on a credential prompt.
  - `GIT_OPTIONAL_LOCKS: '0'` — read-only commands must not take optional locks.
  - `LC_ALL: 'C'` — untranslated, stable English output. We sniff stderr for error classification; a localized git would break that.
- `maxBuffer`: Node's default is **1 MiB** and a large diff will exceed it (`ERR_CHILD_PROCESS_STDIO_MAXBUFFER`, process killed). Set it explicitly high (e.g. 64 MiB). If real-world diffs ever exceed that, switch to streaming `spawn` — do not keep raising the number forever.
- Encoding `'utf8'`. Non-UTF-8 paths/content are out of MVP scope: document, don't crash.
- Commands such as `git diff --no-index` use exit code `1` to mean "differences found". `runGit` may accept explicitly declared non-zero exit codes only when stderr is empty; stderr still means a real failure and is classified normally.

## Error classification

| Signal                                            | Meaning                | Error → IPC code                               |
| ------------------------------------------------- | ---------------------- | ---------------------------------------------- |
| spawn error `ENOENT`                              | git not on PATH        | `GitNotInstalledError` → `GIT_NOT_INSTALLED`   |
| exit 128 + `not a git repository` in stderr       | bad `repoPath`         | `NotARepositoryError` → `NOT_A_REPOSITORY`     |
| requested path absent from `worktree list` output | stale/removed worktree | `WorktreeNotFoundError` → `WORKTREE_NOT_FOUND` |
| any other non-zero exit                           | —                      | `GIT_COMMAND_FAILED` (stderr → `message`)      |

The sniffed stderr substrings live as named constants in `runGit.ts` (`GIT_NOT_REPO_PATTERN`, `GIT_CANNOT_CHANGE_DIR_PATTERN`) — they stay stable only because `LC_ALL='C'` keeps git's output untranslated.

**Never validate a repository by checking whether `.git` is a directory.** In a linked worktree, `.git` is a _file_ containing `gitdir: <path>`. Validate with `git -C <path> rev-parse --git-dir` instead. (This same fact is why isomorphic-git was rejected.)

## `git worktree list --porcelain` (the `worktrees:list` channel)

Run as `git -C <repoPath> worktree list --porcelain`. It works from the main worktree _or_ any linked worktree and always lists all of them.

Format:

- Entries are separated by a **blank line**. The **first entry is always the main worktree** → `isMain: true`.
- Attribute lines we consume:
  - `worktree <absolute path>`
  - `HEAD <sha>`
  - `branch refs/heads/<name>` — strip the `refs/heads/` prefix for `WorktreeDto.branch`
  - `detached` — appears instead of `branch`; map to `branch: null`
  - `locked` (optionally `locked <reason>` on the same line) → `isLocked: true`
  - `bare` — a bare main worktree may carry only this attribute (no branch). Tolerate it.
- `prunable [reason]` lines may appear — ignore them for now (future: surface in UI).
- Hardening option: `--porcelain -z` (git ≥ 2.36) NUL-terminates lines and survives newlines in paths. The parser is written against the newline format; only switch with fixtures proving both.

## Uncommitted diff (the `diff:get` channel)

Tracked paths run as `git -C <worktreePath> --no-pager diff --no-color HEAD`.

Why `HEAD`: it shows **staged + unstaged changes in one diff** — "everything that would change if you committed right now". Plain `git diff` would hide staged changes.

Untracked paths are discovered in one NUL-delimited call:

```text
git -C <worktreePath> ls-files --others --exclude-standard -z
```

Each returned file is rendered by Git as a standard addition from `/dev/null`:

```text
git -C <worktreePath> diff --no-index --no-color --no-ext-diff --no-textconv -- /dev/null <path>
```

This leaves the real index untouched and preserves Git's mode, binary-file, path-quoting, symlink, and empty-file semantics. The per-file commands run with bounded concurrency. Untracked nested Git repositories are reported by `ls-files` as directory entries and are intentionally skipped rather than recursively diffing another repository.

Gotchas, in order of how much they will bite:

1. **Unborn HEAD** (repo with zero commits): `git diff HEAD` fails with `ambiguous argument 'HEAD'`. Detect first with `git rev-parse --verify --quiet HEAD` (non-zero exit = unborn) and map to `GIT_COMMAND_FAILED` with the message `"Repository has no commits yet."` Do **not** fake an empty diff — there may be staged files, and an empty diff would lie.
2. `""` output = clean worktree = **success**. Never convert it to an error; the renderer shows the dedicated empty state.
3. `--no-color` is belt-and-suspenders: git disables color for non-TTY output by default, but a user's gitconfig can force `color.diff=always`, which would corrupt parsing/rendering.
4. **Binary changes** appear as `Binary files a/… and b/… differ` lines; the diff renderer must tolerate them.
5. **Renames** appear as `rename from` / `rename to` headers (rename detection is on by default in modern git). The diff renderer must tolerate these too.

## File watching (the `watch:start` channel)

`src/infrastructure/watch/ChokidarRepoWatcher.ts` turns filesystem changes into a debounced "re-query" signal. It never reads diffs — git stays the source of truth; the renderer re-runs `worktrees:list` / `diff:get` on each signal.

On macOS, recursive paths use the native `fsevents` API directly. Chokidar v4 performs an initial directory crawl and opens one watcher per directory there; large repositories can exhaust the default file-descriptor limit and stall Electron's main process even when `git diff` is empty. FSEvents observes a whole tree through one native stream without that crawl. Other platforms keep the Chokidar fallback.

Two watch targets, one debounced `onChange`:

1. **Selected worktree's working tree** — file edits/adds/deletes. Ignores `node_modules` and `.git` (the object store under `.git` would storm).
2. **Shared git dir** — resolved with `git -C <repoPath> rev-parse --path-format=absolute --git-common-dir` (absolute output; `--git-common-dir` alone can be relative). This one dir holds `refs`, `logs`, `index`, and `worktrees/` — so it catches commits/resets/checkouts **and** add/remove/lock for _every_ worktree, including linked ones (their per-worktree `HEAD`/`index`/`logs` live under `worktrees/<name>/`). Only the `objects` and `lfs` stores are ignored.

Why not watch each worktree's `.git/HEAD` file directly: a commit on a branch leaves the symbolic `HEAD` file unchanged — what moves is `refs/heads/<branch>` and `logs/HEAD`. Watching the whole git dir (minus `objects`) covers all of these without per-worktree path resolution.

Failure handling: if `rev-parse` fails (repo removed, git missing) the git-dir watcher silently does not attach — the list/diff queries surface the real error to the user. The watcher must not throw across this boundary.

## Adding a new git command — checklist

1. Add it behind an application port; implement it in `src/infrastructure/git/`.
2. Route through `runGit.ts` — never spawn directly.
3. Classify its failure modes into the table above; extend `ErrorDto` codes only if genuinely new (and update `ipc-contract.md` in the same commit).
4. If output is parsed: prefer a `--porcelain`/`-z` mode, write the parser as a pure function, add fixtures.
