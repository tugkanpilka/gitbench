import type { FileListMode } from '../../../shared/preferences/appPreferences';
import type { DiffStats } from '../../../shared/ui/diff-stat/index.types';
import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export type TProps = {
  changedFiles: DiffFileModel[];
  fileListMode: FileListMode;
  activeFileId: string | null;
  diffStats: DiffStats | null;
  onSelectFile: (fileId: string) => void;
};
