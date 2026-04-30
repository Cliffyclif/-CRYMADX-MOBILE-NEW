/**
 * Number formatters used across the app.
 *
 * Hard rule: NEVER display more than 2 decimals to the user.
 *   - Big values:   12,345.67
 *   - Small values: 0.50
 *   - Sub-cent crypto: "<0.01" (e.g. 0.000001 BTC) so the user knows it's not literally zero
 */

const NUM = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const NUM_NO_GROUP = new Intl.NumberFormat('en-US', { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 })

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0
  if (typeof v === 'number') return isFinite(v) ? v : 0
  const s = String(v).replace(/[, ]/g, '').trim()
  if (!s) return 0
  const n = parseFloat(s)
  return isFinite(n) ? n : 0
}

/** Format any quantity (token amount or fiat) with max 2 decimals. */
export function fmt(value: string | number | null | undefined, opts?: { grouping?: boolean }): string {
  const n = toNum(value)
  if (n === 0) return '0.00'
  // Sub-cent values round to "0.00" — show "<0.01" instead so user knows it's not literally zero.
  if (Math.abs(n) < 0.005) return n > 0 ? '<0.01' : '>-0.01'
  return (opts?.grouping === false ? NUM_NO_GROUP : NUM).format(n)
}

/** Format a USD value (always 2 decimals, with grouping). */
export function fmtUsd(value: string | number | null | undefined): string {
  return fmt(value)
}

/** Format a percent value (max 2 decimals, signed). */
export function fmtPct(value: string | number | null | undefined): string {
  const n = toNum(value)
  if (n === 0) return '0.00'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}`
}

/** Format a token amount — same 2-decimal cap. */
export function fmtAmt(value: string | number | null | undefined): string {
  return fmt(value)
}
