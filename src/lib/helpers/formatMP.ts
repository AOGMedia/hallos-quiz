/**
 * Morgan Point amount formatting.
 *
 * The backend stores money columns as Postgres DECIMAL(10,2), and Sequelize
 * hands those back as **strings** ("100.00"), even though our API types
 * declare them as `number`. That mismatch is why amounts rendered
 * inconsistently: calling `.toLocaleString()` on a string hits
 * String.prototype.toLocaleString, which is a no-op returning "100.00",
 * while the same call on a real number returns "100". The same tournament
 * could therefore show "100.00 MP" in one tile and "100 MP" in the next.
 *
 * Always route MP amounts through these helpers rather than calling
 * .toLocaleString() directly on an API value.
 */

/** Coerce an API money value (string | number | null) to a finite number. */
export function toAmount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format an MP amount for display — thousands separators, and decimals only
 * when the value actually has a fractional part (so 100.00 renders as "100"
 * but 12.50 still renders as "12.5").
 */
export function formatMP(value: unknown): string {
  const n = toAmount(value);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** `formatMP` with the unit appended — e.g. "1,250 MP". */
export function formatMPWithUnit(value: unknown): string {
  return `${formatMP(value)} MP`;
}
