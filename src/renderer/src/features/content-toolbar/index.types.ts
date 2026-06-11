import type { ViewType } from '../diff-viewer/index.types';
import type { FileListMode, Theme } from '../../shared/preferences/appPreferences';
import type { DiffStats } from '../../shared/ui/diff-stat/index.types';

export type ContentToolbarProps = {
  worktreeName: string | null;
  repoName: string;
  fileCount: number;
  /** null when there is no diff to summarize (always null iff fileCount is 0). */
  diffStats: DiffStats | null;
  viewType: ViewType;
  theme: Theme;
  sidebarOpen: boolean;
  fileListMode: FileListMode;
  onViewTypeChange: (viewType: ViewType) => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onFileListModeChange: (mode: FileListMode) => void;
};
