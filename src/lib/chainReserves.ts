/**
 * Chain-specific minimum balance reserves.
 * Ported verbatim from the production website's `src/utils/chainReserves.ts`.
 *
 * Some blockchains require accounts to maintain a minimum balance (XRP).
 * UTXO chains (BTC, LTC, DOGE, BCH) need miner-fee reserves for transactions.
 * This module enforces those reserves platform-wide so users can never spend
 * their last drop of gas/reserve and get stuck unable to withdraw.
 */

export const CHAIN_RESERVES: Record<string, number> = {
  xrp:  1.3,
  btc:  0.00025,
  ltc:  0.001,
  doge: 2.0,
  bch:  0.0001,
}

export function getReserveAmount(chainId: string): number {
  return CHAIN_RESERVES[chainId.toLowerCase()] || 0
}

export function hasReserveRequirement(chainId: string): boolean {
  return chainId.toLowerCase() in CHAIN_RESERVES
}

/** Maximum the user can spend/send, accounting for the reserve. */
export function getMaxSpendable(chainId: string, balance: number): number {
  return Math.max(0, balance - getReserveAmount(chainId))
}

/** Returns an error string if a proposed spend would violate the reserve, else null. */
export function checkReserveViolation(
  chainId: string,
  symbol: string,
  balance: number,
  spendAmount: number,
): string | null {
  if (!hasReserveRequirement(chainId)) return null
  const reserve = getReserveAmount(chainId)
  const remaining = balance - spendAmount
  const isUtxo = ['btc', 'ltc', 'doge', 'bch'].includes(chainId.toLowerCase())
  if (isUtxo) {
    if (spendAmount > balance - reserve) {
      return `${reserve} ${symbol} is reserved for the network miner fee. Max: ${getMaxSpendable(chainId, balance).toFixed(8)} ${symbol}`
    }
    return null
  }
  // Account-based chains (XRP): allow full close-out OR remaining >= reserve.
  if (remaining <= 0 || remaining >= reserve) return null
  return `Must keep at least ${reserve} ${symbol} as network reserve. Max: ${getMaxSpendable(chainId, balance).toFixed(6)} ${symbol}`
}
