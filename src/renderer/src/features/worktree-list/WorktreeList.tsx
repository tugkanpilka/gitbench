import type { WorktreeDto } from '../../../../contracts/ipc';
import type { FileListMode } from '../../shared/preferences/appPreferences';
import type { DiffFileModel } from '../diff-viewer/diffModel';
import { DiffStat } from '../../shared/ui/core';
import { FileNavigationList } from './FileNavigationList';
import { WorktreeRow } from './WorktreeRow';
import './worktree-list.css';

interface Props {
  worktrees: WorktreeDto[];
  selectedPath: string | null;
  selectedFiles: DiffFileModel[];
  fileListMode: FileListMode;
  activeFileId: string | null;
  diffStats: { additions: number; deletions: number } | null;
  onSelect: (worktreePath: string) => void;
  onSelectFile: (fileId: string) => void;
}

// Worktrees are sibling checkouts — always a FLAT list, never a tree (CLAUDE.md hard rule 7).
export function WorktreeList({
  worktrees,
  selectedPath,
  selectedFiles,
  fileListMode,
  activeFileId,
  diffStats,
  onSelect,
  onSelectFile,
}: Props) {
  if (worktrees.length === 0) {
    return <p className="worktree-list__empty">No worktrees to display in this repository.</p>;
  }

  return (
    <div className="worktree-and-files">
      <ul className="worktree-list">
        {worktrees.map((worktree) => (
          <li key={worktree.path}>
            <WorktreeRow
              worktree={worktree}
              selected={worktree.path === selectedPath}
              fileCount={worktree.path === selectedPath ? selectedFiles.length : null}
              diffStats={worktree.path === selectedPath ? diffStats : null}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ul>
      {selectedPath && selectedFiles.length > 0 && (
        <div className="worktree-files-section">
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 9, paddingRight: 9 }}>
            <h2 className="repository-sidebar__section-label">Changes</h2>
            {diffStats && <DiffStat additions={diffStats.additions} deletions={diffStats.deletions} />}
          </header>
          <FileNavigationList
            files={selectedFiles}
            mode={fileListMode}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
          />
        </div>
      )}
    </div>
  );
}
