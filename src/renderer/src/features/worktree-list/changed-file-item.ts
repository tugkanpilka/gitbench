import type { FileStatusClass } from './file-status';

/**
 * Neutral changed-file navigation model owned by the worktree-list feature.
 *
 * Changed-file navigation must not depend on how the diff viewer parses hunks or
 * tokens, so this is the only shape the changed-files subtree consumes. `App` is the
 * composition boundary that maps the diff viewer's `DiffFileModel[]` into
 * `ChangedFileItem[]`; nothing here references `react-diff-view` or `DiffFileModel`.
 */
export interface ChangedFileItem {
  id: string;
  path: {
    directory: string;
    name: string;
  };
  status: FileStatusClass;
  additions: number;
  deletions: number;
}
