import { useCallback, useRef } from 'react';

export interface LatestRequest {
  // Marks any in-flight request as stale and returns the signal that guards the new one.
  begin(): AbortSignal;
  // Marks any in-flight request as stale without starting a new one (used when
  // discarding outstanding work, e.g. on repository replacement).
  invalidate(): void;
}

/**
 * Per-request latest-wins freshness guard. `window.api` invocations cannot be cancelled,
 * so the AbortController is used purely for freshness: callers check `signal.aborted`
 * before committing a result. Each `begin()` aborts the previous request's signal.
 */
export function useLatestRequest(): LatestRequest {
  const controllerRef = useRef<AbortController | null>(null);

  const begin = useCallback((): AbortSignal => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  }, []);

  const invalidate = useCallback((): void => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
  }, []);

  return { begin, invalidate };
}
