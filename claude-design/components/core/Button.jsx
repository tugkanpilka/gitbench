import React from "react";

/** GitBench button — native macOS feel, token-driven. */
export function Button({ variant = "plain", icon = null, children, onClick, style }) {
  const [hov, setHov] = React.useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: variant === "plain" ? "flex-start" : "center",
    gap: 10, padding: "8px 12px", borderRadius: "var(--gb-radius-control)", cursor: "default",
    fontFamily: "var(--gb-font-ui)", fontSize: "var(--gb-text-md)", fontWeight: 500,
    transition: "background var(--gb-dur-quick) var(--gb-ease)", userSelect: "none",
    border: "none", boxSizing: "border-box",
  };
  const variants = {
    primary: { background: "var(--gb-accent)", color: "#fff", borderRadius: "var(--gb-radius-control)", boxShadow: "0 1px 2.5px rgba(0,0,0,.2)", filter: hov ? "brightness(1.08)" : "none" },
    plain: { background: hov ? "var(--gb-hover)" : "transparent", color: "var(--gb-text)", borderRadius: "var(--gb-radius-control)" },
    secondary: { background: hov ? "var(--gb-row-sel)" : "var(--gb-control-bg)", color: "var(--gb-text)" },
    destructive: { background: "var(--gb-destructive)", color: "#fff", fontWeight: 600, boxShadow: "0 1px 2.5px rgba(0,0,0,.2)", filter: hov ? "brightness(1.08)" : "none" },
  };
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon && <span style={{ width: 18, textAlign: "center", fontSize: 14, color: variant === "plain" ? "var(--gb-accent)" : "inherit", flex: "none" }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
