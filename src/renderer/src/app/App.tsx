import { useEffect, useMemo, useRef, useState } from 'react';
import type { ViewType } from 'react-diff-view';

import { AppShell } from './AppShell';
import { useAppPreferences } from './useAppPreferences';
import './workspace.css';
import { ContentToolbar } from '../features/content-toolbar/ContentToolbar';
import { DiffView, type DiffNavigationTarget } from '../features/diff-viewer/DiffView';
import { buildDiffModel, EMPTY_DIFF_MODEL } from '../features/diff-viewer/diffModel';
import { RepositorySidebar } from '../features/repository-sidebar/RepositorySidebar';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { useWorktreeBrowser } from '../features/worktree-browser/useWorktreeBrowser';
import { nameFromPath } from '../shared/path/nameFromPath';

export default function App() {
  const browser = useWorktreeBrowser();
  const preferences = useAppPreferences();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<DiffNavigationTarget | null>(null);
  const [viewType, setViewType] = useState<ViewType>('unified');
  const navigationRequestId = useRef(0);
  const diffModel = useMemo(() => {
    if (browser.diff === null || browser.diff.diffText === '') {
      return EMPTY_DIFF_MODEL;
    }
    return buildDiffModel(browser.diff.diffText);
  }, [browser.diff]);

  useEffect(() => {
    setActiveFileId(diffModel.files[0]?.id ?? null);
    setNavigationTarget(null);
  }, [browser.diff?.worktreePath, diffModel]);

  const selectFile = (fileId: string) => {
    navigationRequestId.current += 1;
    setActiveFileId(fileId);
    setNavigationTarget({ fileId, requestId: navigationRequestId.current });
  };

  const diffStats = diffModel.files.length > 0
    ? { additions: diffModel.additions, deletions: diffModel.deletions }
    : null;

  if (browser.repoPath === null) {
    return (
      <WelcomeScreen
        loading={browser.loading}
        error={browser.error}
        onOpenRepository={browser.pickRepository}
      />
    );
  }

  return (
    <AppShell
      sidebarOpen={preferences.sidebarOpen}
      sidebar={
        <RepositorySidebar
          repoPath={browser.repoPath}
          worktrees={browser.worktrees}
          selectedPath={browser.selectedPath}
          selectedFiles={diffModel.files}
          fileListMode={preferences.fileListMode}
          activeFileId={activeFileId}
          diffStats={diffStats}
          onSelectWorktree={browser.selectWorktree}
          onSelectFile={selectFile}
        />
      }
    >
      <ContentToolbar
        worktreeName={browser.diff ? nameFromPath(browser.diff.worktreePath) : null}
        repoName={nameFromPath(browser.repoPath)}
        fileCount={diffModel.files.length}
        totalAdditions={diffModel.additions}
        totalDeletions={diffModel.deletions}
        viewType={viewType}
        theme={preferences.theme}
        sidebarOpen={preferences.sidebarOpen}
        fileListMode={preferences.fileListMode}
        onViewTypeChange={setViewType}
        onToggleTheme={preferences.toggleTheme}
        onToggleSidebar={preferences.toggleSidebar}
        onFileListModeChange={preferences.setFileListMode}
      />
      <div className={browser.diff ? 'workspace workspace--diff' : 'workspace'}>
        {browser.error && (
          <div className="workspace__error" role="alert">
            {browser.error}
          </div>
        )}
        {browser.diffLoading && !browser.error && (
          <div className="workspace__loading" role="status">
            Loading diff…
          </div>
        )}
        {!browser.diff && !browser.diffLoading && !browser.error && (
          <p className="workspace__placeholder">
            Select a worktree to view uncommitted changes in tracked files.
          </p>
        )}
        {browser.diff && !browser.error && (
          <DiffView
            model={diffModel}
            clean={browser.diff.diffText === ''}
            viewType={viewType}
            navigationTarget={navigationTarget}
            onActiveFileChange={setActiveFileId}
          />
        )}
      </div>
    </AppShell>
  );
}
