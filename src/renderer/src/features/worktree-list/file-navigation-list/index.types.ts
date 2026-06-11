import type { FileListMode } from '../../../shared/preferences/appPreferences';
import type { DiffFileModel } from '../../diff-viewer/utils/diffModel.types';

export type TProps = {
  files: DiffFileModel[];
  mode: FileListMode;
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
};
