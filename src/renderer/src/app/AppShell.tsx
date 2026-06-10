import type { ReactNode } from 'react';

import './app-shell.css';

interface Props {
  sidebar: ReactNode;
  sidebarOpen: boolean;
  children: ReactNode;
}

export function AppShell({
  sidebar,
  sidebarOpen,
  children,
}: Props) {
  return (
    <div className="app-shell" data-sidebar-open={sidebarOpen}>
      <aside
        id="repository-sidebar-panel"
        className="app-shell__sidebar"
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        {sidebar}
      </aside>
      <main className="app-shell__content">{children}</main>
    </div>
  );
}
