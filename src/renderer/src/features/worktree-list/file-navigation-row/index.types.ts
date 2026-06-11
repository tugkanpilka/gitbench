import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export type FileNavigationRowProps = {
  file: DiffFileModel;
  active: boolean;
  depth: number;
  showDirectory: boolean;
  onSelect: () => void;
};
