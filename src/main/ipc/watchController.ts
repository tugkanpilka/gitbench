import type {
  RepoWatchHandle,
  RepoWatchTarget,
} from '../../application/worktrees/ports/RepoWatcher';
import type { ApplicationServices } from '../bootstrap/compositionRoot';

/**
 * Owns the single active filesystem watch. `start` replaces any prior watch (the app
 * watches one repo / one selected worktree at a time); `stop` disposes it. Lives in
 * main because it bridges the application use case to the renderer's lifecycle —
 * index.ts disposes it on window close / quit so a watcher never outlives its window.
 */
export interface WatchController {
  start(target: RepoWatchTarget, onChange: () => void): Promise<void>;
  stop(): Promise<void>;
}

export function createWatchController({
  watchRepository,
}: Pick<ApplicationServices, 'watchRepository'>): WatchController {
  let active: RepoWatchHandle | null = null;

  async function stop(): Promise<void> {
    const handle = active;
    active = null;
    if (handle) {
      await handle.stop();
    }
  }

  return {
    async start(target, onChange) {
      await stop();
      active = watchRepository(target, onChange);
    },
    stop,
  };
}
