import type { FileListMode } from '../../../shared/preferences/appPreferences';
import type { ChangedFileItem } from '../changed-file-item';

export type FileNavigationListProps = {
  files: ChangedFileItem[];
  mode: FileListMode;
};
