/**
 * macOS alert dialog (centered, vibrancy, stacked buttons). Use for every destructive confirm.
 */
export interface AlertDialogProps {
  /** Optional app-icon node shown above the title (52px). */
  icon?: React.ReactNode;
  title: string;
  body: React.ReactNode;
  /** Default "Tamam". */
  confirmLabel?: string;
  /** Default "Vazgeç". */
  cancelLabel?: string;
  /** Red confirm button (default true). */
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  /** Render without the fixed dim backdrop (for specimens). */
  inline?: boolean;
}
