import { app, dialog } from 'electron';
import { autoUpdater, type UpdateInfo } from 'electron-updater';

let isChecking = false;
let globalListenerRegistered = false;

// eslint-disable-next-line max-lines-per-function -- sequential event setup for update download completion
function registerGlobalListeners(): void {
  if (globalListenerRegistered) return;
  globalListenerRegistered = true;

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    void dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded and is ready to install.`,
      buttons: ['Restart and Install', 'Later'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

/**
 * Runs a background update check silently.
 */
export function checkForUpdatesSilently(): void {
  registerGlobalListeners();

  if (isChecking || !app.isPackaged) return;

  isChecking = true;

  autoUpdater.checkForUpdates()
    .finally(() => {
      isChecking = false;
    })
    .catch(() => {
      // best-effort: swallow background update check errors
    });
}

/**
 * Perform an interactive update check triggered by the user.
 * Displays native dialog boxes for progress and result.
 */
// eslint-disable-next-line max-lines-per-function -- sequential event-driven flows with dialog calls that are clearer kept unified
export function checkForUpdatesInteractive(): void {
  registerGlobalListeners();

  if (isChecking) {
    void dialog.showMessageBox({
      type: 'info',
      title: 'Check for Updates',
      message: 'Already checking for updates.',
      buttons: ['OK'],
    });
    return;
  }

  if (!app.isPackaged) {
    void dialog.showMessageBox({
      type: 'info',
      title: 'Check for Updates (Development Mode)',
      message: 'Update check is only available in packaged builds.',
      detail: `Mock check success: GitBench v${app.getVersion()} is up to date.`,
      buttons: ['OK'],
    });
    return;
  }

  isChecking = true;

  const cleanup = (): void => {
    autoUpdater.off('update-available', onUpdateAvailable);
    autoUpdater.off('update-not-available', onUpdateNotAvailable);
    autoUpdater.off('error', onError);
    isChecking = false;
  };

  const onUpdateAvailable = (info: UpdateInfo): void => {
    void dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'It is downloading in the background and you will be notified when it is ready to install.',
      buttons: ['OK'],
    }).finally(() => cleanup());
  };

  const onUpdateNotAvailable = (): void => {
    void dialog.showMessageBox({
      type: 'info',
      title: 'Check for Updates',
      message: 'You are up to date!',
      detail: `GitBench v${app.getVersion()} is the latest version.`,
      buttons: ['OK'],
    }).finally(() => cleanup());
  };

  const onError = (err: Error): void => {
    void dialog.showMessageBox({
      type: 'error',
      title: 'Check for Updates',
      message: 'Error checking for updates.',
      detail: err instanceof Error ? err.message : String(err),
      buttons: ['OK'],
    }).finally(() => cleanup());
  };

  autoUpdater.on('update-available', onUpdateAvailable);
  autoUpdater.on('update-not-available', onUpdateNotAvailable);
  autoUpdater.on('error', onError);

  autoUpdater.checkForUpdates().catch((err) => {
    void dialog.showMessageBox({
      type: 'error',
      title: 'Check for Updates',
      message: 'Failed to initiate update check.',
      detail: err instanceof Error ? err.message : String(err),
      buttons: ['OK'],
    }).finally(() => cleanup());
  });
}

/**
 * Background update checks against the GitHub Releases feed (configured via the
 * `publish` block in electron-builder.yml, baked into app-update.yml at build).
 *
 * No-op when unpackaged (dev). macOS auto-update requires the app to be signed,
 * which the release pipeline guarantees. A failed check must never block
 * startup, so errors are swallowed.
 */
export function setupAutoUpdater(): void {
  registerGlobalListeners();

  if (!app.isPackaged) return;

  // Run a background non-interactive check on startup
  checkForUpdatesSilently();
}
