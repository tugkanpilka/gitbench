// GitBench prototype — welcome window (project picker), context menu, confirm dialog
// Depends on MAC_THEMES tokens (t) passed in as props.

const GB_PROJECTS = [
  { id: "gitbench", name: "gitbench", path: "~/dev/gitbench", wts: 4, when: "2 dk önce" },
  { id: "storefront", name: "acme-storefront", path: "~/dev/acme-storefront", wts: 2, when: "dün" },
  { id: "infra", name: "infra-tools", path: "~/work/infra-tools", wts: 1, when: "3 gün önce" },
];

function GBAppIcon({ size }) {
  const s = size || 96;
  return (
    <svg width={s} height={s} viewBox="0 0 96 96">
      <defs>
        <linearGradient id="gbicon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c4350"></stop>
          <stop offset="1" stopColor="#1c2129"></stop>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="84" height="84" rx="19" fill="url(#gbicon)"></rect>
      <rect x="6" y="6" width="84" height="84" rx="19" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1"></rect>
      <line x1="34" y1="26" x2="34" y2="70" stroke="#8b95a5" strokeWidth="4.5" strokeLinecap="round"></line>
      <circle cx="34" cy="26" r="7" fill="#28c840"></circle>
      <circle cx="34" cy="70" r="7" fill="#8b95a5"></circle>
      <path d="M34 44 C34 56 58 48 58 60" fill="none" stroke="#ff5f57" strokeWidth="4.5" strokeLinecap="round"></path>
      <circle cx="58" cy="66" r="7" fill="#ff5f57"></circle>
    </svg>
  );
}

function PWelcomeButton({ t, label, icon, primary, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "default",
        background: primary ? t.accent : hov ? (t.light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.07)") : "transparent",
        transition: "background .12s ease" }}>
      <span style={{ width: 18, textAlign: "center", fontSize: 14, color: primary ? "#fff" : t.accent }}>{icon}</span>
      <span style={{ fontSize: 12.5, fontWeight: 500, color: primary ? "#fff" : t.text }}>{label}</span>
    </div>
  );
}

function PRecentRow({ t, p, onOpen }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={() => onOpen(p)} onDoubleClick={() => onOpen(p)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 8, cursor: "default",
        background: hov ? (t.light ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.06)") : "transparent", transition: "background .12s ease" }}>
      <svg width="30" height="30" viewBox="0 0 96 96" style={{ flex: "none" }}>
        <rect x="6" y="6" width="84" height="84" rx="22" fill={t.light ? "#e7e9ee" : "#3a3d46"}></rect>
        <line x1="36" y1="28" x2="36" y2="68" stroke={t.dim} strokeWidth="6" strokeLinecap="round"></line>
        <circle cx="36" cy="28" r="9" fill="#28c840"></circle>
        <path d="M36 46 C36 58 60 50 60 62" fill="none" stroke="#ff5f57" strokeWidth="6" strokeLinecap="round"></path>
        <circle cx="60" cy="66" r="9" fill="#ff5f57"></circle>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{p.name}</span>
        <span style={{ fontSize: 11, color: t.faint, fontFamily: t.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1, flex: "none" }}>
        <span style={{ fontSize: 10.5, color: t.dim }}>{p.wts} worktree</span>
        <span style={{ fontSize: 10.5, color: t.faint }}>{p.when}</span>
      </div>
    </div>
  );
}

