import { describe, expect, it } from 'vitest';

import { languageFromPath, refractor } from './syntaxHighlight';

describe('languageFromPath', () => {
  it.each([
    ['Dockerfile', 'docker'],
    ['docker/api/Containerfile.dev', 'docker'],
    ['Makefile', 'makefile'],
    ['CMakeLists.txt', 'cmake'],
    ['Jenkinsfile', 'groovy'],
    ['Gemfile', 'ruby'],
    ['Cargo.lock', 'toml'],
    ['go.mod', 'go-module'],
    ['.gitignore', 'ignore'],
    ['.prettierignore', 'ignore'],
    ['.env.production', 'bash'],
    ['.editorconfig', 'editorconfig'],
    ['.clang-format', 'yaml'],
    ['flake.lock', 'json'],
    ['Podfile.lock', 'yaml'],
  ])('maps special filename %s to %s', (path, language) => {
    expect(languageFromPath(path)).toBe(language);
    expect(refractor.registered(language)).toBe(true);
  });

  it.each([
    ['src/App.TSX', 'tsx'],
    ['src/index.mts', 'typescript'],
    ['src/index.cjs', 'javascript'],
    ['src/types.d.ts', 'typescript'],
    ['src/styles/global.css', 'css'],
    ['src/styles/theme.less', 'less'],
    ['src/components/Card.vue', 'markup'],
    ['src/components/Card.svelte', 'markup'],
    ['src/pages/index.astro', 'markup'],
    ['README.mdx', 'markdown'],
    ['config/settings.jsonc', 'json'],
    ['src/Program.cs', 'csharp'],
    ['src/main.fsx', 'fsharp'],
    ['android/build.gradle', 'groovy'],
    ['android/build.gradle.kts', 'kotlin'],
    ['lib/server.exs', 'elixir'],
    ['lib/server.erl', 'erlang'],
    ['src/core.clj', 'clojure'],
    ['src/parser.ml', 'ocaml'],
    ['schema/query.gql', 'graphql'],
    ['infra/main.tf', 'hcl'],
    ['infra/dev.tfvars', 'hcl'],
    ['shaders/main.vert', 'glsl'],
    ['api/service.proto', 'protobuf'],
    ['scripts/release.ps1', 'powershell'],
    ['scripts/release.bat', 'batch'],
    ['database/schema.sql', 'sql'],
    ['src/main.zig', 'zig'],
    ['templates/page.hbs', 'hbs'],
    ['notebooks/report.ipynb', 'json'],
    ['src/legacy.f90', 'fortran'],
    ['src/program.adb', 'ada'],
    ['src/main.cbl', 'cobol'],
    ['hardware/module.vhd', 'vhdl'],
    ['changes/fix.patch', 'diff'],
    ['docs/guide.rst', 'rest'],
    ['src/App.csproj', 'markup'],
  ])('maps extension in %s to %s', (path, language) => {
    expect(languageFromPath(path)).toBe(language);
    expect(refractor.registered(language)).toBe(true);
  });

  it('uses any Refractor language name or alias that matches the extension', () => {
    expect(refractor.listLanguages().length).toBeGreaterThan(300);
    expect(languageFromPath('src/contract.sol')).toBe('solidity');
    expect(languageFromPath('src/module.purs')).toBe('purs');
    expect(languageFromPath('docs/spec.adoc')).toBe('adoc');
    expect(languageFromPath('src/model.rkt')).toBe('rkt');
  });

  it('considers only the basename, so dots in directories never count as extensions', () => {
    expect(languageFromPath('src.v2/main')).toBeNull();
    expect(languageFromPath('src.v2/main.ts')).toBe('typescript');
  });

  it('returns null when no reliable grammar can be inferred', () => {
    expect(languageFromPath('LICENSE')).toBeNull();
    expect(languageFromPath('assets/logo.png')).toBeNull();
    expect(languageFromPath('')).toBeNull();
  });
});
