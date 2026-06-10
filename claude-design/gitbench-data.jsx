// GitBench — mock data: agentic worktree scenario + tokenized diffs
// Token classes: kw keyword · fn function · str string · num number · cm comment
// ty type · pr property · pl plain · hlA word-add highlight · hlD word-del highlight

const WORKTREES = [
  {
    id: "auth",
    name: "auth-refactor",
    branch: "agent/auth-refactor",
    task: "Refactor auth middleware to async sessions",
    add: 124, del: 56, files: 8, when: "2m",
    active: true,
  },
  {
    id: "virt",
    name: "diff-virtualization",
    branch: "agent/diff-virtualization",
    task: "Virtualize long diff lists",
    add: 38, del: 12, files: 3, when: "14m",
  },
  {
    id: "split",
    name: "split-view",
    branch: "agent/split-view",
    task: "Side-by-side diff mode",
    add: 210, del: 34, files: 12, when: "1h",
  },
  {
    id: "flicker",
    name: "empty-state-flicker",
    branch: "fix/empty-state-flicker",
    task: "Fix flash on empty worktree",
    add: 9, del: 3, files: 2, when: "3h",
  },
];

const CHANGED_FILES = [
  { dir: "src/auth/", name: "middleware.ts", add: 42, del: 18 },
  { dir: "src/auth/", name: "session.ts", add: 31, del: 12 },
  { dir: "src/auth/", name: "token.ts", add: 18, del: 9 },
  { dir: "src/api/", name: "routes.ts", add: 12, del: 8 },
  { dir: "src/api/", name: "guards.ts", add: 9, del: 4 },
  { dir: "src/types/", name: "auth.d.ts", add: 6, del: 2 },
  { dir: "tests/", name: "auth.test.ts", add: 4, del: 3 },
  { dir: "", name: "README.md", add: 2, del: 0 },
];

// ---- diff line helpers -------------------------------------------------
const ctx = (old, nw, tok) => ({ t: "ctx", old, nw, tok });
const add = (nw, tok) => ({ t: "add", nw, tok });
const del = (old, tok) => ({ t: "del", old, tok });
const hunk = (text) => ({ t: "hunk", text });

