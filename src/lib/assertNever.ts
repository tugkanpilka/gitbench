/**
 * Compile-time exhaustiveness guard for discriminated unions.
 * Used to consume a closed union without `switch`: a chain of guard clauses
 * ends in `return assertNever(x)`. If a new variant is added and a branch is
 * forgotten, `x` is no longer `never` and this line fails to compile.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}
