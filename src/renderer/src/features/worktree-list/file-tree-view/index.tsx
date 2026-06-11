import { VscChevronRight, VscChevronDown } from 'react-icons/vsc';

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

interface TreeDirectoryProps {
  directory: FileTreeDirectory;
  depth: number;
}

function TreeDirectory({ directory, depth }: TreeDirectoryProps) {
  const { collapsedDirectories, onToggleDirectory } = useFileListContext();
  const open = !collapsedDirectories.has(directory.path);

  return (
    <li>
      <button
        type="button"
        className={styles['file-tree-folder']}
        aria-label={`${directory.name} folder`}
        aria-expanded={open}
        style={{ paddingLeft: treeRowIndent(depth) }}
        onClick={() => onToggleDirectory(directory.path)}
      >
        <IndentGuides depth={depth} />
        <FolderChevron open={open} />
        <span className={styles['file-tree-folder__name']}>{directory.name}</span>
      </button>
      {open && <FileTreeView tree={directory} depth={depth + 1} nested />}
    </li>
  );
}

export function FileTreeView({ tree, depth, nested = false }: FileTreeViewProps) {
  return (
    <ul
      className={nested ? styles['file-tree__group'] : styles['file-navigation-list']}
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
