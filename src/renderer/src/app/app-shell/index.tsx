import { useCallback, useState } from 'react';

import { SidebarResizeHandle } from './sidebar-resize-handle';
import type { AppShellProps } from './index.types';
import styles from './index.module.scss';

export function AppShell({
  repositorySidebar,
  detailSidebar,
  sidebarOpen,
  children,
}: AppShellProps) {
  const [detailSidebarWidth, setDetailSidebarWidth] = useState<number | null>(null);

  const handleResize = useCallback((width: number) => {
    setDetailSidebarWidth(width);
  }, []);

  const shellStyle =
    detailSidebarWidth !== null
      ? ({
          '--gb-detail-sidebar-w-runtime': `${detailSidebarWidth}px`,
        } as React.CSSProperties)
      : undefined;

  return (
    <div className={styles['app-shell']} data-sidebar-open={sidebarOpen} style={shellStyle}>
      <div
        id="workspace-sidebar-panels"
        className={styles['app-shell__sidebars']}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        <aside className={styles['app-shell__repository-sidebar']}>{repositorySidebar}</aside>
        <aside className={styles['app-shell__detail-sidebar']}>{detailSidebar}</aside>
      </div>
      {sidebarOpen && <SidebarResizeHandle onResize={handleResize} />}
      <main className={styles['app-shell__content']}>{children}</main>
    </div>
  );
}
