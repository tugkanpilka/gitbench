import refractor from 'refractor';

const LANGUAGE_BY_FILENAME: Readonly<Record<string, string>> = {
  '.babelrc': 'json',
  '.clang-format': 'yaml',
  '.clang-tidy': 'yaml',
  '.clangd': 'yaml',
  '.editorconfig': 'editorconfig',
  '.eslintrc': 'json',
  '.gitmodules': 'ini',
  '.npmrc': 'ini',
  '.prettierrc': 'json',
  '.stylelintrc': 'json',
  '.swcrc': 'json',
  '.yamllint': 'yaml',
  '.yarnrc': 'yaml',
  'apache2.conf': 'apacheconf',
  appfile: 'ruby',
  brewfile: 'ruby',
  'cargo.lock': 'toml',
  cartfile: 'ruby',
  'cmakelists.txt': 'cmake',
  'composer.lock': 'json',
  dangerfile: 'ruby',
  deliverfile: 'ruby',
  fastfile: 'ruby',
  'flake.lock': 'json',
  gemfile: 'ruby',
  'go.mod': 'go-module',
  gnumakefile: 'makefile',
  gymfile: 'ruby',
  'httpd.conf': 'apacheconf',
  jenkinsfile: 'groovy',
  justfile: 'makefile',
  makefile: 'makefile',
  matchfile: 'ruby',
  'mix.lock': 'elixir',
  'nginx.conf': 'nginx',
  'package.resolved': 'json',
  'pipfile.lock': 'json',
  pipfile: 'toml',
  podfile: 'ruby',
  'podfile.lock': 'yaml',
  'poetry.lock': 'toml',
  procfile: 'bash',
  'pubspec.lock': 'yaml',
  rakefile: 'ruby',
  scanfile: 'ruby',
  snapfile: 'ruby',
  vagrantfile: 'ruby',
  'web.config': 'markup',
  'yarn.lock': 'yaml',
};

const LANGUAGE_BY_SUFFIX: Readonly<Record<string, string>> = {
  '.blade.php': 'php',
  '.d.cts': 'typescript',
  '.d.mts': 'typescript',
  '.d.ts': 'typescript',
  '.gradle.kts': 'kotlin',
  '.tfvars.json': 'json',
};

