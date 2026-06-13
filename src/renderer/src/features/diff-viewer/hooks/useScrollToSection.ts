import { useState } from 'react';

type ScrollToSection = (fileId: string) => void;

/**
 * Command hook: returns a stable function that scrolls a diff file's section into view
 * when it is currently mounted. The caller invokes it after ensuring the target is
 * expanded, so there is no long-lived pending-scroll state cleared inside a layout
 * effect. The command is created once (the `sectionRefs` ref object is itself stable,
 * read at call time), so callers can safely depend on its identity.
 */
export function useScrollToSection(sectionRefs: {
  current: Map<string, HTMLElement>;
}): ScrollToSection {
  const [scrollToSection] = useState<ScrollToSection>(() => (fileId: string) => {
    sectionRefs.current.get(fileId)?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
  });
  return scrollToSection;
}
