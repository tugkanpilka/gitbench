// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ErrorDto, Result, WorktreeDto } from '../../../contracts/ipc';
import { installMemoryStorage } from '../test/installMemoryStorage';
import App from './App';

const okResult = <T,>(data: T): Result<T> => ({ ok: true, data });
const failResult = <T,>(code: ErrorDto['code'], message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});

const MAIN_WORKTREE: WorktreeDto = {
  path: '/repo',
  branch: 'main',
  headSha: 'a'.repeat(40),
  isMain: true,
  isLocked: false,
};

const FEATURE_WORKTREE: WorktreeDto = {
  path: '/repo-feature',
  branch: 'feature/login',
  headSha: 'b'.repeat(40),
  isMain: false,
  isLocked: false,
};

const SAMPLE_DIFF = `diff --git a/file.txt b/file.txt
index 0000000..1111111 100644
--- a/file.txt
+++ b/file.txt
@@ -1 +1,2 @@
 hello
+world
`;

function stubApi(overrides: Partial<Window['api']> = {}): void {
  window.api = {
    pickRepo: vi.fn().mockResolvedValue(okResult<string | null>('/repo')),
    listWorktrees: vi.fn().mockResolvedValue(okResult([MAIN_WORKTREE, FEATURE_WORKTREE])),
    getDiff: vi.fn().mockResolvedValue(okResult({ diffText: SAMPLE_DIFF })),
    ...overrides,
  };
}

describe('App', () => {
  beforeEach(() => {
    installMemoryStorage();
    delete document.documentElement.dataset.theme;
    stubApi();
  });
  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.theme;
  });

  it('starts on the repository welcome screen', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'GitBench' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Repository…' })).toBeTruthy();
  });

  it('lists worktrees as a flat list after picking a repository', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));

    expect((await screen.findAllByText('main'))[0]).toBeTruthy();
    expect(screen.getByText('feature/login')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Worktrees' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Another Repository…' })).toBeNull();
    expect(window.api.listWorktrees).toHaveBeenCalledWith('/repo');
  });

  it('toggles the sidebar and persists its visibility', async () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));
    await screen.findAllByText('main');

    const shell = container.querySelector('.app-shell');
    const toggle = screen.getByRole('button', { name: "Hide sidebar" });
    expect(shell?.getAttribute('data-sidebar-open')).toBe('true');

    fireEvent.click(toggle);

    expect(shell?.getAttribute('data-sidebar-open')).toBe('false');
    expect(screen.getByRole('button', { name: "Show sidebar" })).toBeTruthy();
    expect(
      JSON.parse(window.localStorage.getItem('gitbench.ui-preferences.v1') ?? '')
        .sidebarOpen
    ).toBe(false);
  });

  it('changes and persists the selected file-list view', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));
    await screen.findAllByText('main');

    const treeMode = screen.getByRole('radio', { name: 'Tree' });
    fireEvent.click(treeMode);

    expect(treeMode.getAttribute('aria-checked')).toBe('true');
    expect(
      JSON.parse(window.localStorage.getItem('gitbench.ui-preferences.v1') ?? '')
        .fileListMode
    ).toBe('tree');
  });

  it('does nothing when the dialog is cancelled (null is not an error)', async () => {
    stubApi({ pickRepo: vi.fn().mockResolvedValue(okResult<string | null>(null)) });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));

    expect(await screen.findByText('Select a local Git repository to get started.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Repository…' })).toBeTruthy();
    expect(window.api.listWorktrees).not.toHaveBeenCalled();
  });

  it('keeps the welcome screen busy while the repository picker is open', async () => {
    let resolvePick: ((result: Result<string | null>) => void) | undefined;
    const pickResult = new Promise<Result<string | null>>((resolve) => {
      resolvePick = resolve;
    });
    stubApi({ pickRepo: vi.fn().mockReturnValue(pickResult) });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));

    const loadingButton = await screen.findByRole('button', { name: 'Opening repository…' });
    expect(loadingButton.hasAttribute('disabled')).toBe(true);

    resolvePick?.(okResult<string | null>(null));
    expect(await screen.findByRole('button', { name: 'Open Repository…' })).toBeTruthy();
  });

  it('shows the diff of a selected worktree', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));
    fireEvent.click(await screen.findByText('feature/login'));

    expect(
      await screen.findByRole('heading', { name: 'Uncommitted changes' })
    ).toBeTruthy();
    expect(await screen.findByText('world')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'file.txt, 1 addition, 0 deletions' }).getAttribute(
        'aria-current'
      )
    ).toBe('location');
    expect(window.api.getDiff).toHaveBeenCalledWith('/repo-feature');
  });

  it('renders the dedicated clean state for an empty diff', async () => {
    stubApi({ getDiff: vi.fn().mockResolvedValue(okResult({ diffText: '' })) });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));
    fireEvent.click((await screen.findAllByText('main'))[0]);

    expect(
      await screen.findByText('Worktree is clean; no changes in tracked files.')
    ).toBeTruthy();
  });

  it('shows a loading state while the selected worktree diff is requested', async () => {
    let resolveDiff: ((result: Result<{ diffText: string }>) => void) | undefined;
    const diffResult = new Promise<Result<{ diffText: string }>>((resolve) => {
      resolveDiff = resolve;
    });
    stubApi({ getDiff: vi.fn().mockReturnValue(diffResult) });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));
    fireEvent.click(await screen.findByText('feature/login'));

    expect((await screen.findByRole('status')).textContent).toBe('Loading diff…');

    resolveDiff?.(okResult({ diffText: SAMPLE_DIFF }));
    expect(
      await screen.findByRole('heading', { name: 'Uncommitted changes' })
    ).toBeTruthy();
  });

  it('surfaces ok:false envelopes as visible error messages', async () => {
    stubApi({
      listWorktrees: vi
        .fn()
        .mockResolvedValue(failResult('NOT_A_REPOSITORY', 'Not a git repository: /repo')),
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));

    expect(await screen.findByText('Not a git repository: /repo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Repository…' })).toBeTruthy();
  });

  it('surfaces diff errors (e.g. unborn HEAD) instead of a diff', async () => {
    stubApi({
      getDiff: vi
        .fn()
        .mockResolvedValue(failResult('GIT_COMMAND_FAILED', 'Repository has no commits yet.')),
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));
    fireEvent.click((await screen.findAllByText('main'))[0]);

    expect(await screen.findByText('Repository has no commits yet.')).toBeTruthy();
  });
});
