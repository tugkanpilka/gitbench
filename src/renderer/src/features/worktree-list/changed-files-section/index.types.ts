import type { FileListMode, FlatGroupMode } from '../../../shared/preferences/appPreferences';
import type { ChangedFileItem } from '../changed-file-item';

export type ChangedFilesSectionProps = {
  changedFiles: ChangedFileItem[];
  fileListMode: FileListMode;
  flatGroupMode: FlatGroupMode;
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
};
