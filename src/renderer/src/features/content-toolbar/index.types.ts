import type { ViewType } from '../diff-viewer/index.types';
import type { Theme } from '../../shared/preferences/appPreferences';
import type { DiffStats } from '../../shared/ui/diff-stat/index.types';

export type ContentToolbarProps = {
  diffStats: DiffStats | null;
  viewType: ViewType;
  theme: Theme;
  sidebarOpen: boolean;
  onViewTypeChange: (viewType: ViewType) => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
};
