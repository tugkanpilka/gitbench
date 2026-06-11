import type { FileListMode } from '../../../shared/preferences/appPreferences';
import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export type FileNavigationListProps = {
  files: DiffFileModel[];
  mode: FileListMode;
};
