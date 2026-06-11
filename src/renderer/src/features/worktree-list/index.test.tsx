// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorktreeDto } from '../../../../contracts/ipc';
import { buildDiffModel } from '../diff-viewer/utils/diffModel';
import { WorktreeList } from '.';

const MAIN_WORKTREE: WorktreeDto = {
  path: '/repo',
  branch: 'main',
  headSha: 'a'.repeat(40),
  isMain: true,
  isLocked: false,
};

const DETACHED_WORKTREE: WorktreeDto = {
  path: '/repo-detached',
  branch: null,
  headSha: 'bcdef1234567890',
  isMain: false,
  isLocked: true,
};

const FILES = buildDiffModel(`diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1 +1,2 @@
 export const a = 1;
+export const b = 2;
`).files;

afterEach(() => cleanup());

describe('WorktreeList', () => {
  it('renders worktree names, references and status badges', () => {
    render(
      <WorktreeList
        worktrees={[MAIN_WORKTREE, DETACHED_WORKTREE]}
        selectedPath="/repo-detached"
        changedFiles={FILES}
        fileListMode="flat"
        activeFileId={FILES[0].id}
        diffStats={null}
        onSelect={() => undefined}
        onSelectFile={() => undefined}
      />
    );

    expect(screen.getByText('repo')).toBeTruthy();
    expect(screen.getAllByText('main')).toHaveLength(2);
    expect(screen.getByText('repo-detached')).toBeTruthy();
    expect(screen.getByText('detached @ bcdef12')).toBeTruthy();
    expect(screen.getByText('locked')).toBeTruthy();

    const selected = screen.getByRole('button', { name: /repo-detached/ });
    expect(selected.getAttribute('aria-pressed')).toBe('true');
  });

  it('selects a worktree by path', () => {
    const onSelect = vi.fn();
    render(
      <WorktreeList
        worktrees={[MAIN_WORKTREE]}
        selectedPath={null}
        changedFiles={[]}
        fileListMode="flat"
        activeFileId={null}
        diffStats={null}
        onSelect={onSelect}
        onSelectFile={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'repo, main, aaaaaaa, main worktree' }));

    expect(onSelect).toHaveBeenCalledWith('/repo');
  });

  it('renders an explicit empty state', () => {
    render(
      <WorktreeList
        worktrees={[]}
        selectedPath={null}
        changedFiles={[]}
        fileListMode="flat"
        activeFileId={null}
        diffStats={null}
        onSelect={() => undefined}
        onSelectFile={() => undefined}
      />
    );

    expect(screen.getByText('No worktrees to display in this repository.')).toBeTruthy();
  });

  it('renders the selected-worktree files as the active navigation', () => {
    render(
      <WorktreeList
        worktrees={[MAIN_WORKTREE, DETACHED_WORKTREE]}
        selectedPath="/repo"
        changedFiles={FILES}
        fileListMode="flat"
        activeFileId={FILES[0].id}
        diffStats={null}
        onSelect={() => undefined}
        onSelectFile={() => undefined}
      />
    );

    expect(screen.getByLabelText('Changed files')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'src/a.ts, 1 addition, 0 deletions' })
        .getAttribute('aria-current')
    ).toBe('location');
  });

  it('dispatches file navigation when a file is clicked', () => {
    const onSelectFile = vi.fn();
    render(
      <WorktreeList
        worktrees={[MAIN_WORKTREE, DETACHED_WORKTREE]}
        selectedPath="/repo"
        changedFiles={FILES}
        fileListMode="flat"
        activeFileId={FILES[0].id}
        diffStats={null}
        onSelect={() => undefined}
        onSelectFile={onSelectFile}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'src/a.ts, 1 addition, 0 deletions' })
    );

    expect(onSelectFile).toHaveBeenCalledWith(FILES[0].id);
  });

  function renderTreeMode(onSelectFile: (fileId: string) => void = () => undefined) {
    render(
      <WorktreeList
        worktrees={[MAIN_WORKTREE]}
        selectedPath="/repo"
        changedFiles={FILES}
        fileListMode="tree"
        activeFileId={FILES[0].id}
        diffStats={null}
        onSelect={() => undefined}
        onSelectFile={onSelectFile}
      />
    );
  }

  it('groups files by folder in tree mode', () => {
    renderTreeMode();

    const folder = screen.getByRole('button', { name: 'src folder' });
    const file = screen.getByRole('button', {
      name: 'src/a.ts, 1 addition, 0 deletions',
    });
    expect(folder.getAttribute('aria-expanded')).toBe('true');
    expect(file.getAttribute('aria-current')).toBe('location');
  });

  it('dispatches file navigation from tree mode', () => {
    const onSelectFile = vi.fn();
    renderTreeMode(onSelectFile);

    fireEvent.click(
      screen.getByRole('button', { name: 'src/a.ts, 1 addition, 0 deletions' })
    );

    expect(onSelectFile).toHaveBeenCalledWith(FILES[0].id);
  });

  it('collapses a folder in tree mode', () => {
    renderTreeMode();

    const folder = screen.getByRole('button', { name: 'src folder' });
    fireEvent.click(folder);

    expect(folder.getAttribute('aria-expanded')).toBe('false');
    expect(
      screen.queryByRole('button', { name: 'src/a.ts, 1 addition, 0 deletions' })
    ).toBeNull();
  });
});
