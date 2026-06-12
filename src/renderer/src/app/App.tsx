import { useMemo, useState } from 'react';

import { ContentToolbar } from '../features/content-toolbar';
import type { ViewType } from '../features/diff-viewer/index.types';
import { buildDiffModel, EMPTY_DIFF_MODEL } from '../features/diff-viewer/utils/diffModel';
import { RepositorySidebar } from '../features/repository-sidebar';
import { WelcomeScreen } from '../features/welcome';
import { useWorktreeBrowser } from '../features/worktree-browser';
import { nameFromPath } from '../shared/path/nameFromPath';
import { AppShell } from './app-shell';
import { useAppPreferences } from './hooks/useAppPreferences';
import { useDiffNavigation } from './hooks/useDiffNavigation';
import { Workspace } from './workspace';

export default function App() {
  const browser = useWorktreeBrowser();
  const preferences = useAppPreferences();
  const [viewType, setViewType] = useState<ViewType>('unified');
  const isCleanWorktree = browser.diff !== null && browser.diff.diffText === '';

  const diffModel = useMemo(() => {
    if (browser.diff === null || isCleanWorktree) {
      return EMPTY_DIFF_MODEL;
    }
    return buildDiffModel(browser.diff.diffText);
  }, [browser.diff, isCleanWorktree]);

  const navigation = useDiffNavigation(diffModel);

  const diffStats =
    diffModel.files.length > 0
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
          changedFiles={diffModel.files}
          unpushedCommits={browser.commits?.commits ?? []}
          commitsTruncated={browser.commits?.truncated ?? false}
          fileListMode={preferences.fileListMode}
          activeFileId={navigation.activeFileId}
          diffStats={diffStats}
          onSelectWorktree={browser.selectWorktree}
          onSelectFile={navigation.selectFile}
        />
      }
    >
      <ContentToolbar
        worktreeName={browser.diff ? nameFromPath(browser.diff.worktreePath) : null}
        repoName={nameFromPath(browser.repoPath)}
        fileCount={diffModel.files.length}
        diffStats={diffStats}
        viewType={viewType}
        theme={preferences.theme}
        sidebarOpen={preferences.sidebarOpen}
        fileListMode={preferences.fileListMode}
        onViewTypeChange={setViewType}
        onToggleTheme={preferences.toggleTheme}
        onToggleSidebar={preferences.toggleSidebar}
        onFileListModeChange={preferences.setFileListMode}
      />
      <Workspace
        error={browser.error}
        diffLoading={browser.diffLoading}
        hasDiff={browser.diff !== null}
        isCleanWorktree={isCleanWorktree}
        diffModel={diffModel}
        viewType={viewType}
        navigationTarget={navigation.navigationTarget}
        onActiveFileChange={navigation.setActiveFileId}
      />
    </AppShell>
  );
}
