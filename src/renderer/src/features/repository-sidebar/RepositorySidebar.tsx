import type { WorktreeDto } from '../../../../contracts/ipc';
import { nameFromPath } from '../../shared/path/nameFromPath';
import type { FileListMode } from '../../shared/preferences/appPreferences';
import type { DiffFileModel } from '../diff-viewer/diffModel';
import { WorktreeList } from '../worktree-list/WorktreeList';
import './repository-sidebar.css';

interface Props {
  repoPath: string;
  worktrees: WorktreeDto[];
  selectedPath: string | null;
  selectedFiles: DiffFileModel[];
  fileListMode: FileListMode;
  activeFileId: string | null;
  diffStats: { additions: number; deletions: number } | null;
  onSelectWorktree: (worktreePath: string) => void;
  onSelectFile: (fileId: string) => void;
}

export { nameFromPath } from '../../shared/path/nameFromPath';

export function RepositorySidebar({
  repoPath,
  worktrees,
  selectedPath,
  selectedFiles,
  fileListMode,
  activeFileId,
  diffStats,
  onSelectWorktree,
  onSelectFile,
}: Props) {
  const repositoryName = nameFromPath(repoPath);

  return (
    <div className="repository-sidebar">
      <header className="repository-sidebar__header">
        <span className="repository-sidebar__repo-name" title={repoPath}>{repositoryName}</span>
      </header>

      <nav className="repository-sidebar__navigation" aria-label="Worktrees">
        <header style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingLeft: 9, paddingRight: 9 }}>
          <h2 className="repository-sidebar__section-label">Worktrees</h2>
        </header>
        <WorktreeList
          worktrees={worktrees}
          selectedPath={selectedPath}
          selectedFiles={selectedFiles}
          fileListMode={fileListMode}
          activeFileId={activeFileId}
          diffStats={diffStats}
          onSelect={onSelectWorktree}
          onSelectFile={onSelectFile}
        />
      </nav>
    </div>
  );
}
