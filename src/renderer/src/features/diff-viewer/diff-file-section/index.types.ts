import type { RefCallback } from 'react';
import type { ViewType } from 'react-diff-view';
import type { DiffFileModel } from '../utils/diffModel.types';

export type TProps = {
  model: DiffFileModel;
  viewType: ViewType;
  collapsed: boolean;
  onToggle: () => void;
  sectionRef: RefCallback<HTMLElement>;
};
