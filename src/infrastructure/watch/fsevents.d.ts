declare module 'fsevents' {
  export function watch(
    path: string,
    handler: (path: string, flags: number, id: string) => void
  ): () => Promise<void>;
}
