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

describe('parseCommitLog', () => {
  it('returns an empty list for empty output', () => {
    expect(parseCommitLog('')).toEqual([]);
  });

  it('parses a single commit with its metadata and files', () => {
    const fixture = record(
      {
        sha: SHA_A,
        shortSha: 'aaaaaaa',
        author: 'Ada Lovelace',
        date: '2026-06-12T10:30:00+03:00',
        subject: 'feat: add commits panel',
      },
      ['M\tsrc/app.ts', 'A\tsrc/new.ts', 'D\tsrc/old.ts']
    );

    expect(parseCommitLog(fixture)).toEqual([
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
    ]);
  });

  it('parses multiple commits in order', () => {
    const fixture =
      record(
        { sha: SHA_A, shortSha: 'aaaaaaa', author: 'Ada', date: '2026-06-12T10:30:00+03:00', subject: 'second' },
        ['M\ta.ts']
      ) +
      record(
        { sha: SHA_B, shortSha: 'bbbbbbb', author: 'Ada', date: '2026-06-12T09:00:00+03:00', subject: 'first' },
        ['A\tb.ts']
      );

    const commits = parseCommitLog(fixture);
    expect(commits).toHaveLength(2);
    expect(commits[0].subject).toBe('second');
    expect(commits[1].subject).toBe('first');
  });

  it('parses renames and copies with both paths', () => {
    const fixture = record(
      { sha: SHA_A, shortSha: 'aaaaaaa', author: 'Ada', date: '2026-06-12T10:30:00+03:00', subject: 'move things' },
      ['R100\told/name.ts\tnew/name.ts', 'C075\tsource.ts\tcopy.ts']
    );

    expect(parseCommitLog(fixture)[0].files).toEqual([
      { status: 'renamed', path: 'new/name.ts', previousPath: 'old/name.ts' },
      { status: 'copied', path: 'copy.ts', previousPath: 'source.ts' },
    ]);
  });

  it('drops phantom records produced by separator bytes inside a subject', () => {
    // git does not strip raw 0x1e/0x1f from %s, so a crafted subject splits the
    // stream; the bogus tail record has no 40-hex sha header and must be dropped.
    const fixture = record(
      {
        sha: SHA_A,
        shortSha: 'aaaaaaa',
        author: 'Ada',
        date: '2026-06-12T10:30:00+03:00',
        subject: `before${RS}after${US}field`,
      },
      ['M\ta.ts']
    );

    const commits = parseCommitLog(fixture);
    expect(commits).toHaveLength(1);
    expect(commits[0].sha).toBe(SHA_A);
    expect(commits[0].subject).toBe('before');
  });

  it('tolerates a commit with no file changes (merge/empty)', () => {
    const fixture = record(
      { sha: SHA_A, shortSha: 'aaaaaaa', author: 'Ada', date: '2026-06-12T10:30:00+03:00', subject: 'empty commit' },
      []
    );

    const commits = parseCommitLog(fixture);
    expect(commits).toHaveLength(1);
    expect(commits[0].files).toEqual([]);
  });
});
