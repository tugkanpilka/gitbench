import type { ViewType } from 'react-diff-view';
import type { DiffModel } from './utils/diffModel.types';

export type { ViewType } from 'react-diff-view';

export interface DiffNavigationTarget {
  fileId: string;
  requestId: number;
}

export type TProps = {
  model: DiffModel;
  clean: boolean;
  viewType: ViewType;
  navigationTarget: DiffNavigationTarget | null;
  onActiveFileChange: (fileId: string) => void;
};
