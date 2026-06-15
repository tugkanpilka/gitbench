import type { ReactNode } from 'react';
import type { AppShellProps } from './index.types';
import styles from './index.module.scss';

function SidebarSlot({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <aside
      className={styles['app-shell__repository-sidebar']}
      aria-label="Repository worktrees"
      aria-hidden={!open}
      inert={!open}
    >
      {children}
    </aside>
  );
}

function DetailSidebarSlot({ children }: { children: ReactNode }) {
  return (
    <aside className={styles['app-shell__detail-sidebar']} aria-label="Worktree details">
      {children}
    </aside>
  );
}

// eslint-disable-next-line max-lines-per-function -- multi-line inline type + JSX exhaust 15 lines; extract would obscure intent
function SidebarContainer({
  open,
  sidebar,
  detail,
}: {
  open: boolean;
  sidebar: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className={styles['app-shell__sidebars']}>
      <SidebarSlot open={open}>{sidebar}</SidebarSlot>
      <DetailSidebarSlot>{detail}</DetailSidebarSlot>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function -- destructured AppShellProps + JSX tree exhaust 15 lines with no meaningful split
export function AppShell({
  repositorySidebar,
  detailSidebar,
  repositorySidebarOpen,
  scrollContainerRef,
  children,
}: AppShellProps) {
  return (
    <div className={styles['app-shell']} data-repository-sidebar-open={repositorySidebarOpen}>
      <SidebarContainer
        open={repositorySidebarOpen}
        sidebar={repositorySidebar}
        detail={detailSidebar}
      />
      <main ref={scrollContainerRef} className={styles['app-shell__content']}>
        {children}
      </main>
    </div>
  );
}
