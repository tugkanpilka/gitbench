import { describe, expect, it, vi } from 'vitest';

import { startFSEventsWatch, type StopRecursiveWatch } from './recursiveWatch';

describe('startFSEventsWatch', () => {
  it('uses one native tree watch and filters ignored paths before signalling', async () => {
    let handler: ((path: string) => void) | undefined;
    const stop = vi.fn<StopRecursiveWatch>(async () => {});
    const watch = vi.fn((_path: string, nextHandler: (path: string) => void) => {
      handler = nextHandler;
      return stop;
    });
    const onChange = vi.fn();

    const stopWatch = await startFSEventsWatch(
      '/repo',
      onChange,
      (path) => path.includes('/node_modules/'),
      async () => ({ watch })
    );

    expect(watch).toHaveBeenCalledExactlyOnceWith('/repo', expect.any(Function));

    handler?.('/repo/src/app.ts');
    handler?.('/repo/node_modules/library/index.js');

    expect(onChange).toHaveBeenCalledTimes(1);

    await stopWatch();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
