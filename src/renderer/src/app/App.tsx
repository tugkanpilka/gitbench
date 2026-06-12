import { startTransition, useMemo, useState } from 'react';

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
  const [repositorySidebarOpen, setRepositorySidebarOpen] = useState(true);
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

  const selectWorktree = (worktreePath: string): void => {
    setRepositorySidebarOpen(false);
    startTransition(() => {
      void browser.selectWorktree(worktreePath);
    });
  };

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
      repositorySidebarOpen={repositorySidebarOpen}
      repositorySidebar={
        <RepositorySidebar
          repoPath={browser.repoPath}
          worktrees={browser.worktrees}
          summaries={browser.summaries}
          selectedPath={browser.selectedPath}
          onSelectWorktree={selectWorktree}
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
          flatGroupMode={preferences.flatGroupMode}
          activeFileId={navigation.activeFileId}
          diffStats={diffStats}
          repositorySidebarOpen={repositorySidebarOpen}
          onSelectFile={(fileId) => {
            setRepositorySidebarOpen(false);
            startTransition(() => {
              navigation.selectFile(fileId);
            });
          }}
          onFileListModeChange={preferences.setFileListMode}
          onFlatGroupModeChange={preferences.setFlatGroupMode}
          onToggleRepositorySidebar={() => setRepositorySidebarOpen((open) => !open)}
        />
      }
    >
      <Workspace
        error={browser.error}
        diffLoading={browser.diffLoading}
        hasDiff={browser.diff !== null}
        isCleanWorktree={isCleanWorktree}
        diffModel={diffModel}
        navigationTarget={navigation.navigationTarget}
        onActiveFileChange={navigation.setActiveFileId}
      />
    </AppShell>
  );
}
