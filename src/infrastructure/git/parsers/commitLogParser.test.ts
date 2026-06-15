import { describe, expect, it } from 'vitest';

import { parseCommitLog } from './commitLogParser';

const RS = '\x1e';
const US = '\x1f';

/** Builds one commit record exactly as `git log --name-status --format=...` emits it. */
function record(
  meta: { sha: string; shortSha: string; author: string; date: string; subject: string },
  nameStatusLines: string[]
): string {
  const header = [meta.sha, meta.shortSha, meta.author, meta.date, meta.subject].join(US);
  // git prints the format line, a blank line, then the name-status block.
  return `${RS}${header}\n\n${nameStatusLines.join('\n')}\n`;
}

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);

const BASE_META = {
  sha: SHA_A,
  shortSha: 'aaaaaaa',
  author: 'Ada Lovelace',
  date: '2026-06-12T10:30:00+03:00',
  subject: 'feat: add commits panel',
};

function singleCommitFixture(): string {
  return record(BASE_META, ['M\tsrc/app.ts', 'A\tsrc/new.ts', 'D\tsrc/old.ts']);
}

function renameAndCopyFixture(): string {
  return record({ ...BASE_META, subject: 'move things' }, [
    'R100\told/name.ts\tnew/name.ts',
    'C075\tsource.ts\tcopy.ts',
  ]);
}

function phantomRecordFixture(): string {
  return record({ ...BASE_META, subject: `before${RS}after${US}field` }, ['M\ta.ts']);
}

function emptyCommitFixture(): string {
  return record({ ...BASE_META, subject: 'empty commit' }, []);
}

const SINGLE_COMMIT_EXPECTED = [
  {
    sha: SHA_A,
    shortSha: 'aaaaaaa',
    author: 'Ada Lovelace',
    committedAt: '2026-06-12T10:30:00+03:00',
    subject: 'feat: add commits panel',
    files: [
      { status: 'modified', path: 'src/app.ts', previousPath: null },
      { status: 'added', path: 'src/new.ts', previousPath: null },
      { status: 'deleted', path: 'src/old.ts', previousPath: null },
    ],
  },
];

const SECOND_META = {
  sha: SHA_A,
  shortSha: 'aaaaaaa',
  author: 'Ada',
  date: '2026-06-12T10:30:00+03:00',
  subject: 'second',
};
const FIRST_META = {
  sha: SHA_B,
  shortSha: 'bbbbbbb',
  author: 'Ada',
  date: '2026-06-12T09:00:00+03:00',
  subject: 'first',
};

function twoCommitFixture(): string {
  return record(SECOND_META, ['M\ta.ts']) + record(FIRST_META, ['A\tb.ts']);
}

// eslint-disable-next-line max-lines-per-function
describe('parseCommitLog', () => {
  it('returns an empty list for empty output', () => {
    expect(parseCommitLog('')).toEqual([]);
  });

  it('parses a single commit with its metadata and files', () => {
    expect(parseCommitLog(singleCommitFixture())).toEqual(SINGLE_COMMIT_EXPECTED);
  });

  it('parses multiple commits in order', () => {
    const commits = parseCommitLog(twoCommitFixture());
    expect(commits).toHaveLength(2);
    expect(commits[0].subject).toBe('second');
    expect(commits[1].subject).toBe('first');
  });

  it('parses renames and copies with both paths', () => {
    expect(parseCommitLog(renameAndCopyFixture())[0].files).toEqual([
      { status: 'renamed', path: 'new/name.ts', previousPath: 'old/name.ts' },
      { status: 'copied', path: 'copy.ts', previousPath: 'source.ts' },
    ]);
  });

  it('drops phantom records produced by separator bytes inside a subject', () => {
    // git does not strip raw 0x1e/0x1f from %s, so a crafted subject splits the
    // stream; the bogus tail record has no 40-hex sha header and must be dropped.
    const commits = parseCommitLog(phantomRecordFixture());
    expect(commits).toHaveLength(1);
    expect(commits[0].sha).toBe(SHA_A);
    expect(commits[0].subject).toBe('before');
  });

  it('tolerates a commit with no file changes (merge/empty)', () => {
    const commits = parseCommitLog(emptyCommitFixture());
    expect(commits).toHaveLength(1);
    expect(commits[0].files).toEqual([]);
  });
});
