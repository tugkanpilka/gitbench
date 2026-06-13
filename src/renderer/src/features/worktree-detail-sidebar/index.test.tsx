// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CommitDto } from '../../../../contracts/ipc';
import { MAIN_WORKTREE } from '../../test/fixtures';
import { buildDiffModel } from '../diff-viewer/utils/diffModel';
import { WorktreeDetailSidebar } from '.';

const FILES = buildDiffModel(`diff --git a/src/a.ts b/src/a.ts
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/src/a.ts
@@ -0,0 +1 @@
+export const a = 1;
diff --git a/src/b.ts b/src/b.ts
index 1111111..2222222 100644
--- a/src/b.ts
+++ b/src/b.ts
@@ -1 +1,2 @@
 export const b = 1;
+export const c = 2;
diff --git a/old.ts b/old.ts
deleted file mode 100644
index 1111111..0000000
--- a/old.ts
+++ /dev/null
@@ -1 +0,0 @@
-export const old = true;
`).files;

const UNPUSHED_COMMIT: CommitDto = {
  sha: 'c'.repeat(40),
  shortSha: 'ccccccc',
  author: 'Ada Lovelace',
  committedAt: '2026-06-12T10:30:00+03:00',
  subject: 'feat: add detail sidebar',
  files: [{ status: 'modified', path: 'src/commit-only.ts', previousPath: null }],
};

afterEach(() => cleanup());

function renderSidebar({
  mode = 'flat',
  flatGroupMode = 'status',
  onSelectFile = () => undefined,
  repositorySidebarOpen = true,
  onToggleRepositorySidebar = () => undefined,
}: {
  mode?: 'flat' | 'tree';
  flatGroupMode?: 'status' | 'none';
  onSelectFile?: (fileId: string) => void;
  repositorySidebarOpen?: boolean;
  onToggleRepositorySidebar?: () => void;
} = {}) {
  return render(
    <WorktreeDetailSidebar
      worktree={MAIN_WORKTREE}
      changedFiles={FILES}
      unpushedCommits={[UNPUSHED_COMMIT]}
      commitsTruncated={false}
      diffLoading={false}
      fileListMode={mode}
      flatGroupMode={flatGroupMode}
      activeFileId={FILES[0].id}
      diffStats={{ additions: 2, deletions: 1 }}
      repositorySidebarOpen={repositorySidebarOpen}
      onSelectFile={onSelectFile}
      onFileListModeChange={() => undefined}
      onFlatGroupModeChange={() => undefined}
      onToggleRepositorySidebar={onToggleRepositorySidebar}
    />
  );
}

describe('WorktreeDetailSidebar', () => {
  it('renders selected worktree identity and grouped changes', () => {
    renderSidebar();

    expect(screen.getByText('repo')).toBeTruthy();
    expect(screen.getByText('main')).toBeTruthy();
    expect(screen.getByLabelText('2 additions, 1 deletion')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Changes' })).toBeTruthy();
    expect(screen.getByText('Added')).toBeTruthy();
    expect(screen.getAllByText('Modified').length).toBeGreaterThan(0);
    expect(screen.getByText('Deleted')).toBeTruthy();
    expect(screen.getByLabelText('Unpushed commits')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Unpushed/ }));

    expect(screen.getByText('feat: add detail sidebar')).toBeTruthy();
    expect(screen.queryByText('commit-only.ts')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /ccccccc.*feat: add detail sidebar/ }));

    expect(screen.getByText('commit-only.ts')).toBeTruthy();
  });

  it('dispatches file navigation from flat mode', () => {
    const onSelectFile = vi.fn();
    renderSidebar({ onSelectFile });

    const fileRow = screen.getByRole('button', {
      name: 'src/a.ts, 1 addition, 0 deletions',
    });

    expect(fileRow.textContent).toBe('Aa.ts+1src');
    expect(
      screen.getByRole('button', { name: 'old.ts, 0 additions, 1 deletion' }).textContent
    ).toBe('Dold.ts−1/');
    fireEvent.click(fileRow);

    expect(onSelectFile).toHaveBeenCalledWith(FILES[0].id);
  });

  it('renders an ungrouped flat list when flatGroupMode is none', () => {
    renderSidebar({ mode: 'flat', flatGroupMode: 'none' });

    // Files still render and stay navigable…
    expect(screen.getByRole('button', { name: 'src/a.ts, 1 addition, 0 deletions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'old.ts, 0 additions, 1 deletion' })).toBeTruthy();
    // …but without the per-status group headers shown in 'status' mode.
    expect(screen.queryByText('Added')).toBeNull();
    expect(screen.queryByText('Deleted')).toBeNull();
  });

  it('supports folder navigation in tree mode', () => {
    renderSidebar({ mode: 'tree' });

    const folders = screen.getAllByRole('button', { name: 'src folder' });
    expect(folders[0].getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(folders[0]);

    expect(folders[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps the repository sidebar toggle visible in both states', () => {
    const onToggleRepositorySidebar = vi.fn();
    const { rerender } = render(
      <WorktreeDetailSidebar
        worktree={MAIN_WORKTREE}
        changedFiles={FILES}
        unpushedCommits={[UNPUSHED_COMMIT]}
        commitsTruncated={false}
        diffLoading={false}
        fileListMode="flat"
        flatGroupMode="status"
        activeFileId={FILES[0].id}
        diffStats={{ additions: 2, deletions: 1 }}
        repositorySidebarOpen={true}
        onSelectFile={() => undefined}
        onFileListModeChange={() => undefined}
        onFlatGroupModeChange={() => undefined}
        onToggleRepositorySidebar={onToggleRepositorySidebar}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hide worktree sidebar' }));

    rerender(
      <WorktreeDetailSidebar
        worktree={MAIN_WORKTREE}
        changedFiles={FILES}
        unpushedCommits={[UNPUSHED_COMMIT]}
        commitsTruncated={false}
        diffLoading={false}
        fileListMode="flat"
        flatGroupMode="status"
        activeFileId={FILES[0].id}
        diffStats={{ additions: 2, deletions: 1 }}
        repositorySidebarOpen={false}
        onSelectFile={() => undefined}
        onFileListModeChange={() => undefined}
        onFlatGroupModeChange={() => undefined}
        onToggleRepositorySidebar={onToggleRepositorySidebar}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show worktree sidebar' }));

    expect(onToggleRepositorySidebar).toHaveBeenCalledTimes(2);
  });

  it('renders a placeholder before a worktree is selected', () => {
    render(
      <WorktreeDetailSidebar
        worktree={null}
        changedFiles={[]}
        unpushedCommits={[]}
        commitsTruncated={false}
        diffLoading={false}
        fileListMode="flat"
        flatGroupMode="status"
        activeFileId={null}
        diffStats={null}
        repositorySidebarOpen={true}
        onSelectFile={() => undefined}
        onFileListModeChange={() => undefined}
        onFlatGroupModeChange={() => undefined}
        onToggleRepositorySidebar={() => undefined}
      />
    );

    expect(screen.getByText('Select a worktree to inspect its changes.')).toBeTruthy();
    // The sidebar toggle must stay reachable even with no selection, so a closed
    // (inert) repository sidebar can always be reopened.
    expect(screen.getByRole('button', { name: 'Hide worktree sidebar' })).toBeTruthy();
  });
});
