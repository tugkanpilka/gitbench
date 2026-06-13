import type { CommitFileChangeStatus } from '../../../../contracts/ipc';

// CSS suffix for `.file-navigation-row__status-box--<class>` in index.module.scss,
// which defines: add, modify, delete, rename, copy (rename/copy share one rule).
// Mirrors react-diff-view's FileData['type'], but the changed-files subtree consumes
// this neutral union (via ChangedFileItem) instead of the diff viewer's model.
export type FileStatusClass = 'add' | 'modify' | 'delete' | 'rename' | 'copy';

export interface FileStatusBadge {
  // Single-letter glyph shown inside the status box (A/M/D/R/C/…).
  char: string;
  cssClass: FileStatusClass;
}

// Single source for the status-box letter + colour shared by the changed-files
// list (diff file types) and the unpushed-commit file rows (commit statuses).
const COMMIT_STATUS: Record<CommitFileChangeStatus, FileStatusBadge> = {
  added: { char: 'A', cssClass: 'add' },
  modified: { char: 'M', cssClass: 'modify' },
  deleted: { char: 'D', cssClass: 'delete' },
  renamed: { char: 'R', cssClass: 'rename' },
  copied: { char: 'C', cssClass: 'copy' },
  typeChanged: { char: 'T', cssClass: 'modify' },
  unmerged: { char: 'U', cssClass: 'modify' },
  unknown: { char: '?', cssClass: 'modify' },
};

const DIFF_TYPE_CHAR: Record<FileStatusClass, string> = {
  add: 'A',
  modify: 'M',
  delete: 'D',
  rename: 'R',
  copy: 'C',
};

export function commitFileStatusBadge(status: CommitFileChangeStatus): FileStatusBadge {
  return COMMIT_STATUS[status];
}

export function changedFileStatusBadge(status: FileStatusClass): FileStatusBadge {
  // A changed-file status doubles as its own CSS suffix (add/modify/delete/rename/copy).
  return { char: DIFF_TYPE_CHAR[status], cssClass: status };
}

// Display label for a file's parent directory: root paths read as '/', and a
// trailing slash is trimmed so the label sits flush against the row.
export function directoryLabel(directory: string): string {
  return directory === '' ? '/' : directory.replace(/\/$/, '');
}
