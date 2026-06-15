import { describe, expect, it, vi } from 'vitest';

import { startFSEventsWatch, type StopRecursiveWatch } from './recursiveWatch';

interface WatchModule {
  watch: (path: string, handler: (path: string) => void) => ReturnType<typeof vi.fn<StopRecursiveWatch>>;
}

function makeWatchModule(): {
  watchModule: WatchModule;
  stop: ReturnType<typeof vi.fn<StopRecursiveWatch>>;
  getHandler: () => ((path: string) => void) | undefined;
} {
  let handler: ((path: string) => void) | undefined;
  const stop = vi.fn<StopRecursiveWatch>(async () => {});
  const watch = vi.fn((_path: string, nextHandler: (path: string) => void) => {
    handler = nextHandler;
    return stop;
  });
  return { watchModule: { watch }, stop, getHandler: () => handler };
}

async function startFilteringWatch(
  watchModule: WatchModule,
  onChange: () => void
): Promise<ReturnType<typeof startFSEventsWatch>> {
  return startFSEventsWatch({
    rootPath: '/repo',
    onChange,
    ignored: (path) => path.includes('/node_modules/'),
    load: async () => watchModule,
  });
}

describe('startFSEventsWatch', () => {
  it('uses one native tree watch and filters ignored paths before signalling', async () => {
    const { watchModule, stop, getHandler } = makeWatchModule();
    const onChange = vi.fn();

    const stopWatch = await startFilteringWatch(watchModule, onChange);

    expect(watchModule.watch).toHaveBeenCalledExactlyOnceWith('/repo', expect.any(Function));
    getHandler()?.('/repo/src/app.ts');
    getHandler()?.('/repo/node_modules/library/index.js');
    expect(onChange).toHaveBeenCalledTimes(1);

    await stopWatch();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
