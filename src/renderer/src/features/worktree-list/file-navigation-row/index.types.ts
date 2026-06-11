import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export type FileNavigationRowProps = {
  file: DiffFileModel;
  depth: number;
  showDirectory: boolean;
};
