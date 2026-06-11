import type { FileListMode } from '../../../shared/preferences/appPreferences';
import type { DiffStats } from '../../../shared/ui/diff-stat/index.types';
import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export type ChangedFilesSectionProps = {
  changedFiles: DiffFileModel[];
  fileListMode: FileListMode;
  diffStats: DiffStats | null;
};
