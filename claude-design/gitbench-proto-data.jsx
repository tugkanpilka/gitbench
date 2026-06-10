// GitBench prototype — extended per-worktree diff data
// Builds on gitbench-data.jsx (WORKTREES, CHANGED_FILES, DIFFS must be loaded first)

(function () {
  const ctx = (old, nw, tok) => ({ t: "ctx", old, nw, tok });
  const add = (nw, tok) => ({ t: "add", nw, tok });
  const del = (old, tok) => ({ t: "del", old, tok });
  const hunk = (text) => ({ t: "hunk", text });

  const B_TOKEN = [
    hunk("@@ -3,6 +3,9 @@ import { decode } from \"./jwt\""),
    ctx(3, 3, [["kw","import"],["pl"," { "],["fn","decode"],["pl"," } "],["kw","from"],["pl"," "],["str","\"./jwt\""],["pl",";"]]),
    add(4, [["kw","import"],["pl"," { "],["ty","Session"],["pl"," } "],["kw","from"],["pl"," "],["str","\"./session\""],["pl",";"]]),
    ctx(4, 5, [["pl",""]]),
    del(5, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","verifyToken"],["pl","(raw: "],["ty","string"],["pl",") {"]]),
    del(6, [["pl","  "],["kw","return"],["pl"," "],["fn","decode"],["pl","(raw) != "],["kw","null"],["pl",";"]]),
    add(6, [["kw","export"],["pl"," "],["kw","async"],["pl"," "],["kw","function"],["pl"," "],["fn","verifyToken"],["pl","(raw: "],["ty","string"],["pl","): "],["ty","Promise<Session>"],["pl"," {"]]),
    add(7, [["pl","  "],["kw","const"],["pl"," payload = "],["fn","decode"],["pl","(raw);"]]),
    add(8, [["pl","  "],["kw","if"],["pl"," (!payload) "],["kw","throw"],["pl"," "],["kw","new"],["pl"," "],["ty","TokenError"],["pl","("],["str","\"invalid\""],["pl",");"]]),
    add(9, [["pl","  "],["kw","return"],["pl"," sessions."],["fn","load"],["pl","(payload."],["pr","sid"],["pl",");"]]),
    ctx(7, 10, [["pl","}"]]),
  ];

  const B_ROUTES = [
    hunk("@@ -18,8 +18,10 @@ export function registerRoutes(app: App)"),
    ctx(18, 18, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","registerRoutes"],["pl","(app: "],["ty","App"],["pl",") {"]]),
    del(19, [["pl","  app."],["fn","get"],["pl","("],["str","\"/me\""],["pl",", authMiddleware, me);"]]),
    add(19, [["pl","  app."],["fn","get"],["pl","("],["str","\"/me\""],["pl",", "],["fn","withAuth"],["pl","(me));"]]),
    add(20, [["pl","  app."],["fn","get"],["pl","("],["str","\"/sessions\""],["pl",", "],["fn","withAuth"],["pl","(listSessions));"]]),
    ctx(20, 21, [["pl","  app."],["fn","post"],["pl","("],["str","\"/login\""],["pl",", login);"]]),
    del(21, [["pl","  app."],["fn","post"],["pl","("],["str","\"/logout\""],["pl",", logout);"]]),
    add(22, [["pl","  app."],["fn","post"],["pl","("],["str","\"/logout\""],["pl",", "],["fn","withAuth"],["pl","(logout));"]]),
    ctx(22, 23, [["pl","}"]]),
  ];

  const B_GUARDS = [
    hunk("@@ -5,6 +5,9 @@ import { AuthResult } from \"../auth/result\""),
    ctx(5, 5, [["kw","import"],["pl"," { "],["ty","AuthResult"],["pl"," } "],["kw","from"],["pl"," "],["str","\"../auth/result\""],["pl",";"]]),
    ctx(6, 6, [["pl",""]]),
    add(7, [["cm","// Wraps a handler with the async auth middleware."]]),
    add(8, [["kw","export"],["pl"," "],["kw","const"],["pl"," withAuth = (h: "],["ty","Handler"],["pl",") => "],["kw","async"],["pl"," (req: "],["ty","Request"],["pl",") => {"]]),
    add(9, [["pl","  "],["kw","const"],["pl"," result = "],["kw","await"],["pl"," "],["fn","authMiddleware"],["pl","(req);"]]),
    del(7, [["kw","export"],["pl"," "],["kw","const"],["pl"," requireAuth = (req: "],["ty","Request"],["pl",") => {"]]),
    del(8, [["pl","  "],["kw","if"],["pl"," (!"],["fn","authMiddleware"],["pl","(req)) "],["kw","throw"],["pl"," "],["num","401"],["pl",";"]]),
    add(10, [["pl","  "],["kw","if"],["pl"," (!result."],["pr","ok"],["pl",") "],["kw","return"],["pl"," "],["ty","Response"],["pl","."],["fn","unauthorized"],["pl","();"]]),
    add(11, [["pl","  "],["kw","return"],["pl"," "],["fn","h"],["pl","(req, result."],["pr","session"],["pl",");"]]),
    ctx(9, 12, [["pl","};"]]),
  ];

  const B_TYPES = [
    hunk("@@ -1,4 +1,8 @@"),
    ctx(1, 1, [["kw","declare"],["pl"," "],["kw","module"],["pl"," "],["str","\"gitbench/auth\""],["pl"," {"]]),
    del(2, [["pl","  "],["kw","type"],["pl"," "],["ty","AuthResult"],["pl"," = "],["ty","boolean"],["pl",";"]]),
    add(2, [["pl","  "],["kw","interface"],["pl"," "],["ty","AuthResult"],["pl"," {"]]),
    add(3, [["pl","    "],["pr","ok"],["pl",": "],["ty","boolean"],["pl",";"]]),
    add(4, [["pl","    "],["pr","session"],["pl","?: "],["ty","Session"],["pl",";"]]),
    add(5, [["pl","  }"]]),
    ctx(3, 6, [["pl","}"]]),
  ];

  const B_TEST = [
    hunk("@@ -12,5 +12,6 @@ describe(\"authMiddleware\")"),
    ctx(12, 12, [["fn","describe"],["pl","("],["str","\"authMiddleware\""],["pl",", () => {"]]),
    del(13, [["pl","  "],["fn","it"],["pl","("],["str","\"rejects missing token\""],["pl",", () => {"]]),
    del(14, [["pl","    "],["fn","expect"],["pl","("],["fn","authMiddleware"],["pl","(req))."],["fn","toBe"],["pl","("],["kw","false"],["pl",");"]]),
    add(13, [["pl","  "],["fn","it"],["pl","("],["str","\"rejects missing token\""],["pl",", "],["kw","async"],["pl"," () => {"]]),
    add(14, [["pl","    "],["kw","const"],["pl"," r = "],["kw","await"],["pl"," "],["fn","authMiddleware"],["pl","(req);"]]),
    add(15, [["pl","    "],["fn","expect"],["pl","(r."],["pr","ok"],["pl",")."],["fn","toBe"],["pl","("],["kw","false"],["pl",");"]]),
    ctx(15, 16, [["pl","  });"]]),
    ctx(16, 17, [["pl","});"]]),
  ];

  const B_README = [
    hunk("@@ -42,2 +42,4 @@ ## Authentication"),
    ctx(42, 42, [["pl","## Authentication"]]),
    ctx(43, 43, [["pl",""]]),
    add(44, [["pl","Sessions are now async and stored server-side."]]),
    add(45, [["pl","See "],["str","`src/auth/session.ts`"],["pl"," for the TTL policy."]]),
  ];

  const B_VLIST = [
    hunk("@@ -9,7 +9,13 @@ export function VirtualList({ rows })"),
    ctx(9, 9, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","VirtualList"],["pl","({ rows }: "],["ty","Props"],["pl",") {"]]),
    del(10, [["pl","  "],["kw","return"],["pl"," rows."],["fn","map"],["pl","(r => <"],["ty","Row"],["pl"," key={r."],["pr","id"],["pl","} />);"]]),
    add(10, [["pl","  "],["kw","const"],["pl"," vp = "],["fn","useViewport"],["pl","();"]]),
    add(11, [["pl","  "],["kw","const"],["pl"," [a, b] = "],["fn","visibleRange"],["pl","(vp, rows."],["pr","length"],["pl",", "],["ty","ROW_H"],["pl",");"]]),
    add(12, [["pl","  "],["kw","return"],["pl"," ("]]),
    add(13, [["pl","    <"],["ty","Spacer"],["pl"," total={rows."],["pr","length"],["pl","}>"]]),
    add(14, [["pl","      {rows."],["fn","slice"],["pl","(a, b)."],["fn","map"],["pl","(r => <"],["ty","Row"],["pl"," key={r."],["pr","id"],["pl","} />)}"]]),
    add(15, [["pl","    </"],["ty","Spacer"],["pl",">"]]),
    add(16, [["pl","  );"]]),
    ctx(11, 17, [["pl","}"]]),
  ];

  const B_VIEWPORT = [
    hunk("@@ -2,4 +2,8 @@"),
    ctx(2, 2, [["kw","import"],["pl"," { useState, useEffect } "],["kw","from"],["pl"," "],["str","\"react\""],["pl",";"]]),
    ctx(3, 3, [["pl",""]]),
    add(4, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","useViewport"],["pl","() {"]]),
    add(5, [["pl","  "],["kw","const"],["pl"," [y, setY] = "],["fn","useState"],["pl","("],["num","0"],["pl",");"]]),
    add(6, [["pl","  "],["cm","// rAF-throttled scroll tracking"]]),
    add(7, [["pl","}"]]),
  ];

  // body pool for files without hand-written diffs
  const POOL = [B_ROUTES, B_GUARDS, B_VLIST, B_TOKEN, B_TYPES, B_VIEWPORT, B_TEST];

  const F = (dir, name, a, d, body) => ({ dir, name, add: a, del: d, lines: body });

  const AUTH_FILES = [
    F("src/auth/", "middleware.ts", 42, 18, DIFFS[0].lines),
    F("src/auth/", "session.ts", 31, 12, DIFFS[1].lines),
    F("src/auth/", "token.ts", 18, 9, B_TOKEN),
    F("src/api/", "routes.ts", 12, 8, B_ROUTES),
    F("src/api/", "guards.ts", 9, 4, B_GUARDS),
    F("src/types/", "auth.d.ts", 6, 2, B_TYPES),
    F("tests/", "auth.test.ts", 4, 3, B_TEST),
    F("", "README.md", 2, 0, B_README),
  ];

  const VIRT_FILES = [
    F("src/diff/", "VirtualList.tsx", 24, 8, B_VLIST),
    F("src/diff/", "useViewport.ts", 10, 2, B_VIEWPORT),
    F("src/diff/", "DiffPane.tsx", 4, 2, B_ROUTES),
  ];

  const SPLIT_NAMES = [
    ["src/diff/", "SplitView.tsx", 38, 6], ["src/diff/", "SplitRow.tsx", 26, 0],
    ["src/diff/", "pairLines.ts", 22, 4], ["src/diff/", "DiffPane.tsx", 18, 9],
    ["src/diff/", "gutter.ts", 14, 3], ["src/ui/", "Toolbar.tsx", 16, 2],
    ["src/ui/", "Segmented.tsx", 21, 0], ["src/state/", "viewMode.ts", 12, 4],
    ["src/state/", "prefs.ts", 9, 2], ["src/types/", "diff.d.ts", 11, 1],
    ["tests/", "split.test.ts", 17, 3], ["", "CHANGELOG.md", 6, 0],
  ];
  const SPLIT_FILES = SPLIT_NAMES.map(([dir, name, a, d], i) => F(dir, name, a, d, POOL[i % POOL.length]));

  const FLICKER_FILES = [
    F("src/ui/", "EmptyState.tsx", 7, 2, B_VIEWPORT),
    F("src/ui/", "WorktreeList.tsx", 2, 1, B_README),
  ];

  const PROTO_WORKTREES = [
    { ...WORKTREES[0], filesList: AUTH_FILES },
    { ...WORKTREES[1], filesList: VIRT_FILES },
    { ...WORKTREES[2], filesList: SPLIT_FILES },
    { ...WORKTREES[3], filesList: FLICKER_FILES },
  ];

  Object.assign(window, { PROTO_WORKTREES });
})();
