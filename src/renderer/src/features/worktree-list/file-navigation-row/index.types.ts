import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export type TProps = {
  file: DiffFileModel;
  active: boolean;
  depth: number;
  showDirectory: boolean;
  onSelect: () => void;
};
