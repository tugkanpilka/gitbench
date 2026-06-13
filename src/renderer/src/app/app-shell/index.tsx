import type { AppShellProps } from './index.types';
import styles from './index.module.scss';

export function AppShell({
  repositorySidebar,
  detailSidebar,
  repositorySidebarOpen,
  scrollContainerRef,
  children,
}: AppShellProps) {
  return (
    <div className={styles['app-shell']} data-repository-sidebar-open={repositorySidebarOpen}>
      <div className={styles['app-shell__sidebars']}>
        <aside
          className={styles['app-shell__repository-sidebar']}
          aria-label="Repository worktrees"
          aria-hidden={!repositorySidebarOpen}
          inert={!repositorySidebarOpen}
        >
          {repositorySidebar}
        </aside>
        <aside className={styles['app-shell__detail-sidebar']} aria-label="Worktree details">
          {detailSidebar}
        </aside>
      </div>
      <main ref={scrollContainerRef} className={styles['app-shell__content']}>
        {children}
      </main>
    </div>
  );
}
