import { useLayoutEffect, useState } from 'react';

export function useScrollToSection(
  sectionRefs: { current: Map<string, HTMLElement> },
  collapsedFiles: Set<string>
): (fileId: string | null) => void {
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (pendingScrollId === null) {
      return;
    }

    sectionRefs.current.get(pendingScrollId)?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
    setPendingScrollId(null);
  }, [collapsedFiles, pendingScrollId, sectionRefs]);

  return setPendingScrollId;
}
