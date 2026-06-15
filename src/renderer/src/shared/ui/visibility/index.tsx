import type { ReactNode } from 'react';

// Shows or hides a single subtree — the declarative replacement for `cond && <X />`.
// See agent_docs/architecture.md → "Renderer: declarative rendering".
export function Visibility({ isVisible, children }: { isVisible: boolean; children: ReactNode }) {
  return isVisible ? <>{children}</> : null;
}
