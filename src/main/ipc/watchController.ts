import type {
  RepoWatchHandle,
  RepoWatchTarget,
} from '../../infrastructure/watch/ChokidarRepoWatcher';
import type { ApplicationServices } from '../bootstrap/compositionRoot';

/**
 * Owns the single active filesystem watch. `start` replaces any prior watch (the app
 * watches one repo and all of its worktrees at a time); `stop` disposes it. Lives in
 * main because it bridges the infrastructure watcher to the renderer's lifecycle.
 * index.ts disposes it on window close / quit so a watcher never outlives its window.
 */
export interface WatchController {
  start(target: RepoWatchTarget, onChange: () => void): Promise<void>;
  stop(): Promise<void>;
}

export function createWatchController({
  watcher,
}: Pick<ApplicationServices, 'watcher'>): WatchController {
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
      active = watcher.watch(target, onChange);
    },
    stop,
  };
}
