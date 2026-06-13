import type { RefObject } from 'react';

import type { DiffModel } from '../../features/diff-viewer/utils/diffModel.types';
import type { DiffNavigationTarget } from '../../features/diff-viewer/index.types';

export type WorkspaceProps = {
  error: string | null;
  diffLoading: boolean;
  hasDiff: boolean;
  isCleanWorktree: boolean;
  diffModel: DiffModel;
  navigationTarget: DiffNavigationTarget | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  onActiveFileChange: (fileId: string | null) => void;
};
