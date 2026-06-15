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

export class DefaultWatchController implements WatchController {
  private active: RepoWatchHandle | null = null;

  constructor(private readonly watcher: ApplicationServices['watcher']) {}

  async stop(): Promise<void> {
    const handle = this.active;
    this.active = null;
    if (handle) {
      await handle.stop();
    }
  }

  async start(target: RepoWatchTarget, onChange: () => void): Promise<void> {
    await this.stop();
    this.active = this.watcher.watch(target, onChange);
  }
}

export function createWatchController({
  watcher,
}: Pick<ApplicationServices, 'watcher'>): WatchController {
  return new DefaultWatchController(watcher);
}
