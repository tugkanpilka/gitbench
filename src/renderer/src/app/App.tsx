import { useMemo, useState } from 'react';

import { ContentToolbar } from '../features/content-toolbar';
import type { ViewType } from '../features/diff-viewer/index.types';
import { buildDiffModel, EMPTY_DIFF_MODEL } from '../features/diff-viewer/utils/diffModel';
import { RepositorySidebar } from '../features/repository-sidebar';
import { WelcomeScreen } from '../features/welcome';
import { useWorktreeBrowser } from '../features/worktree-browser';
import { WorktreeDetailSidebar } from '../features/worktree-detail-sidebar';
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
  const selectedWorktree =
    browser.worktrees.find((worktree) => worktree.path === browser.selectedPath) ?? null;

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
      repositorySidebar={
        <RepositorySidebar
          repoPath={browser.repoPath}
          worktrees={browser.worktrees}
          selectedPath={browser.selectedPath}
          selectedFileCount={diffModel.files.length}
          selectedUnpushedCount={browser.commits?.commits.length ?? 0}
          onSelectWorktree={browser.selectWorktree}
        />
      }
      detailSidebar={
        <WorktreeDetailSidebar
          worktree={selectedWorktree}
          changedFiles={diffModel.files}
          unpushedCommits={browser.commits?.commits ?? []}
          commitsTruncated={browser.commits?.truncated ?? false}
          diffLoading={browser.diffLoading}
          fileListMode={preferences.fileListMode}
          activeFileId={navigation.activeFileId}
          diffStats={diffStats}
          onSelectFile={navigation.selectFile}
          onFileListModeChange={preferences.setFileListMode}
          onToggleSidebar={preferences.toggleSidebar}
        />
      }
    >
      <ContentToolbar
        diffStats={diffStats}
        viewType={viewType}
        theme={preferences.theme}
        sidebarOpen={preferences.sidebarOpen}
        onViewTypeChange={setViewType}
        onToggleTheme={preferences.toggleTheme}
        onToggleSidebar={preferences.toggleSidebar}
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
