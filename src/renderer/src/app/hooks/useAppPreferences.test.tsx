// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { APP_PREFERENCES_STORAGE_KEY } from '../../shared/preferences/appPreferences';
import { installMemoryStorage } from '../../test/installMemoryStorage';
import { useAppPreferences } from './useAppPreferences';

function PreferenceHarness() {
  const preferences = useAppPreferences();

  return (
    <>
      <output aria-label="Theme">{preferences.theme}</output>
      <output aria-label="File list mode">{preferences.fileListMode}</output>
      <button type="button" onClick={preferences.toggleTheme}>
        Toggle theme
      </button>
      <button type="button" onClick={() => preferences.setFileListMode('flat')}>
        Switch to flat view
      </button>
    </>
  );
}

function seedStoredPreferences(): void {
  window.localStorage.setItem(
    APP_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ theme: 'light', sidebarOpen: false, fileListMode: 'tree' })
  );
}

function storedPreferences(): unknown {
  return JSON.parse(window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '');
}

// eslint-disable-next-line max-lines-per-function
describe('useAppPreferences', () => {
  beforeEach(() => {
    installMemoryStorage();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.theme;
  });

  it('restores stored preferences', () => {
    seedStoredPreferences();

    render(<PreferenceHarness />);

    expect(screen.getByLabelText('Theme').textContent).toBe('light');
    expect(screen.getByLabelText('File list mode').textContent).toBe('tree');
  });

  it('applies the stored theme to the document', () => {
    seedStoredPreferences();

    render(<PreferenceHarness />);

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('toggleTheme applies and persists the next theme', () => {
    seedStoredPreferences();
    render(<PreferenceHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(screen.getByLabelText('Theme').textContent).toBe('dark');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(storedPreferences()).toEqual({
      theme: 'dark',
      fileListMode: 'tree',
      flatGroupMode: 'status',
    });
  });

  it('drops the legacy sidebar visibility preference', () => {
    seedStoredPreferences();
    render(<PreferenceHarness />);

    expect(storedPreferences()).toEqual({
      theme: 'light',
      fileListMode: 'tree',
      flatGroupMode: 'status',
    });
  });

  it('setFileListMode persists the selected mode', () => {
    seedStoredPreferences();
    render(<PreferenceHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to flat view' }));

    expect(screen.getByLabelText('File list mode').textContent).toBe('flat');
    expect(storedPreferences()).toEqual({
      theme: 'light',
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });
});
