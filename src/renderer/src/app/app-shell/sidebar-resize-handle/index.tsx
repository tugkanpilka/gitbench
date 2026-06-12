import { useCallback, useRef } from 'react';
import styles from './index.module.scss';

interface SidebarResizeHandleProps {
  onResize: (width: number) => void;
  onResizeEnd?: () => void;
}

/**
 * Draggable divider between the sidebar and content pane.
 * Double-click resets to the CSS-defined default width.
 */
export function SidebarResizeHandle({ onResize, onResizeEnd }: SidebarResizeHandleProps) {
  const dragging = useRef(false);
  const handleRef = useRef<HTMLDivElement>(null);

  const getConstraints = useCallback(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return {
      min: parseInt(style.getPropertyValue('--gb-detail-sidebar-min'), 10) || 240,
      max: parseInt(style.getPropertyValue('--gb-detail-sidebar-max'), 10) || 480,
      defaultWidth: parseInt(style.getPropertyValue('--gb-detail-sidebar-w'), 10) || 300,
    };
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      handleRef.current?.setAttribute('data-dragging', 'true');

      const { min, max } = getConstraints();
      const startX = e.clientX;
      const startWidth =
        handleRef.current?.previousElementSibling?.getBoundingClientRect().width ?? 0;
      const sourceWidth =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--gb-source-sidebar-w'),
          10
        ) || 220;
      const initialDetailWidth = Math.max(0, startWidth - sourceWidth);

      const onMouseMove = (ev: MouseEvent) => {
        const nextWidth = initialDetailWidth + ev.clientX - startX;
        const clamped = Math.min(max, Math.max(min, nextWidth));
        onResize(clamped);
      };

      const onMouseUp = () => {
        dragging.current = false;
        handleRef.current?.setAttribute('data-dragging', 'false');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        onResizeEnd?.();
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [getConstraints, onResize, onResizeEnd]
  );

  const onDoubleClick = useCallback(() => {
    const { defaultWidth } = getConstraints();
    onResize(defaultWidth);
  }, [getConstraints, onResize]);

  return (
    <div
      ref={handleRef}
      className={styles['resize-handle']}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      data-dragging="false"
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    />
  );
}
