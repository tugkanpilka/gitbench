import { VscChevronRight, VscChevronDown } from 'react-icons/vsc';

import { Visibility } from '../../../shared/ui/visibility';
import { useFileListContext } from '../file-list-context';
import type { FileTreeDirectory } from '../utils/fileTree.types';
import { FileNavigationRow } from '../file-navigation-row';
import { IndentGuides, treeRowIndent } from '../indent-guides';
import type { FileTreeViewProps } from './index.types';
import styles from '../index.module.scss';

function FolderChevron({ open }: { open: boolean }) {
  const Icon = open ? VscChevronDown : VscChevronRight;
  return <Icon className={styles['file-tree-folder__chevron']} />;
}

interface FolderButtonProps {
  directory: FileTreeDirectory; depth: number; open: boolean; onToggle: () => void;
}

function FolderButton({ directory, depth, open, onToggle }: FolderButtonProps) {
  return (
    <button type="button" className={styles['file-tree-folder']}
      aria-label={`${directory.name} folder`} aria-expanded={open}
      style={{ paddingLeft: treeRowIndent(depth) }} onClick={onToggle}
    >
      <IndentGuides depth={depth} />
      <FolderChevron open={open} />
      <span className={styles['file-tree-folder__name']}>{directory.name}</span>
    </button>
  );
}

interface TreeDirectoryProps { directory: FileTreeDirectory; depth: number }

function TreeDirectory({ directory, depth }: TreeDirectoryProps) {
  const { collapsedDirectories, onToggleDirectory } = useFileListContext();
  const open = !collapsedDirectories.has(directory.path);
  return (
    <li>
      <FolderButton directory={directory} depth={depth} open={open} onToggle={() => onToggleDirectory(directory.path)} />
      <Visibility isVisible={open}>
        <FileTreeView tree={directory} depth={depth + 1} nested />
      </Visibility>
    </li>
  );
}

export function FileTreeView({ tree, depth, nested = false }: FileTreeViewProps) {
  return (
    <ul className={nested ? styles['file-tree__group'] : styles['file-navigation-list']}
      aria-label={nested ? undefined : 'Changed files'}
    >
      {tree.directories.map((directory) => (
        <TreeDirectory key={directory.path} directory={directory} depth={depth} />
      ))}
      {tree.files.map((file) => (
        <FileNavigationRow key={file.id} file={file} depth={depth} showDirectory={false} />
      ))}
    </ul>
  );
}
