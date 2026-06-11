import { watch as watchWithChokidar, type FSWatcher } from 'chokidar';

export type StopRecursiveWatch = () => Promise<void>;
export type IgnorePath = (path: string) => boolean;

interface FSEventsModule {
  watch(path: string, handler: (path: string) => void): StopRecursiveWatch;
}

type LoadFSEvents = () => Promise<FSEventsModule>;

const loadFSEvents: LoadFSEvents = () => import('fsevents');

/**
 * Chokidar v4 recursively opens one watcher per directory on macOS. Large
 * repositories can exceed the low default file-descriptor limit before the
 * initial crawl finishes. FSEvents observes the whole tree through one native
 * stream and does not need that crawl.
 */
export async function startRecursiveWatch(
  rootPath: string,
  onChange: () => void,
  ignored: IgnorePath
): Promise<StopRecursiveWatch> {
  if (process.platform === 'darwin') {
    return startFSEventsWatch(rootPath, onChange, ignored);
  }
  return startChokidarWatch(rootPath, onChange, ignored);
}

export async function startFSEventsWatch(
  rootPath: string,
  onChange: () => void,
  ignored: IgnorePath,
  load: LoadFSEvents = loadFSEvents
): Promise<StopRecursiveWatch> {
  const { watch } = await load();
  return watch(rootPath, (changedPath) => {
    if (!ignored(changedPath)) {
      onChange();
    }
  });
}

async function startChokidarWatch(
  rootPath: string,
  onChange: () => void,
  ignored: IgnorePath
): Promise<StopRecursiveWatch> {
  const watcher: FSWatcher = watchWithChokidar(rootPath, {
    ignoreInitial: true,
    ignored,
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
  });

  watcher.on('all', onChange);
  watcher.on('error', () => {
    // Prevent an EMFILE or disappearing-path error from crashing Electron's
    // main process. Auto-refresh is best-effort; Git queries remain usable.
    void watcher.close();
  });

  return async () => {
    await watcher.close();
  };
}
