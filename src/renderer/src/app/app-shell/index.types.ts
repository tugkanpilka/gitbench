import type { ReactNode } from 'react';

export interface AppShellProps {
  repositorySidebar: ReactNode;
  detailSidebar: ReactNode;
  repositorySidebarOpen: boolean;
  children: ReactNode;
}
