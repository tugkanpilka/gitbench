import type { DiffFileModel } from '../features/diff-viewer/utils/diffModel.types';
import type { ChangedFileItem } from '../features/worktree-list/changed-file-item';

// react-diff-view file types map one-to-one onto the neutral changed-file status.
const STATUS_BY_DIFF_TYPE: Record<DiffFileModel['file']['type'], ChangedFileItem['status']> = {
  add: 'add',
  modify: 'modify',
  delete: 'delete',
  rename: 'rename',
  copy: 'copy',
};

/**
 * Composition-boundary mapping: the diff viewer's parsed `DiffFileModel[]` becomes the
 * worktree-list-owned `ChangedFileItem[]`. Living here (and not in either feature) keeps
 * changed-file navigation independent of the diff viewer's hunk/token model.
 */
export function toChangedFileItems(files: DiffFileModel[]): ChangedFileItem[] {
  return files.map((file) => ({
    id: file.id,
    path: { directory: file.path.directory, name: file.path.name },
    status: STATUS_BY_DIFF_TYPE[file.file.type],
    additions: file.additions,
    deletions: file.deletions,
  }));
}