// Refractor registers hundreds of language names and aliases. This map only
// covers extensions that differ from those registered names or need a useful
// fallback to a closely compatible grammar.
const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  ada: 'ada',
  adb: 'ada',
  ads: 'ada',
  asax: 'aspnet',
  ascx: 'aspnet',
  ashx: 'aspnet',
  asm: 'nasm',
  asmdef: 'json',
  asmx: 'aspnet',
  aspx: 'aspnet',
  astro: 'markup',
  avsc: 'json',
  axaml: 'markup',
  bashrc: 'bash',
  bat: 'batch',
  bazel: 'python',
  bib: 'latex',
  bzl: 'python',
  cbl: 'cobol',
  cjs: 'javascript',
  cl: 'lisp',
  clj: 'clojure',
  cljc: 'clojure',
  cljs: 'clojure',
  cls: 'visual-basic',
  cmd: 'batch',
  cob: 'cobol',
  cnf: 'ini',
  'code-workspace': 'json',
  comp: 'glsl',
  conf: 'ini',
  config: 'ini',
  cpp: 'cpp',
  cs: 'csharp',
  csproj: 'markup',
  cts: 'typescript',
  cxx: 'cpp',
  ddl: 'sql',
  desktop: 'ini',
  dml: 'sql',
  edn: 'clojure',
  eex: 'elixir',
  env: 'bash',
  erl: 'erlang',
  ex: 'elixir',
  exs: 'elixir',
  f: 'fortran',
  f03: 'fortran',
  f08: 'fortran',
  f77: 'fortran',
  f90: 'fortran',
  f95: 'fortran',
  feature: 'gherkin',
  fish: 'bash',
  for: 'fortran',
  frag: 'glsl',
  frm: 'visual-basic',
  fs: 'fsharp',
  fsi: 'fsharp',
  fsproj: 'markup',
  fsscript: 'fsharp',
  fsx: 'fsharp',
  gd: 'gdscript',
  gdshader: 'glsl',
  geom: 'glsl',
  geojson: 'json',
  gitconfig: 'ini',
  glsl: 'glsl',
  gql: 'graphql',
  gradle: 'groovy',
  graphqls: 'graphql',
  gsh: 'groovy',
  gvy: 'groovy',
  gy: 'groovy',
  h: 'c',
  har: 'json',
  hh: 'cpp',
  hpp: 'cpp',
  htm: 'markup',
  hrl: 'erlang',
  hxx: 'cpp',
  inc: 'php',
  ipynb: 'json',
  java: 'java',
  jinja: 'django',
  jl: 'julia',
  jsonc: 'json',
  jsonl: 'json',
  jsx: 'jsx',
  ksh: 'bash',
  lhs: 'haskell',
  litcoffee: 'coffeescript',
  m: 'objectivec',
  map: 'json',
  markdown: 'markdown',
  mdx: 'markdown',
  mjs: 'javascript',
  mk: 'makefile',
  ml: 'ocaml',
  mli: 'ocaml',
  mm: 'objectivec',
  mmd: 'mermaid',
  mts: 'typescript',
  mustache: 'markup',
  njk: 'django',
  nuspec: 'markup',
  patch: 'diff',
  phtml: 'php',
  pbxproj: 'properties',
  php3: 'php',
  php4: 'php',
  php5: 'php',
  php7: 'php',
  php8: 'php',
  plist: 'markup',
  pm: 'perl',
  podspec: 'ruby',
  profile: 'bash',
  props: 'markup',
  proto: 'protobuf',
  prototxt: 'protobuf',
  ps1: 'powershell',
  psd1: 'powershell',
  psm1: 'powershell',
  psql: 'sql',
  py: 'python',
  pyi: 'python',
  pyw: 'python',
  rmd: 'markdown',
  resx: 'markup',
  rst: 'rest',
  rss: 'markup',
  sbt: 'scala',
  sc: 'scala',
  scm: 'scheme',
  s: 'nasm',
  sh: 'bash',
  shader: 'glsl',
  snap: 'javascript',
  sol: 'solidity',
  storyboard: 'markup',
  sty: 'latex',
  svelte: 'markup',
  sv: 'verilog',
  svh: 'verilog',
  t: 'perl',
  targets: 'markup',
  tesc: 'glsl',
  tese: 'glsl',
  tf: 'hcl',
  tfvars: 'hcl',
  topojson: 'json',
  ts: 'typescript',
  tsv: 'csv',
  tsx: 'tsx',
  ttl: 'turtle',
  vb: 'vbnet',
  vbs: 'visual-basic',
  vcxproj: 'markup',
  vert: 'glsl',
  vh: 'verilog',
  vhd: 'vhdl',
  vue: 'markup',
  wat: 'wasm',
  wast: 'wasm',
  wsdl: 'markup',
  xaml: 'markup',
  xhtml: 'markup',
  xib: 'markup',
  xsd: 'markup',
  xsl: 'markup',
  xslt: 'markup',
  yaml: 'yaml',
  zsh: 'bash',
  zshrc: 'bash',
};

function languageForSpecialFilename(filename: string): string | null {
  const exactMatch = LANGUAGE_BY_FILENAME[filename];
  if (exactMatch !== undefined) {
    return exactMatch;
  }

  if (/^(?:docker|container)file(?:\..+)?$/.test(filename)) {
    return 'docker';
  }
  if (/^\.env(?:\..+)?$/.test(filename)) {
    return 'bash';
  }
  if (
    /^\.(?:babel|docker|eslint|git|helm|hg|npm|prettier|stylelint|vercel)ignore$/.test(filename)
  ) {
    return 'ignore';
  }

  return null;
}

export function languageFromPath(path: string): string | null {
  const filename = path.split('/').at(-1)?.toLowerCase() ?? '';
  if (filename === '') {
    return null;
  }

  const specialFilenameLanguage = languageForSpecialFilename(filename);
  if (specialFilenameLanguage !== null) {
    return specialFilenameLanguage;
  }

  for (const [suffix, language] of Object.entries(LANGUAGE_BY_SUFFIX)) {
    if (filename.endsWith(suffix)) {
      return language;
    }
  }

  const extension = filename.includes('.') ? (filename.split('.').at(-1) ?? '') : '';
  if (extension === '') {
    return null;
  }

  const mappedLanguage = LANGUAGE_BY_EXTENSION[extension];
  if (mappedLanguage !== undefined) {
    return mappedLanguage;
  }

  return refractor.registered(extension) ? extension : null;
}

export { refractor };
