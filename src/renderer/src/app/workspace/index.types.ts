import type { ViewType } from '../../features/diff-viewer/index.types';
import type { DiffModel } from '../../features/diff-viewer/utils/diffModel.types';
import type { DiffNavigationTarget } from '../../features/diff-viewer/index.types';

export type TProps = {
  error: string | null;
  diffLoading: boolean;
  hasDiff: boolean;
  isCleanWorktree: boolean;
  diffModel: DiffModel;
  viewType: ViewType;
  navigationTarget: DiffNavigationTarget | null;
  onActiveFileChange: (fileId: string | null) => void;
};
