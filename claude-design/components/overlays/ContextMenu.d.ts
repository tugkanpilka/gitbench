/**
 * macOS context menu with vibrancy. Hovered item = accent bg + white text;
 * destructive items are red until hovered. "—" renders a separator.
 */
export interface ContextMenuItem {
  label: string;
  /** Keyboard hint shown right-aligned, e.g. "⌘R". */
  hint?: string;
  destructive?: boolean;
  onClick?: () => void;
}
export interface ContextMenuProps {
  items: (ContextMenuItem | "—")[];
  /** Cursor position; when both set, renders as a fixed overlay that closes on outside click. */
  x?: number | null;
  y?: number | null;
  onClose?: () => void;
}
