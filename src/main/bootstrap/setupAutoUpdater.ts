import { app } from 'electron';
import { autoUpdater } from 'electron-updater';

/**
 * Background update checks against the GitHub Releases feed (configured via the
 * `publish` block in electron-builder.yml, baked into app-update.yml at build).
 *
 * No-op when unpackaged (dev). macOS auto-update requires the app to be signed,
 * which the release pipeline guarantees. A failed check must never block
 * startup, so errors are swallowed.
 */
export function setupAutoUpdater(): void {
  if (!app.isPackaged) return;

  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // best-effort: ignore network / feed errors
  });
}
