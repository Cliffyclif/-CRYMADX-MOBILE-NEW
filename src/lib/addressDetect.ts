// Detect what chain / asset a scanned QR address belongs to.
//
// Handles two flavours of payload:
//
//  1. URI schemes per BIP-21 / EIP-681 etc. — `bitcoin:bc1...`,
//     `ethereum:0x...?value=10000000000000000`, `solana:...`, etc.
//     Includes a query string we parse for amount / memo / tag.
//
//  2. Bare addresses — we pattern-match prefixes + lengths to pick a chain.
//     EVM addresses (`0x` + 40 hex) collide across ETH/MATIC/BNB/AVAX/ARB/OP/BASE
//     because they share the same address space. We default to ETH and let
//     the Send screen offer a network picker.
//
// Ordering matters: more specific patterns first (bech32 / chain-tagged
// prefixes), more permissive patterns last (Solana base58, which would
// otherwise swallow some Bitcoin legacy addresses).

export type DetectedAddress = {
  asset: string                  // 'BTC' | 'ETH' | 'USDT' | …
  network: string                // 'bitcoin' | 'ethereum' | 'polygon' | …
  address: string                // the actual address string
  amount?: string                // pre-filled amount if URI carried one
  memo?: string                  // XLM-style memo
  tag?: string                   // XRP-style destination tag
  ambiguous?: boolean            // true if the address could belong to many networks
  raw: string                    // exact scanned text (for fallback display)
}

const URI_TO_CHAIN: Record<string, { asset: string; network: string; ambiguous?: boolean }> = {
  bitcoin:     { asset: 'BTC',  network: 'bitcoin' },
  bitcoincash: { asset: 'BCH',  network: 'bch' },
  litecoin:    { asset: 'LTC',  network: 'litecoin' },
  dogecoin:    { asset: 'DOGE', network: 'doge' },
  ethereum:    { asset: 'ETH',  network: 'ethereum', ambiguous: true },
  polygon:     { asset: 'MATIC',network: 'polygon' },
  matic:       { asset: 'MATIC',network: 'polygon' },
  binance:     { asset: 'BNB',  network: 'bsc' },
  bsc:         { asset: 'BNB',  network: 'bsc' },
  avalanche:   { asset: 'AVAX', network: 'avax' },
  avax:        { asset: 'AVAX', network: 'avax' },
  arbitrum:    { asset: 'ETH',  network: 'arb' },
  optimism:    { asset: 'ETH',  network: 'op' },
  base:        { asset: 'ETH',  network: 'base' },
  solana:      { asset: 'SOL',  network: 'solana' },
  tron:        { asset: 'TRX',  network: 'tron' },
  trx:         { asset: 'TRX',  network: 'tron' },
  ripple:      { asset: 'XRP',  network: 'xrpl' },
  xrp:         { asset: 'XRP',  network: 'xrpl' },
  xrpl:        { asset: 'XRP',  network: 'xrpl' },
  stellar:     { asset: 'XLM',  network: 'stellar' },
  xlm:         { asset: 'XLM',  network: 'stellar' },
  ton:         { asset: 'TON',  network: 'ton' },
}

// EIP-681 chain id → CrymadX chain code. Only the EVM networks we actually
// support — anything else falls back to plain ETH.
const EIP681_CHAIN_TO_NETWORK: Record<string, { network: string; asset: string }> = {
  '1':     { network: 'ethereum', asset: 'ETH' },
  '137':   { network: 'polygon',  asset: 'MATIC' },
  '56':    { network: 'bsc',      asset: 'BNB' },
  '43114': { network: 'avax',     asset: 'AVAX' },
  '42161': { network: 'arb',      asset: 'ETH' },
  '10':    { network: 'op',       asset: 'ETH' },
  '8453':  { network: 'base',     asset: 'ETH' },
}

