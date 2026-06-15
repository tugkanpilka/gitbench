import type { IconType } from 'react-icons';
import { VscFile, VscJson, VscMarkdown } from 'react-icons/vsc';
import { SiTypescript, SiJavascript, SiReact, SiCss, SiHtml5 } from 'react-icons/si';
import type { FileIconProps } from './index.types';
import styles from './index.module.scss';

const FALLBACK_COLOR = 'var(--gb-dim)';

const ICONS_BY_SUFFIX: ReadonlyArray<readonly [suffix: string, Icon: IconType, color: string]> = [
  ['.tsx', SiReact, '#61dafb'],
  ['.jsx', SiReact, '#61dafb'],
  ['.ts', SiTypescript, '#3178c6'],
  ['.js', SiJavascript, '#f7df1e'],
  ['.css', SiCss, '#264de4'],
  ['.json', VscJson, '#cb3837'],
  ['.html', SiHtml5, '#e34c26'],
  ['.md', VscMarkdown, FALLBACK_COLOR],
];

export function FileIcon({ name }: FileIconProps) {
  const match = ICONS_BY_SUFFIX.find(([suffix]) => name.endsWith(suffix));
  const [, Icon, color] = match ?? ['', VscFile, FALLBACK_COLOR];
  return <Icon className={styles['file-icon']} style={{ color }} />;
}
