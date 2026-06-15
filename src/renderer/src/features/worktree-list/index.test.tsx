// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAIN_WORKTREE, MAIN_WORKTREE_SUMMARY, makeWorktree } from '../../test/fixtures';
import { WorktreeList } from '.';

const DETACHED_WORKTREE = makeWorktree({
  path: '/repo-detached',
  branch: null,
  headSha: 'bcdef1234567890',
  isMain: false,
  isLocked: true,
});
const DETACHED_SUMMARY = {
  worktreePath: DETACHED_WORKTREE.path,
  fileCount: 3,
  additions: 12,
  deletions: 4,
  conflictCount: 1,
  unpushedCount: 2,
  behindCount: 1,
};

afterEach(() => cleanup());

function renderTwoWorktreeList(selectedPath: string | null = '/repo-detached') {
  return render(
    <WorktreeList
      worktrees={[MAIN_WORKTREE, DETACHED_WORKTREE]}
      summaries={[MAIN_WORKTREE_SUMMARY, DETACHED_SUMMARY]}
      selectedPath={selectedPath}
      onSelect={() => undefined}
    />
  );
}

// eslint-disable-next-line max-lines-per-function
describe('WorktreeList', () => {
  it('renders a flat list and marks the selected worktree', () => {
    renderTwoWorktreeList();
    expect(screen.getByText('repo')).toBeTruthy();
    expect(screen.getByText('repo-detached')).toBeTruthy();
    expect(screen.getByText('↑2')).toBeTruthy();
    expect(screen.getByText('↓1')).toBeTruthy();
    expect(screen.getByText('!1')).toBeTruthy();
    expect(screen.getByText('+12')).toBeTruthy();
    expect(screen.getByText('−4')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    const selected = screen.getByRole('button', { name: /repo-detached/ });
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('selects a worktree by path', () => {
    const onSelect = vi.fn();
    render(
      <WorktreeList
        worktrees={[MAIN_WORKTREE]}
        summaries={[]}
        selectedPath={null}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'repo, main, aaaaaaa, main worktree' }));

    expect(onSelect).toHaveBeenCalledWith('/repo');
  });

  it('renders an explicit empty state', () => {
    render(
      <WorktreeList worktrees={[]} summaries={[]} selectedPath={null} onSelect={() => undefined} />
    );

    expect(screen.getByText('No worktrees to display in this repository.')).toBeTruthy();
  });
});