function tryUri(input: string): DetectedAddress | null {
  // URI form: scheme:target[?query]
  // scheme is letters; target may include @<chainId> per EIP-681 and /<funcName>
  const m = input.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):([^?#\s]+)(?:\?(.*))?$/)
  if (!m) return null
  const scheme = m[1].toLowerCase()
  let target = m[2]
  const queryStr = m[3] ?? ''
  const params = new URLSearchParams(queryStr)

  // EIP-681 may include @chainId and /transfer
  let chainOverride: typeof EIP681_CHAIN_TO_NETWORK[string] | null = null
  if (scheme === 'ethereum') {
    const chainMatch = target.match(/^([^@/]+)(?:@([0-9]+))?(?:\/([a-zA-Z0-9_]+))?/)
    if (chainMatch) {
      const [, addr, chainId, fnName] = chainMatch
      target = addr
      if (chainId && EIP681_CHAIN_TO_NETWORK[chainId]) chainOverride = EIP681_CHAIN_TO_NETWORK[chainId]
      // ERC-20 transfer: real recipient is in `address` query param, target was the token contract
      if (fnName === 'transfer' && params.get('address')) target = params.get('address')!
    }
  }

  const cfg = URI_TO_CHAIN[scheme]
  if (!cfg) return null
  return {
    asset: chainOverride?.asset ?? cfg.asset,
    network: chainOverride?.network ?? cfg.network,
    address: target,
    amount: params.get('amount') ?? params.get('value') ?? undefined,
    memo: params.get('memo') ?? undefined,
    tag: params.get('dt') ?? params.get('tag') ?? undefined,
    ambiguous: chainOverride ? false : cfg.ambiguous,
    raw: input,
  }
}

const PATTERNS: Array<{
  test: RegExp
  asset: string
  network: string
  ambiguous?: boolean
}> = [
  // bech32 first — explicit human-readable prefix
  { test: /^bc1[a-z0-9]{6,87}$/i,                       asset: 'BTC',  network: 'bitcoin' },
  { test: /^ltc1[a-z0-9]{6,87}$/i,                      asset: 'LTC',  network: 'litecoin' },
  // Bitcoin Cash with explicit prefix
  { test: /^bitcoincash:q[a-z0-9]{38,}$/i,              asset: 'BCH',  network: 'bch' },
  { test: /^bitcoincash:p[a-z0-9]{38,}$/i,              asset: 'BCH',  network: 'bch' },
  // Litecoin legacy (L or M, 26-34 chars)
  { test: /^[LM][a-km-zA-HJ-NP-Z1-9]{25,34}$/,           asset: 'LTC',  network: 'litecoin' },
  // Dogecoin legacy (D, 34 chars)
  { test: /^D[A-HJ-NP-Z1-9][a-km-zA-HJ-NP-Z1-9]{32}$/,   asset: 'DOGE', network: 'doge' },
  // Tron — T + 33 base58 chars, exactly 34 total
  { test: /^T[a-km-zA-HJ-NP-Z1-9]{33}$/,                 asset: 'TRX',  network: 'tron' },
  // XRP / Ripple — r + 24-34 base58
  { test: /^r[a-km-zA-HJ-NP-Z1-9]{24,34}$/,              asset: 'XRP',  network: 'xrpl' },
  // Stellar (G + 55 base32) – uppercase letters/digits only
  { test: /^G[A-Z2-7]{55}$/,                             asset: 'XLM',  network: 'stellar' },
  // EVM (0x + 40 hex) — could be many networks. ETH default, flagged ambiguous.
  { test: /^0x[a-fA-F0-9]{40}$/,                         asset: 'ETH',  network: 'ethereum', ambiguous: true },
  // TON — start with EQ / UQ / kQ
  { test: /^(EQ|UQ|kQ)[A-Za-z0-9_-]{46,49}$/,            asset: 'TON',  network: 'ton' },
  // Bitcoin legacy (1 or 3, 26-34 chars). Comes after specific-prefix chains
  // because base58 patterns overlap.
  { test: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,           asset: 'BTC',  network: 'bitcoin' },
  // Bitcoin Cash bare q-prefix (no scheme)
  { test: /^q[a-z0-9]{38,}$/,                            asset: 'BCH',  network: 'bch' },
  // Solana — 32-44 base58 chars. Last because it's the most permissive.
  // Kept tighter (32-44) to avoid catching short Bitcoin addresses.
  { test: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,               asset: 'SOL',  network: 'solana' },
]

export function detectAddress(scanned: string): DetectedAddress | null {
  const trimmed = scanned.trim()
  if (!trimmed) return null

  // 1. URI form
  const uri = tryUri(trimmed)
  if (uri) return uri

  // 2. Bare address pattern matching
  for (const p of PATTERNS) {
    if (p.test.test(trimmed)) {
      return { asset: p.asset, network: p.network, address: trimmed, ambiguous: p.ambiguous, raw: trimmed }
    }
  }
  return null
}

// Convenience: friendly chain label for the toast/preview shown to the user.
export function chainLabel(d: DetectedAddress): string {
  const map: Record<string, string> = {
    bitcoin: 'Bitcoin', bch: 'Bitcoin Cash', litecoin: 'Litecoin', doge: 'Dogecoin',
    ethereum: 'Ethereum', polygon: 'Polygon', bsc: 'BNB Chain', avax: 'Avalanche',
    arb: 'Arbitrum', op: 'Optimism', base: 'Base',
    solana: 'Solana', tron: 'Tron', xrpl: 'XRP Ledger', stellar: 'Stellar', ton: 'TON',
  }
  return map[d.network] ?? d.network.toUpperCase()
}
