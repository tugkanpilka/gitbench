// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLatestRequest } from './useLatestRequest';

// eslint-disable-next-line max-lines-per-function
describe('useLatestRequest', () => {
  it('aborts the previous signal when a new request begins', () => {
    const { result } = renderHook(() => useLatestRequest());

    const first = result.current.begin();
    expect(first.aborted).toBe(false);

    const second = result.current.begin();
    expect(first.aborted).toBe(true);
    expect(second.aborted).toBe(false);
  });

  it('invalidate aborts the in-flight request without exposing a new live signal', () => {
    const { result } = renderHook(() => useLatestRequest());

    const inFlight = result.current.begin();
    result.current.invalidate();
    expect(inFlight.aborted).toBe(true);

    // A request started after invalidate is fresh again.
    const next = result.current.begin();
    expect(next.aborted).toBe(false);
  });

  it('keeps stable begin/invalidate identities across renders', () => {
    const { result, rerender } = renderHook(() => useLatestRequest());
    const { begin, invalidate } = result.current;

    rerender();

    expect(result.current.begin).toBe(begin);
    expect(result.current.invalidate).toBe(invalidate);
  });
});
