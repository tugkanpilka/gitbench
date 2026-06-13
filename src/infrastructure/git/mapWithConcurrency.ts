// Runs `task` over `items` in fixed-size batches so at most `concurrency` git
// processes are ever in flight at once. Results preserve input order.
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let offset = 0; offset < items.length; offset += concurrency) {
    const batch = items.slice(offset, offset + concurrency);
    results.push(...(await Promise.all(batch.map((item, i) => task(item, offset + i)))));
  }
  return results;
}
