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

/** Picks the stubbed repository and waits for its worktrees to render. */
async function openRepository(): Promise<HTMLElement[]> {
  clickOpenRepository();
  return screen.findAllByText('main');
}

describe('App', () => {
  beforeEach(() => {
    installMemoryStorage();
    delete document.documentElement.dataset.theme;
    stubAppApi();
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

    const mainLabels = await openRepository();

    expect(mainLabels[0]).toBeTruthy();
    expect(screen.getByText('feature/login')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Worktrees' })).toBeTruthy();
    expect(window.api.listWorktrees).toHaveBeenCalledWith('/repo');
  });

  it('keeps refresh and repository switching out of the MVP workspace', async () => {
    render(<App />);

    await openRepository();

    expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Another Repository…' })).toBeNull();
  });

  it('toggles the sidebar and persists its visibility', async () => {
    render(<App />);

    await openRepository();

    const toggle = screen.getByRole('button', { name: 'Hide sidebar' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.parentElement?.dataset.sidebarOpen).toBe('true');

    fireEvent.click(toggle);

    const collapsedToggle = screen.getByRole('button', { name: 'Show sidebar' });
    expect(collapsedToggle.getAttribute('aria-expanded')).toBe('false');
    expect(collapsedToggle.parentElement?.dataset.sidebarOpen).toBe('false');
    expect(
      JSON.parse(window.localStorage.getItem('gitbench.ui-preferences.v1') ?? '').sidebarOpen
    ).toBe(false);
  });

  it('changes and persists the selected file-list view', async () => {
    render(<App />);

    await openRepository();

    const treeMode = screen.getByRole('radio', { name: 'Tree' });
    fireEvent.click(treeMode);

    expect(treeMode.getAttribute('aria-checked')).toBe('true');
    expect(
      JSON.parse(window.localStorage.getItem('gitbench.ui-preferences.v1') ?? '').fileListMode
    ).toBe('tree');
  });

  it('does nothing when the dialog is cancelled (null is not an error)', async () => {
    stubAppApi({ pickRepo: vi.fn().mockResolvedValue(okResult<string | null>(null)) });
    render(<App />);

    clickOpenRepository();

    expect(await screen.findByText('Select a local Git repository to get started.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open Repository…' })).toBeTruthy();
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
    fireEvent.click(await screen.findByText('feature/login'));

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

    fireEvent.click((await openRepository())[0]);

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
    fireEvent.click(await screen.findByText('feature/login'));

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

    fireEvent.click((await openRepository())[0]);

    expect(await screen.findByText('Repository has no commits yet.')).toBeTruthy();
  });
});
