import { useRef, useState } from 'react';

import type { DiffNavigationTarget } from '../../features/diff-viewer/index.types';
import type { DiffModel } from '../../features/diff-viewer/utils/diffModel.types';

/**
 * Synchronously resets navigation state whenever diffModel identity changes.
 * Runs during render (no useEffect) to avoid a cascading render cycle.
 */
function useModelReset(diffModel: DiffModel, onReset: (firstFileId: string | null) => void): void {
  const [committedModel, setCommittedModel] = useState<DiffModel>(diffModel);
  if (committedModel !== diffModel) {
    setCommittedModel(diffModel);
    onReset(diffModel.files[0]?.id ?? null);
  }
}

export interface DiffNavigationController {
  activeFileId: string | null;
  navigationTarget: DiffNavigationTarget | null;
  selectFile: (fileId: string) => void;
  setActiveFileId: (fileId: string | null) => void;
}

/**
 * Tracks which diff file is active and turns sidebar selections into
 * scroll-navigation requests for the DiffView.
 */
// eslint-disable-next-line max-lines-per-function -- hook body: 3 state declarations + reset + selectFile callback; no further split without hurting cohesion
export function useDiffNavigation(diffModel: DiffModel): DiffNavigationController {
  const [activeFileId, setActiveFileId] = useState<string | null>(
    () => diffModel.files[0]?.id ?? null
  );
  const [navigationTarget, setNavigationTarget] = useState<DiffNavigationTarget | null>(null);
  const navigationRequestId = useRef(0);

  // diffModel identity changes whenever a new diff arrives (including switching
  // worktrees). useModelReset handles the render-time derived-state reset.
  useModelReset(diffModel, (id) => {
    setActiveFileId(id);
    setNavigationTarget(null);
  });

  const selectFile = (fileId: string) => {
    navigationRequestId.current += 1;
    setActiveFileId(fileId);
    setNavigationTarget({ fileId, requestId: navigationRequestId.current });
  };

  return { activeFileId, navigationTarget, selectFile, setActiveFileId };
}
