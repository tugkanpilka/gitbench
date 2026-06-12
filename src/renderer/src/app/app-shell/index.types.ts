import type { ReactNode } from 'react';

export interface AppShellProps {
  repositorySidebar: ReactNode;
  detailSidebar: ReactNode;
  sidebarOpen: boolean;
  children: ReactNode;
}
