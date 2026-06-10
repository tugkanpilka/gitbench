// GitBench — theme token sets for the 3 visual directions
// Each direction defines full UI + diff + syntax colors.

const THEMES = {
  // A — Graphite: Zed-ruhlu nötr koyu, klasik yeşil/kırmızı diff zeminleri
  graphite: {
    label: "Graphite",
    ui: "'SF Pro Text', -apple-system, system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    bg: "#16181d", panel: "#1b1e24", sidebar: "#13151a",
    border: "#262a32", borderSoft: "#20242b",
    text: "#d7dae0", dim: "#8b919d", faint: "#5c6270",
    accent: "#5aa0f2", accentBg: "rgba(90,160,242,.12)",
    addBg: "rgba(63,185,80,.13)", addGutter: "rgba(63,185,80,.22)", addText: "#4cc06a", addWord: "rgba(63,185,80,.34)",
    delBg: "rgba(248,81,73,.11)", delGutter: "rgba(248,81,73,.20)", delText: "#f07a74", delWord: "rgba(248,81,73,.32)",
    hunkBg: "#1d2230", hunkText: "#7a8db8",
    gutterText: "#4a505c", lineHover: "rgba(255,255,255,.02)",
    syn: { kw: "#c792ea", fn: "#82aaff", str: "#c3e88d", num: "#f78c6c", cm: "#5c6370", ty: "#ffcb6b", pr: "#80cbc4", pl: "#c5cad3" },
    badgeBg: "#21252d",
    chrome: "#1b1e24",
  },
  // B — Ink: Linear-ruhlu mavi-mor koyu, gutter-bar ağırlıklı sakin diff
  ink: {
    label: "Ink",
    ui: "'SF Pro Text', -apple-system, system-ui, sans-serif",
    mono: "'IBM Plex Mono', monospace",
    bg: "#101117", panel: "#15161e", sidebar: "#0d0e13",
    border: "#23242f", borderSoft: "#1c1d27",
    text: "#dcdde4", dim: "#878a99", faint: "#565a6b",
    accent: "#7b7ff2", accentBg: "rgba(123,127,242,.13)",
    addBg: "rgba(94,184,138,.08)", addGutter: "#3f9d6e", addText: "#5eb88a", addWord: "rgba(94,184,138,.28)",
    delBg: "rgba(229,107,116,.07)", delGutter: "#c25560", delText: "#e56b74", delWord: "rgba(229,107,116,.26)",
    hunkBg: "#181a26", hunkText: "#6f74a8",
    gutterText: "#43465a", lineHover: "rgba(255,255,255,.02)",
    syn: { kw: "#9d8cff", fn: "#7eb6ff", str: "#96d0a0", num: "#e8a07e", cm: "#525669", ty: "#e2c08d", pr: "#7fd4d0", pl: "#c9cad4" },
    badgeBg: "#1c1d28",
    chrome: "#15161e",
    gutterBars: true,
  },
  // C — Paper: sıcak tonlu aydınlık, baskı hissi, yüksek kontrast tipografi
  paper: {
    label: "Paper",
    ui: "'SF Pro Text', -apple-system, system-ui, sans-serif",
    mono: "'Geist Mono', monospace",
    bg: "#f7f6f3", panel: "#fdfcfa", sidebar: "#f1efeb",
    border: "#e3e0d9", borderSoft: "#ebe8e2",
    text: "#2b2a27", dim: "#76736b", faint: "#a3a097",
    accent: "#2a6fdb", accentBg: "rgba(42,111,219,.09)",
    addBg: "#e9f4ea", addGutter: "#cfe6d2", addText: "#1f8a3d", addWord: "#c8e6cc",
    delBg: "#fceeed", delGutter: "#f3d4d2", delText: "#c4423a", delWord: "#f5d0cd",
    hunkBg: "#eef0f6", hunkText: "#5a6a96",
    gutterText: "#b5b2a8", lineHover: "rgba(0,0,0,.02)",
    syn: { kw: "#9333b4", fn: "#1d62c4", str: "#2e7d3a", num: "#b35a1f", cm: "#9a978e", ty: "#9a6700", pr: "#0f7d72", pl: "#33322e" },
    badgeBg: "#eceae4",
    chrome: "#f1efeb",
    light: true,
  },
};

Object.assign(window, { THEMES });
