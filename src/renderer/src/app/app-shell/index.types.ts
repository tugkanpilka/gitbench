import type { ReactNode, RefObject } from 'react';

export interface AppShellProps {
  repositorySidebar: ReactNode;
  detailSidebar: ReactNode;
  repositorySidebarOpen: boolean;
  // Attached to the scrollable <main>; the diff viewer's scroll spy reads the same ref.
  scrollContainerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}
