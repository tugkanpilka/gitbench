import type { ReactNode } from 'react';

export interface AppShellProps {
  sidebar: ReactNode;
  sidebarOpen: boolean;
  children: ReactNode;
}
