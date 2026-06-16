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
      <output aria-label="File list mode">{preferences.fileListMode}</output>
      <button type="button" onClick={() => preferences.setFileListMode('flat')}>
        Switch to flat view
      </button>
    </>
  );
}

function seedStoredPreferences(): void {
  window.localStorage.setItem(
    APP_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ sidebarOpen: false, fileListMode: 'tree' })
  );
}

function storedPreferences(): unknown {
  return JSON.parse(window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '');
}

// eslint-disable-next-line max-lines-per-function
describe('useAppPreferences', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  afterEach(() => {
    cleanup();
  });

  it('restores stored preferences', () => {
    seedStoredPreferences();

    render(<PreferenceHarness />);

    expect(screen.getByLabelText('File list mode').textContent).toBe('tree');
  });

  it('drops the legacy sidebar visibility preference', () => {
    seedStoredPreferences();
    render(<PreferenceHarness />);

    expect(storedPreferences()).toEqual({
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
      fileListMode: 'flat',
      flatGroupMode: 'status',
    });
  });
});
