import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  startTransition,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { WorktreeDto } from '../../../contracts/ipc';
import { buildDiffModel, EMPTY_DIFF_MODEL } from '../features/diff-viewer/utils/diffModel';
import { RepositorySidebar } from '../features/repository-sidebar';
import { WelcomeScreen } from '../features/welcome';
import { useWorktreeBrowser } from '../features/worktree-browser';
import { WorktreeDetailSidebar } from '../features/worktree-detail-sidebar';
import { Match, Switch } from '../shared/ui/switch';
import { AppShell } from './app-shell';
import { toChangedFileItems } from './changedFileItems';
import type { AppPreferenceController } from './hooks/useAppPreferences';
import { useAppPreferences } from './hooks/useAppPreferences';
import type { DiffNavigationController } from './hooks/useDiffNavigation';
import { useDiffNavigation } from './hooks/useDiffNavigation';
import { Workspace } from './workspace';

type BrowserController = ReturnType<typeof useWorktreeBrowser>;

interface OpenRepositoryModel {
  repositorySidebarOpen: boolean;
  setRepositorySidebarOpen: Dispatch<SetStateAction<boolean>>;
  scrollContainerRef: MutableRefObject<HTMLElement | null>;
  isCleanWorktree: boolean;
  diffModel: ReturnType<typeof buildDiffModel>;
  changedFiles: ReturnType<typeof toChangedFileItems>;
  navigation: DiffNavigationController;
  selectedWorktree: WorktreeDto | null;
  diffStats: { additions: number; deletions: number } | null;
}

// eslint-disable-next-line max-lines-per-function -- two useMemo + diffStats ternary; prettier expanded the memo to 6 lines leaving no room to cut
function useDiffModelDerivatives(browser: BrowserController) {
  const isCleanWorktree = browser.diff !== null && browser.diff.diffText === '';
  const diffModel = useMemo(
    () =>
      browser.diff === null || isCleanWorktree
        ? EMPTY_DIFF_MODEL
        : buildDiffModel(browser.diff.diffText),
    [browser.diff, isCleanWorktree]
  );
  const changedFiles = useMemo(() => toChangedFileItems(diffModel.files), [diffModel]);
  const diffStats =
    diffModel.files.length > 0
      ? { additions: diffModel.additions, deletions: diffModel.deletions }
      : null;
  return { isCleanWorktree, diffModel, changedFiles, diffStats };
}

// eslint-disable-next-line max-lines-per-function -- return object with 9 fields exhausts 15 lines after extraction into useDiffModelDerivatives; no further split without hurting cohesion
function useOpenRepositoryModel(browser: BrowserController): OpenRepositoryModel {
  const [repositorySidebarOpen, setRepositorySidebarOpen] = useState(true);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const { isCleanWorktree, diffModel, changedFiles, diffStats } = useDiffModelDerivatives(browser);
  const navigation = useDiffNavigation(diffModel);
  const selectedWorktree = browser.worktrees.find((w) => w.path === browser.selectedPath) ?? null;
  return {
    repositorySidebarOpen,
    setRepositorySidebarOpen,
    scrollContainerRef,
    isCleanWorktree,
    diffModel,
    changedFiles,
    navigation,
    selectedWorktree,
    diffStats,
  };
}

interface SlotProps {
  browser: BrowserController;
  model: OpenRepositoryModel;
}

// eslint-disable-next-line max-lines-per-function -- JSX slot with inline callback; multi-line props exhaust 15 lines with no meaningful split
function RepoSidebarSlot({ browser, model, repoPath }: SlotProps & { repoPath: string }) {
  const onSelectWorktree = (worktreePath: string): void => {
    model.setRepositorySidebarOpen(false);
    startTransition(() => {
      void browser.selectWorktree(worktreePath);
    });
  };
  return (
    <RepositorySidebar
      repoPath={repoPath}
      worktrees={browser.worktrees}
      summaries={browser.summaries}
      selectedPath={browser.selectedPath}
      onSelectWorktree={onSelectWorktree}
    />
  );
}

// eslint-disable-next-line max-lines-per-function -- JSX slot passing many WorktreeDetailSidebar props; no sub-view to extract
function InspectorSidebarSlot({
  browser,
  model,
  preferences,
}: SlotProps & { preferences: AppPreferenceController }) {
  const {
    navigation: nav,
    changedFiles,
    selectedWorktree,
    diffStats,
    repositorySidebarOpen,
  } = model;
  const onSelectFile = (fileId: string): void => {
    model.setRepositorySidebarOpen(false);
    startTransition(() => {
      nav.selectFile(fileId);
    });
  };
  return (
    <WorktreeDetailSidebar
      worktree={selectedWorktree}
      changedFiles={changedFiles}
      unpushedCommits={browser.commits?.commits ?? []}
      commitsTruncated={browser.commits?.truncated ?? false}
      diffLoading={browser.diffLoading}
      fileListMode={preferences.fileListMode}
      flatGroupMode={preferences.flatGroupMode}
      activeFileId={nav.activeFileId}
      diffStats={diffStats}
      repositorySidebarOpen={repositorySidebarOpen}
      onSelectFile={onSelectFile}
      onFileListModeChange={preferences.setFileListMode}
      onFlatGroupModeChange={preferences.setFlatGroupMode}
      onToggleRepositorySidebar={() => model.setRepositorySidebarOpen((open) => !open)}
    />
  );
}

function WorkspaceSlot({ browser, model }: SlotProps) {
  return (
    <Workspace
      error={browser.error}
      diffLoading={browser.diffLoading}
      hasDiff={browser.diff !== null}
      isCleanWorktree={model.isCleanWorktree}
      diffModel={model.diffModel}
      navigationTarget={model.navigation.navigationTarget}
      scrollContainerRef={model.scrollContainerRef}
      onActiveFileChange={model.navigation.setActiveFileId}
    />
  );
}

interface OpenRepositoryViewProps {
  repoPath: string;
  browser: BrowserController;
  preferences: AppPreferenceController;
}

function OpenRepositoryView({ repoPath, browser, preferences }: OpenRepositoryViewProps) {
  const model = useOpenRepositoryModel(browser);
  return (
    <AppShell
      repositorySidebarOpen={model.repositorySidebarOpen}
      scrollContainerRef={model.scrollContainerRef}
      repositorySidebar={<RepoSidebarSlot repoPath={repoPath} browser={browser} model={model} />}
      detailSidebar={
        <InspectorSidebarSlot browser={browser} model={model} preferences={preferences} />
      }
    >
      <WorkspaceSlot browser={browser} model={model} />
    </AppShell>
  );
}

function WelcomeSlot({ browser }: { browser: BrowserController }) {
  return (
    <WelcomeScreen
      loading={browser.loading}
      error={browser.error}
      onOpenRepository={browser.pickRepository}
    />
  );
}

// eslint-disable-next-line max-lines-per-function -- pure JSX; prettier expands Switch/Match spread
export default function App() {
  const browser = useWorktreeBrowser();
  const preferences = useAppPreferences();
  return (
    <Switch>
      <Match when={browser.repoPath === null}>
        <WelcomeSlot browser={browser} />
      </Match>
      <Match when={true}>
        <OpenRepositoryView
          repoPath={browser.repoPath ?? ''}
          browser={browser}
          preferences={preferences}
        />
      </Match>
    </Switch>
  );
}
