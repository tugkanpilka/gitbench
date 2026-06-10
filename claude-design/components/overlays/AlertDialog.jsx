import React from "react";
import { Button } from "../core/Button";

/**
 * macOS alert dialog — icon, stacked vertical buttons, vibrancy surface.
 * Renders as a fixed overlay with dim backdrop unless inline.
 */
export function AlertDialog({ icon = null, title, body, confirmLabel = "Tamam", cancelLabel = "Vazgeç", destructive = true, onConfirm, onCancel, inline = false }) {
  const card = (
    <div onClick={(e) => e.stopPropagation()}
      style={{ width: 300, borderRadius: "var(--gb-radius-alert)", padding: "22px 18px 16px", textAlign: "center", fontFamily: "var(--gb-font-ui)", boxSizing: "border-box",
        background: "var(--gb-surface-alert)", backdropFilter: "var(--gb-vibrancy-alert)", WebkitBackdropFilter: "var(--gb-vibrancy-alert)",
        boxShadow: "var(--gb-shadow-alert)" }}>
      {icon && <div style={{ display: "flex", justifyContent: "center" }}>{icon}</div>}
      <div style={{ fontSize: "var(--gb-text-base)", fontWeight: 700, color: "var(--gb-text)", marginTop: icon ? 10 : 0 }}>{title}</div>
      <div style={{ fontSize: "var(--gb-text-sm)", color: "var(--gb-dim)", lineHeight: "var(--gb-leading-ui)", marginTop: 6 }}>{body}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 16 }}>
        <Button variant={destructive ? "destructive" : "primary"} onClick={onConfirm} style={{ justifyContent: "center", padding: "6.5px 0" }}>{confirmLabel}</Button>
        <Button variant="secondary" onClick={onCancel} style={{ justifyContent: "center", padding: "6.5px 0" }}>{cancelLabel}</Button>
      </div>
    </div>
  );
  if (inline) return card;
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.22)" }}>
      {card}
    </div>
  );
}
