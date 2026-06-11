/**
 * Tiny typed class-name combiner. Filters out falsy entries (false / null /
 * undefined) and joins the rest with a single space. Unifies the ad-hoc
 * `[a, b && c, className].filter(Boolean).join(' ')` idioms across the renderer.
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
