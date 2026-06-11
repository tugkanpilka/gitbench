// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { nameFromPath } from '../../shared/path/nameFromPath';
import { makeWorktree } from '../../test/fixtures';
import { RepositorySidebar } from '.';

const WORKTREE = makeWorktree({ path: '/Users/dev/gitbench' });

afterEach(() => cleanup());

describe('RepositorySidebar', () => {
  it('derives repository names from POSIX and Windows paths', () => {
    expect(nameFromPath('/Users/dev/gitbench')).toBe('gitbench');
    expect(nameFromPath('C:\\dev\\gitbench')).toBe('gitbench');
  });

  it('renders a compact repository context without toolbar actions', () => {
    render(
      <RepositorySidebar
        repoPath="/Users/dev/gitbench"
        worktrees={[WORKTREE]}
        selectedPath={null}
        changedFiles={[]}
        fileListMode="flat"
        activeFileId={null}
        diffStats={null}
        onSelectWorktree={() => undefined}
        onSelectFile={() => undefined}
      />
    );

    expect(screen.getByRole('heading', { name: 'Worktrees' })).toBeTruthy();
    expect(screen.getByTitle('/Users/dev/gitbench')).toBeTruthy();
    expect(screen.getAllByLabelText('Worktrees').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Another Repository…' })).toBeNull();
  });

  it('keeps the worktree navigation as the only interactive sidebar content', () => {
    render(
      <RepositorySidebar
        repoPath="/Users/dev/gitbench"
        worktrees={[WORKTREE]}
        selectedPath={null}
        changedFiles={[]}
        fileListMode="flat"
        activeFileId={null}
        diffStats={null}
        onSelectWorktree={() => undefined}
        onSelectFile={() => undefined}
      />
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'gitbench, main, aaaaaaa, main worktree' })
    ).toBeTruthy();
  });
});
