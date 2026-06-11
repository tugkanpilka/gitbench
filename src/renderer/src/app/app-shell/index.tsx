import { useCallback, useState } from 'react';

import { SidebarResizeHandle } from './sidebar-resize-handle';
import type { AppShellProps } from './index.types';
import styles from './index.module.scss';

export function AppShell({ sidebar, sidebarOpen, children }: AppShellProps) {
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);

  const handleResize = useCallback((width: number) => {
    setSidebarWidth(width);
  }, []);

  const sidebarStyle =
    sidebarWidth !== null
      ? ({ '--gb-sidebar-w-runtime': `${sidebarWidth}px` } as React.CSSProperties)
      : undefined;

  return (
    <div className={styles['app-shell']} data-sidebar-open={sidebarOpen} style={sidebarStyle}>
      <aside
        id="repository-sidebar-panel"
        className={styles['app-shell__sidebar']}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        {sidebar}
      </aside>
      {sidebarOpen && <SidebarResizeHandle onResize={handleResize} />}
      <main className={styles['app-shell__content']}>{children}</main>
    </div>
  );
}
