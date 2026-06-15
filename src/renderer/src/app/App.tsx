import { startTransition, useMemo, useRef, useState } from 'react';

import { buildDiffModel, EMPTY_DIFF_MODEL } from '../features/diff-viewer/utils/diffModel';
import { RepositorySidebar } from '../features/repository-sidebar';
import { WelcomeScreen } from '../features/welcome';
import { useWorktreeBrowser } from '../features/worktree-browser';
import { WorktreeDetailSidebar } from '../features/worktree-detail-sidebar';
import { Match, Switch } from '../shared/ui/switch';
import { AppShell } from './app-shell';
import { toChangedFileItems } from './changedFileItems';
import { useAppPreferences } from './hooks/useAppPreferences';
import { useDiffNavigation } from './hooks/useDiffNavigation';
import { Workspace } from './workspace';

export default function App() {
  const browser = useWorktreeBrowser();
  const preferences = useAppPreferences();
  const [repositorySidebarOpen, setRepositorySidebarOpen] = useState(true);
  // Created in App and injected into both AppShell (attaches it to the scrollable
  // <main>) and the diff viewer's scroll spy, so scroll-tracking depends on an
  // explicit ref rather than DOM ancestry or a magic CSS class.
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const isCleanWorktree = browser.diff !== null && browser.diff.diffText === '';

  const diffModel = useMemo(() => {
    if (browser.diff === null || isCleanWorktree) {
      return EMPTY_DIFF_MODEL;
    }
    return buildDiffModel(browser.diff.diffText);
  }, [browser.diff, isCleanWorktree]);

  // Composition boundary: the diff viewer's parsed files become the neutral
  // changed-file navigation model the worktree-list feature consumes.
  const changedFiles = useMemo(() => toChangedFileItems(diffModel.files), [diffModel]);
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

  // Narrowed here so `repoPath` is non-null inside the open-repository view; the Switch
  // below selects between this and the welcome screen.
  const repositoryView =
    browser.repoPath === null ? null : (
      <AppShell
        repositorySidebarOpen={repositorySidebarOpen}
        scrollContainerRef={scrollContainerRef}
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
            changedFiles={changedFiles}
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
          scrollContainerRef={scrollContainerRef}
          onActiveFileChange={navigation.setActiveFileId}
        />
      </AppShell>
    );

  return (
    <Switch>
      <Match when={browser.repoPath === null}>
        <WelcomeScreen
          loading={browser.loading}
          error={browser.error}
          onOpenRepository={browser.pickRepository}
        />
      </Match>
      <Match when={true}>{repositoryView}</Match>
    </Switch>
  );
}
