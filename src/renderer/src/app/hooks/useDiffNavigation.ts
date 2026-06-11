import { useEffect, useRef, useState } from 'react';

import type { DiffNavigationTarget } from '../../features/diff-viewer/index.types';
import type { DiffModel } from '../../features/diff-viewer/utils/diffModel.types';

interface DiffNavigationController {
  activeFileId: string | null;
  navigationTarget: DiffNavigationTarget | null;
  selectFile: (fileId: string) => void;
  setActiveFileId: (fileId: string | null) => void;
}

/**
 * Tracks which diff file is active and turns sidebar selections into
 * scroll-navigation requests for the DiffView.
 */
export function useDiffNavigation(diffModel: DiffModel): DiffNavigationController {
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<DiffNavigationTarget | null>(null);
  const navigationRequestId = useRef(0);

  // diffModel identity changes whenever a new diff arrives (including
  // switching worktrees), so it is the only reset trigger needed.
  useEffect(() => {
    setActiveFileId(diffModel.files[0]?.id ?? null);
    setNavigationTarget(null);
  }, [diffModel]);

  const selectFile = (fileId: string) => {
    navigationRequestId.current += 1;
    setActiveFileId(fileId);
    setNavigationTarget({ fileId, requestId: navigationRequestId.current });
  };

  return { activeFileId, navigationTarget, selectFile, setActiveFileId };
}
