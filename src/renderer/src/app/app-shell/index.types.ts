import type { ReactNode } from 'react';

export interface TProps {
  sidebar: ReactNode;
  sidebarOpen: boolean;
  children: ReactNode;
}
