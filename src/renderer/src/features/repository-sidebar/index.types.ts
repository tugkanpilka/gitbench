import type { CommitDto, WorktreeDto } from '../../../../contracts/ipc';
import type { FileListMode } from '../../shared/preferences/appPreferences';
import type { DiffStats } from '../../shared/ui/diff-stat/index.types';
import type { DiffFileModel } from '../diff-viewer/utils/diffModel.types';

export type RepositorySidebarProps = {
  repoPath: string;
  worktrees: WorktreeDto[];
  selectedPath: string | null;
  changedFiles: DiffFileModel[];
  unpushedCommits: CommitDto[];
  commitsTruncated: boolean;
  fileListMode: FileListMode;
  activeFileId: string | null;
  diffStats: DiffStats | null;
  onSelectWorktree: (worktreePath: string) => void;
  onSelectFile: (fileId: string) => void;
};
