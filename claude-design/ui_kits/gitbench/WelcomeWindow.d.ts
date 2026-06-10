/**
 * GitBench welcome window: brand + "Depo Aç…/Klonla…" actions on the left,
 * vibrancy recents list on the right. Shown at launch — the app has no auth.
 * @startingPoint section="GitBench" subtitle="Welcome penceresi — proje seçici" viewport="820x510"
 */
export interface WelcomeWindowProps {
  /** Called with the picked recent project ({ id, name, path, wts, when }). */
  onOpen?: (project: { id: string; name: string; path: string; wts: number; when: string }) => void;
}
