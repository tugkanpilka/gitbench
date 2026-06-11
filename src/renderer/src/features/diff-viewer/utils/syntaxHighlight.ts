import refractor from 'refractor/core';
import bash from 'refractor/lang/bash';
import c from 'refractor/lang/c';
import cpp from 'refractor/lang/cpp';
import go from 'refractor/lang/go';
import java from 'refractor/lang/java';
import json from 'refractor/lang/json';
import markdown from 'refractor/lang/markdown';
import python from 'refractor/lang/python';
import rust from 'refractor/lang/rust';
import scss from 'refractor/lang/scss';
import tsx from 'refractor/lang/tsx';
import yaml from 'refractor/lang/yaml';

const SYNTAXES = [bash, c, cpp, go, java, json, markdown, python, rust, scss, tsx, yaml];

for (const syntax of SYNTAXES) {
  refractor.register(syntax);
}

const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  bash: 'bash',
  c: 'c',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  go: 'go',
  h: 'c',
  hpp: 'cpp',
  java: 'java',
  js: 'javascript',
  jsx: 'jsx',
  json: 'json',
  md: 'markdown',
  markdown: 'markdown',
  mjs: 'javascript',
  py: 'python',
  rs: 'rust',
  scss: 'scss',
  sh: 'bash',
  ts: 'typescript',
  tsx: 'tsx',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash',
};

export function languageFromPath(path: string): string | null {
  const filename = path.split('/').at(-1)?.toLowerCase() ?? '';

  if (filename === 'dockerfile') {
    return 'bash';
  }

  const extension = filename.includes('.') ? (filename.split('.').at(-1) ?? '') : '';
  return LANGUAGE_BY_EXTENSION[extension] ?? null;
}

export { refractor };
