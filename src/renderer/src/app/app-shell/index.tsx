import type { AppShellProps } from './index.types';
import styles from './index.module.scss';

export function AppShell({ sidebar, sidebarOpen, children }: AppShellProps) {
  return (
    <div className={styles['app-shell']} data-sidebar-open={sidebarOpen}>
      <aside
        id="repository-sidebar-panel"
        className={styles['app-shell__sidebar']}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        {sidebar}
      </aside>
      <main className={styles['app-shell__content']}>{children}</main>
    </div>
  );
}
