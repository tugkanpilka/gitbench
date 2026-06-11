import type { WorktreeDto } from '../../../../contracts/ipc';
import type { FileListMode } from '../../shared/preferences/appPreferences';
import type { DiffStats } from '../../shared/ui/diff-stat/index.types';
import type { DiffFileModel } from '../diff-viewer/utils/diffModel.types';

export type WorktreeListProps = {
  worktrees: WorktreeDto[];
  selectedPath: string | null;
  changedFiles: DiffFileModel[];
  fileListMode: FileListMode;
  activeFileId: string | null;
  diffStats: DiffStats | null;
  onSelect: (worktreePath: string) => void;
  onSelectFile: (fileId: string) => void;
};