const DIFF_MIDDLEWARE = {
  dir: "src/auth/", name: "middleware.ts", add: 42, del: 18,
  lines: [
    hunk("@@ -14,9 +14,16 @@ import { verifyToken } from \"./token\""),
    ctx(14, 14, [["kw","import"],["pl"," { "],["fn","verifyToken"],["pl"," } "],["kw","from"],["pl"," "],["str","\"./token\""],["pl",";"]]),
    ctx(15, 15, [["kw","import"],["pl"," { "],["ty","AuthResult"],["pl"," } "],["kw","from"],["pl"," "],["str","\"./result\""],["pl",";"]]),
    ctx(16, 16, [["pl",""]]),
    del(17, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","authMiddleware"],["pl","("],["pl","req"],["pl",": "],["ty","Request"],["pl",")"],["pl",": "],["hlD","boolean"],["pl"," {"]]),
    del(18, [["pl","  "],["kw","const"],["pl"," token = req."],["pr","headers"],["pl","["],["str","\"x-auth\""],["pl","];"]]),
    del(19, [["pl","  "],["kw","return"],["pl"," "],["fn","verifyToken"],["pl","(token);"]]),
    add(17, [["kw","export"],["pl"," "],["hlA","async"],["pl"," "],["kw","function"],["pl"," "],["fn","authMiddleware"],["pl","("]]),
    add(18, [["pl","  req: "],["ty","Request"],["pl",","]]),
    add(19, [["pl",")"],["pl",": "],["hlA","Promise<AuthResult>"],["pl"," {"]]),
    add(20, [["pl","  "],["kw","const"],["pl"," token = "],["fn","readBearer"],["pl","(req."],["pr","headers"],["pl",");"]]),
    add(21, [["pl","  "],["kw","if"],["pl"," (!token) "],["kw","return"],["pl"," "],["ty","AuthResult"],["pl","."],["fn","missing"],["pl","();"]]),
    add(22, [["pl","  "],["kw","const"],["pl"," session = "],["kw","await"],["pl"," "],["fn","verifyToken"],["pl","(token);"]]),
    add(23, [["pl","  "],["kw","return"],["pl"," "],["ty","AuthResult"],["pl","."],["fn","ok"],["pl","(session);"]]),
    ctx(20, 24, [["pl","}"]]),
    ctx(21, 25, [["pl",""]]),
    hunk("@@ -41,6 +48,11 @@ export function readBearer(headers: Headers)"),
    ctx(41, 48, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","readBearer"],["pl","(headers: "],["ty","Headers"],["pl",") {"]]),
    add(49, [["pl","  "],["cm","// Agents often send both header styles — prefer Bearer."]]),
    add(50, [["pl","  "],["kw","const"],["pl"," raw = headers."],["fn","get"],["pl","("],["str","\"authorization\""],["pl",") ?? "],["str","\"\""],["pl",";"]]),
    add(51, [["pl","  "],["kw","if"],["pl"," (raw."],["fn","startsWith"],["pl","("],["str","\"Bearer \""],["pl",")) "],["kw","return"],["pl"," raw."],["fn","slice"],["pl","("],["num","7"],["pl",");"]]),
    ctx(42, 52, [["pl","  "],["kw","return"],["pl"," headers."],["fn","get"],["pl","("],["str","\"x-auth\""],["pl",");"]]),
    ctx(43, 53, [["pl","}"]]),
  ],
};

const DIFF_SESSION = {
  dir: "src/auth/", name: "session.ts", add: 31, del: 12,
  lines: [
    hunk("@@ -8,7 +8,12 @@ const SESSION_TTL = 60 * 30"),
    ctx(8, 8, [["kw","const"],["pl"," SESSION_TTL = "],["num","60"],["pl"," * "],["num","30"],["pl",";"]]),
    ctx(9, 9, [["pl",""]]),
    del(10, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","createSession"],["pl","(userId: "],["ty","string"],["pl",") {"]]),
    del(11, [["pl","  "],["kw","return"],["pl"," { userId, exp: "],["fn","now"],["pl","() + SESSION_TTL };"]]),
    add(10, [["kw","export"],["pl"," "],["kw","async"],["pl"," "],["kw","function"],["pl"," "],["fn","createSession"],["pl","(userId: "],["ty","string"],["pl",") {"]]),
    add(11, [["pl","  "],["kw","const"],["pl"," id = "],["kw","await"],["pl"," crypto."],["fn","randomUUID"],["pl","();"]]),
    add(12, [["pl","  "],["kw","const"],["pl"," session = { id, userId, exp: "],["fn","now"],["pl","() + SESSION_TTL };"]]),
    add(13, [["pl","  "],["kw","await"],["pl"," store."],["fn","put"],["pl","(id, session);"]]),
    add(14, [["pl","  "],["kw","return"],["pl"," session;"]]),
    ctx(12, 15, [["pl","}"]]),
    ctx(13, 16, [["pl",""]]),
    hunk("@@ -22,4 +27,7 @@ export function revoke(id: string)"),
    ctx(22, 27, [["kw","export"],["pl"," "],["kw","function"],["pl"," "],["fn","revoke"],["pl","(id: "],["ty","string"],["pl",") {"]]),
    del(23, [["pl","  cache."],["fn","delete"],["pl","(id);"]]),
    add(28, [["pl","  "],["kw","return"],["pl"," store."],["fn","delete"],["pl","(id);"]]),
    ctx(24, 29, [["pl","}"]]),
  ],
};

const DIFF_TOKEN_HEAD = {
  dir: "src/auth/", name: "token.ts", add: 18, del: 9,
  lines: [
    hunk("@@ -3,6 +3,9 @@ import { decode } from \"./jwt\""),
    ctx(3, 3, [["kw","import"],["pl"," { "],["fn","decode"],["pl"," } "],["kw","from"],["pl"," "],["str","\"./jwt\""],["pl",";"]]),
    add(4, [["kw","import"],["pl"," { "],["ty","Session"],["pl"," } "],["kw","from"],["pl"," "],["str","\"./session\""],["pl",";"]]),
    ctx(4, 5, [["pl",""]]),
  ],
};

const DIFFS = [DIFF_MIDDLEWARE, DIFF_SESSION, DIFF_TOKEN_HEAD];

Object.assign(window, { WORKTREES, CHANGED_FILES, DIFFS });
