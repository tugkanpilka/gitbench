import type { ChangedFileItem } from '../changed-file-item';

export type FileNavigationRowProps = {
  file: ChangedFileItem;
  depth: number;
  showDirectory: boolean;
};
