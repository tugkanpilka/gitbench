import type { CommitDto, WorktreeDto } from '../../../../contracts/ipc';
import type { FileListMode, FlatGroupMode } from '../../shared/preferences/appPreferences';
import type { DiffStats } from '../../shared/ui/diff-stat/index.types';
import type { DiffFileModel } from '../diff-viewer/utils/diffModel.types';

export type WorktreeDetailSidebarProps = {
  worktree: WorktreeDto | null;
  changedFiles: DiffFileModel[];
  unpushedCommits: CommitDto[];
  commitsTruncated: boolean;
  diffLoading: boolean;
  fileListMode: FileListMode;
  flatGroupMode: FlatGroupMode;
  activeFileId: string | null;
  diffStats: DiffStats | null;
  repositorySidebarOpen: boolean;
  onSelectFile: (fileId: string) => void;
  onFileListModeChange: (mode: FileListMode) => void;
  onFlatGroupModeChange: (mode: FlatGroupMode) => void;
  onToggleRepositorySidebar: () => void;
};
