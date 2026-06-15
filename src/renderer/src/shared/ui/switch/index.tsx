import { Children, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

type MatchProps = { when: boolean; children: ReactNode };

// A labelled branch for <Switch>. On its own it simply renders its children; the
// selection is owned by the enclosing <Switch>.
export function Match({ children }: MatchProps) {
  return <>{children}</>;
}

// Renders only the first <Match> whose `when` is true (first-match-wins), so sibling
// branches need no mutual-exclusion guards. Make the last branch `when={true}` for a
// default. See agent_docs/architecture.md → "Renderer: declarative rendering".
export function Switch({ children }: { children: ReactNode }) {
  const branches = Children.toArray(children).filter(isValidElement) as ReactElement<MatchProps>[];
  return branches.find((branch) => branch.props.when) ?? null;
}