function PWelcome({ t, light, onOpen }) {
  return (
    <div data-screen-label="Welcome" style={{ width: 780, maxWidth: "calc(100% - 48px)", height: 470, borderRadius: 12, overflow: "hidden", display: "flex", fontFamily: t.ui,
      boxShadow: "0 30px 70px rgba(0,0,0,.45), 0 0 0 .5px rgba(0,0,0,.3)", outline: light ? "none" : "1px solid rgba(255,255,255,.12)", outlineOffset: -1 }}>
      {/* left: brand + actions */}
      <div style={{ flex: "0 0 47%", background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, position: "relative", padding: "0 36px" }}>
        <div style={{ position: "absolute", top: 18, left: 16, display: "flex", gap: 8 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: 99, background: c, boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.15)" }}></span>
          ))}
        </div>
        <GBAppIcon size={104}></GBAppIcon>
        <div style={{ fontSize: 25, fontWeight: 700, color: t.text, letterSpacing: "-0.02em", marginTop: 14 }}>GitBench</div>
        <div style={{ fontSize: 11.5, color: t.faint, marginTop: 3 }}>Sürüm 0.1.0 (önizleme)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 26, alignSelf: "stretch" }}>
          <PWelcomeButton t={t} primary icon="＋" label="Depo Aç…" onClick={() => onOpen(GB_PROJECTS[0])}></PWelcomeButton>
          <PWelcomeButton t={t} icon="⌘" label="Depo Klonla…" onClick={() => onOpen(GB_PROJECTS[0])}></PWelcomeButton>
        </div>
      </div>
      {/* right: recents */}
      <div style={{ flex: 1, minWidth: 0, background: t.sidebar, backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)", borderLeft: `1px solid ${t.light ? "rgba(0,0,0,.10)" : "rgba(255,255,255,.07)"}`, display: "flex", flexDirection: "column", padding: "16px 10px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: t.faint, letterSpacing: ".02em", textTransform: "uppercase", padding: "0 12px 8px" }}>Son Açılanlar</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }}>
          {GB_PROJECTS.map((p) => <PRecentRow key={p.id} t={t} p={p} onOpen={onOpen}></PRecentRow>)}
        </div>
        <div style={{ marginTop: "auto", padding: "12px 12px 4px", fontSize: 11, color: t.faint, textAlign: "center" }}>
          ya da bir klasörü buraya sürükle
        </div>
      </div>
    </div>
  );
}

// ---- context menu ----------------------------------------------------------

function PMenu({ t, x, y, items, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
      <div style={{ position: "absolute", left: Math.min(x, window.innerWidth - 230), top: Math.min(y, window.innerHeight - items.length * 30 - 20), minWidth: 208,
        background: t.light ? "rgba(248,248,250,.86)" : "rgba(46,47,53,.86)", backdropFilter: "blur(28px) saturate(1.6)", WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        borderRadius: 9, padding: 4.5, boxShadow: "0 12px 36px rgba(0,0,0,.32), 0 0 0 .5px rgba(0,0,0,.25)", outline: t.light ? "none" : "1px solid rgba(255,255,255,.10)", outlineOffset: -1, fontFamily: t.ui }}>
        {items.map((it, i) => it === "—" ? (
          <div key={i} style={{ height: 1, background: t.light ? "rgba(0,0,0,.09)" : "rgba(255,255,255,.09)", margin: "4px 9px" }}></div>
        ) : (
          <PMenuItem key={i} t={t} it={it} onClose={onClose}></PMenuItem>
        ))}
      </div>
    </div>
  );
}

function PMenuItem({ t, it, onClose }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={(e) => { e.stopPropagation(); onClose(); it.onClick && it.onClick(); }} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "4.5px 9px", borderRadius: 5.5, cursor: "default",
        background: hov ? t.accent : "transparent",
        color: hov ? "#fff" : it.destructive ? "#e5484d" : t.text, fontSize: 12.5, transition: "background .08s ease" }}>
      <span style={{ flex: 1 }}>{it.label}</span>
      {it.hint && <span style={{ fontSize: 11, color: hov ? "rgba(255,255,255,.7)" : t.faint }}>{it.hint}</span>}
    </div>
  );
}

// ---- confirm dialog (macOS alert) ------------------------------------------

function PConfirm({ t, light, title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.22)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 300, borderRadius: 13, padding: "22px 18px 16px", textAlign: "center", fontFamily: t.ui,
        background: light ? "rgba(248,248,250,.92)" : "rgba(46,47,53,.92)", backdropFilter: "blur(34px) saturate(1.6)", WebkitBackdropFilter: "blur(34px) saturate(1.6)",
        boxShadow: "0 24px 60px rgba(0,0,0,.4), 0 0 0 .5px rgba(0,0,0,.28)", outline: light ? "none" : "1px solid rgba(255,255,255,.10)", outlineOffset: -1 }}>
        <GBAppIcon size={52}></GBAppIcon>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginTop: 10 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: t.dim, lineHeight: 1.45, marginTop: 6 }}>{body}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 16 }}>
          <div onClick={onConfirm} style={{ padding: "6.5px 0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, color: "#fff", background: "#e5484d", cursor: "default", boxShadow: "0 1px 2.5px rgba(0,0,0,.2)" }}>{confirmLabel}</div>
          <div onClick={onCancel} style={{ padding: "6.5px 0", borderRadius: 7, fontSize: 12.5, fontWeight: 500, color: t.text, background: light ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.09)", cursor: "default" }}>Vazgeç</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GB_PROJECTS, PWelcome, PMenu, PConfirm, GBAppIcon });
