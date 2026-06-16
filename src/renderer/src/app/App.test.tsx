// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Result } from '../../../contracts/ipc';
import { failResult, okResult, SAMPLE_DIFF, stubApi } from '../test/fixtures';
import { installMemoryStorage } from '../test/installMemoryStorage';
import App from './App';

function stubAppApi(overrides: Partial<Window['api']> = {}): void {
  stubApi({
    getDiff: vi.fn().mockResolvedValue(okResult({ diffText: SAMPLE_DIFF })),
    ...overrides,
  });
}

function clickOpenRepository(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Open Repository…' }));
}

/** Picks the stubbed repository and waits for its main worktree to render. */
async function openRepository(): Promise<HTMLElement> {
  clickOpenRepository();
  return screen.findByRole('button', {
    name: /^repo, main, aaaaaaa, main worktree/,
  });
}

// eslint-disable-next-line max-lines-per-function
describe('App', () => {
  beforeEach(() => {
    installMemoryStorage();
    stubAppApi();
  });
  afterEach(() => {
    cleanup();
  });

  it('starts on the repository welcome screen', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'GitBench' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Repository…' })).toBeTruthy();
  });

  it('lists worktrees as a flat list after picking a repository', async () => {
    render(<App />);

    const mainWorktree = await openRepository();

    expect(mainWorktree).toBeTruthy();
    expect(screen.getByRole('button', { name: /feature\/login/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Worktrees' })).toBeTruthy();
    expect(window.api.listWorktrees).toHaveBeenCalledWith('/repo');
  });

  it('keeps refresh and repository switching out of the MVP workspace', async () => {
    render(<App />);

    await openRepository();

    expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Another Repository…' })).toBeNull();
  });

  it('does not render the removed content toolbar', async () => {
    render(<App />);

    await openRepository();

    expect(screen.queryByRole('radiogroup', { name: 'Diff view' })).toBeNull();
  });

  it('closes the worktree sidebar on selection and restores it from the detail header', async () => {
    render(<App />);

    await openRepository();

    const repositorySidebar = screen.getByRole('complementary', {
      name: 'Repository worktrees',
    });
    expect(screen.getByRole('complementary', { name: 'Worktree details' })).toBeTruthy();
    expect(repositorySidebar.getAttribute('aria-hidden')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: /feature\/login/ }));

    expect(repositorySidebar.getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Show worktree sidebar' }));
    expect(repositorySidebar.getAttribute('aria-hidden')).toBe('false');
  });

  it('changes and persists the selected file-list view', async () => {
    render(<App />);

    await openRepository();

    const treeMode = screen.getByRole('radio', { name: 'Tree view' });
    fireEvent.click(treeMode);

    expect(screen.getByRole('radio', { name: 'Tree view' }).getAttribute('aria-checked')).toBe(
      'true'
    );
    expect(
      JSON.parse(window.localStorage.getItem('gitbench.ui-preferences.v1') ?? '').fileListMode
    ).toBe('tree');
  });

  it('does nothing when the dialog is cancelled (null is not an error)', async () => {
    stubAppApi({ pickRepo: vi.fn().mockResolvedValue(okResult<string | null>(null)) });
    render(<App />);

    clickOpenRepository();

    expect(
      await screen.findByRole('button', { name: 'Open Repository…' })
    ).toBeTruthy();
    expect(window.api.listWorktrees).not.toHaveBeenCalled();
  });

  it('keeps the welcome screen busy while the repository picker is open', async () => {
    let resolvePick: ((result: Result<string | null>) => void) | undefined;
    const pickResult = new Promise<Result<string | null>>((resolve) => {
      resolvePick = resolve;
    });
    stubAppApi({ pickRepo: vi.fn().mockReturnValue(pickResult) });
    render(<App />);

    clickOpenRepository();

    const loadingButton = await screen.findByRole('button', { name: 'Opening repository…' });
    expect(loadingButton.hasAttribute('disabled')).toBe(true);

    resolvePick?.(okResult<string | null>(null));
    expect(await screen.findByRole('button', { name: 'Open Repository…' })).toBeTruthy();
  });

  it('shows the diff of a selected worktree', async () => {
    render(<App />);

    clickOpenRepository();
    fireEvent.click(await screen.findByRole('button', { name: /feature\/login/ }));

    expect(await screen.findByRole('heading', { name: 'Uncommitted changes' })).toBeTruthy();
    expect(await screen.findByText('world')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'file.txt, 1 addition, 0 deletions' })
        .getAttribute('aria-current')
    ).toBe('location');
    expect(window.api.getDiff).toHaveBeenCalledWith('/repo-feature');
  });

  it('renders the dedicated clean state for an empty diff', async () => {
    stubAppApi({ getDiff: vi.fn().mockResolvedValue(okResult({ diffText: '' })) });
    render(<App />);

    fireEvent.click(await openRepository());

    expect(await screen.findByText('Worktree is clean; no uncommitted changes.')).toBeTruthy();
  });

  it('shows a loading state while the selected worktree diff is requested', async () => {
    let resolveDiff: ((result: Result<{ diffText: string }>) => void) | undefined;
    const diffResult = new Promise<Result<{ diffText: string }>>((resolve) => {
      resolveDiff = resolve;
    });
    stubAppApi({ getDiff: vi.fn().mockReturnValue(diffResult) });
    render(<App />);

    clickOpenRepository();
    fireEvent.click(await screen.findByRole('button', { name: /feature\/login/ }));

    expect((await screen.findByRole('status')).textContent).toBe('Loading diff…');

    resolveDiff?.(okResult({ diffText: SAMPLE_DIFF }));
    expect(await screen.findByRole('heading', { name: 'Uncommitted changes' })).toBeTruthy();
  });

  it('surfaces ok:false envelopes as visible error messages', async () => {
    stubAppApi({
      listWorktrees: vi
        .fn()
        .mockResolvedValue(failResult('NOT_A_REPOSITORY', 'Not a git repository: /repo')),
    });
    render(<App />);

    clickOpenRepository();

    expect(await screen.findByText('Not a git repository: /repo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Repository…' })).toBeTruthy();
  });

  it('surfaces diff errors (e.g. unborn HEAD) instead of a diff', async () => {
    stubAppApi({
      getDiff: vi
        .fn()
        .mockResolvedValue(failResult('GIT_COMMAND_FAILED', 'Repository has no commits yet.')),
    });
    render(<App />);

    fireEvent.click(await openRepository());

    expect(await screen.findByText('Repository has no commits yet.')).toBeTruthy();
  });
});
