// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAIN_WORKTREE, makeWorktree } from '../../test/fixtures';
import { WorktreeList } from '.';

const DETACHED_WORKTREE = makeWorktree({
  path: '/repo-detached',
  branch: null,
  headSha: 'bcdef1234567890',
  isMain: false,
  isLocked: true,
});

afterEach(() => cleanup());

describe('WorktreeList', () => {
  it('renders a flat list and marks the selected worktree', () => {
    render(
      <WorktreeList
        worktrees={[MAIN_WORKTREE, DETACHED_WORKTREE]}
        selectedPath="/repo-detached"
        selectedFileCount={3}
        selectedUnpushedCount={2}
        onSelect={() => undefined}
      />
    );

    expect(screen.getByText('repo')).toBeTruthy();
    expect(screen.getByText('repo-detached')).toBeTruthy();
    expect(screen.getByText('↑2')).toBeTruthy();
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
        selectedPath={null}
        selectedFileCount={0}
        selectedUnpushedCount={0}
        onSelect={onSelect}
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
        selectedFileCount={0}
        selectedUnpushedCount={0}
        onSelect={() => undefined}
      />
    );

    expect(screen.getByText('No worktrees to display in this repository.')).toBeTruthy();
  });
});
