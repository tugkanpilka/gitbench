import { describe, expect, it } from 'vitest';

import { languageFromPath } from './syntaxHighlight';

describe('languageFromPath', () => {
  it("highlights any file named 'dockerfile' as bash, regardless of case or directory", () => {
    expect(languageFromPath('Dockerfile')).toBe('bash');
    expect(languageFromPath('DOCKERFILE')).toBe('bash');
    expect(languageFromPath('docker/api/Dockerfile')).toBe('bash');
  });

  it('matches extensions case-insensitively', () => {
    expect(languageFromPath('README.MD')).toBe('markdown');
    expect(languageFromPath('src/App.TSX')).toBe('tsx');
  });

  it('returns null for extensionless files', () => {
    expect(languageFromPath('Makefile')).toBeNull();
    expect(languageFromPath('LICENSE')).toBeNull();
  });

  it('considers only the basename, so dots in directories never count as extensions', () => {
    expect(languageFromPath('src.v2/main')).toBeNull();
    expect(languageFromPath('src.v2/main.ts')).toBe('typescript');
  });

  it('treats a dotfile name after its leading dot as the extension', () => {
    // '.gitignore' splits to extension 'gitignore', which has no grammar.
    expect(languageFromPath('.gitignore')).toBeNull();
    expect(languageFromPath('.bashrc')).toBeNull();
  });

  it('distinguishes C headers from C++ headers', () => {
    expect(languageFromPath('include/list.h')).toBe('c');
    expect(languageFromPath('include/list.hpp')).toBe('cpp');
  });

  it('maps both yaml spellings to the same grammar', () => {
    expect(languageFromPath('.github/workflows/ci.yml')).toBe('yaml');
    expect(languageFromPath('config/app.yaml')).toBe('yaml');
  });

  it('returns null for an empty path', () => {
    expect(languageFromPath('')).toBeNull();
  });
});
