import type { RefObject } from 'react';
import type { ViewType } from 'react-diff-view';
import type { DiffModel } from './utils/diffModel.types';

export type { ViewType } from 'react-diff-view';

export interface DiffNavigationTarget {
  fileId: string;
  requestId: number;
}

export type DiffViewProps = {
  model: DiffModel;
  clean: boolean;
  viewType: ViewType;
  navigationTarget: DiffNavigationTarget | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  onActiveFileChange: (fileId: string) => void;
};
