/**
 * API CLIENT — wired to live CrymadX backend
 * --------------------------------------------
 * One fetcher for every screen. Three integration layers:
 *
 *   1. REAL_PATH_OVERRIDES   — endpoint id → real backend path
 *   2. METHOD_OVERRIDES      — endpoint id → method (e.g. PATCH→PUT)
 *   3. REQUEST_ADAPTERS      — body reshaper before send
 *   4. RESPONSE_ADAPTERS     — payload reshaper after receive
 *   5. FALLBACK_HANDLERS     — local handler when backend has no equivalent
 *                              (hardcoded data / localStorage / Binance public API)
 *
 * Toggle VITE_USE_MOCK=true to bypass everything and use the in-process mock
 * layer instead.
 */
import { ENDPOINTS, endpointPath, type EndpointId } from './endpoints'
import { dispatchMock, ApiError } from '../mock/handlers'
import { fmt, fmtPct } from '../lib/format'
import { allAssets } from '../config/assets'

type CallOpts = {
  pathParams?: Record<string, string | number>
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  token?: string
}

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787/api/v2').replace(/\/$/, '')

const TOKEN_KEY = 'crymadx.auth.token'
const REFRESH_TOKEN_KEY = 'crymadx.auth.refresh'

export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
export function getRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}
export function setRefreshToken(t: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (t) localStorage.setItem(REFRESH_TOKEN_KEY, t)
  else localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// ============================================================================
// PATH OVERRIDES — every entry below is taken from a real call in the
// production website's src/services/*.ts. No guessing.
// ============================================================================
const REAL_PATH_OVERRIDES: Partial<Record<EndpointId, string>> = {
  // ---- Auth (authService.ts) ----
  'api.auth.verify-2fa':        '/auth/complete-2fa',
  'api.security.password.change':    '/auth/change-password', // POST

  // ---- Wallet / Balance (balanceService.ts) ----
  // 'api.wallet.balances.list' → composite handler (balances + /prices)
  'api.wallet.balance.get':     '/balance/balances/:asset',
  'api.wallet.withdraw.create': '/balance/withdraw',
  'api.wallet.withdraw.fee':    '/balance/withdraw/fee',          // also overridden in FALLBACK to translate query
  // Convert via swap-service (swapService.ts)
  'api.wallet.convert.quote':   '/swap/estimate',
  'api.wallet.convert.execute': '/swap/create',

  // ---- Transactions (balanceService.getTransactions) ----
  'api.tx.list':                '/balance/transactions',         // also handled by FALLBACK to normalize shape
  'api.tx.get':                 '/balance/transactions/:txId',

  // ---- Markets (Binance public proxy) ----
  'api.markets.list':           '/binance/ticker/24hr',
  'api.markets.pair':           '/binance/ticker/24hr',
  'api.markets.orderbook':      '/binance/depth',

  // ---- Trading (spot-trading-service)  ----
  'api.trading.order.create':   '/spot/orders',
  'api.trading.order.cancel':   '/spot/orders/:orderId',
  'api.trading.orders.open':    '/spot/orders',
  'api.trading.orders.history': '/spot/orders',
  'api.trading.trades':         '/spot/trades',
  'api.trading.trade':          '/spot/trades/:tradeId',

  // ---- Earn — Staking (stakingService.ts) ----
  'api.earn.staking.products':  '/staking/options',
  'api.earn.staking.stake':     '/staking/stake',
  'api.earn.staking.unstake':   '/staking/unstake',
  'api.earn.staking.positions': '/staking/positions',

  // ---- Earn — Vault / Savings (vaultService.ts; main UI surfaces both as /vault) ----
  'api.earn.savings.products':  '/vault/positions',              // serves as "products + my positions"
  'api.earn.savings.deposit':   '/vault/create',
  'api.earn.savings.positions': '/vault/positions',
  'api.earn.vault.list':        '/vault/positions',

  // ---- Earn — AutoInvest (autoInvestService.ts) ----
  'api.earn.autoinvest.list':   '/autoinvest/plans',
  'api.earn.autoinvest.create': '/autoinvest/plans',
  'api.earn.autoinvest.update': '/autoinvest/plans/:id',

  // ---- Fiat (fiatService.ts — Guardarian) ----
  'api.fiat.quote':             '/fiat/buy/estimate',
  'api.fiat.order.create':      '/fiat/buy/create',
  'api.fiat.order.status':      '/fiat/order/:orderId',

  // ---- KYC (kyc-service via gateway /api/kyc) ----
  'api.user.kyc.status':        '/kyc/status',
  'api.user.kyc.start':         '/kyc/initiate',

  // ---- Security (authService 2fa.* + userService sessions) ----
  'api.security.summary':            '/security/summary',
  'api.security.2fa.enable':         '/2fa/enable',
  'api.security.2fa.disable':        '/2fa/disable',
  'api.security.backup-codes':       '/2fa/backup-codes',
  'api.security.pin.change':         '/security/pin',
  'api.security.sessions.list':      '/user/sessions',           // userService.getSessions
  'api.security.sessions.revoke':    '/user/sessions/:sessionId',// userService.revokeSession

  // ---- Settings — API keys (apiKeyService.ts) ----
  'api.settings.api-keys.list':      '/user/api-keys',
  'api.settings.api-keys.create':    '/user/api-keys',
  'api.settings.api-keys.delete':    '/user/api-keys/:keyId',
  // Notification settings + alerts — likely the same notification-service mount
  'api.settings.notifications.get':    '/notifications/settings',
  'api.settings.notifications.update': '/notifications/settings',
  'api.settings.alerts.list':   '/notifications/alerts',
  'api.settings.alerts.create': '/notifications/alerts',
  'api.settings.alerts.update': '/notifications/alerts/:alertId',
  'api.settings.alerts.delete': '/notifications/alerts/:alertId',

  // ---- Engagement (rewardsService.ts, referralService.ts, notificationService.ts) ----
  'api.rewards.summary':        '/rewards/summary',
  'api.rewards.tiers':          '/rewards/tiers',
  // No /badges, no /tasks endpoint exists in production — handled by fallback returning empty.
  'api.referral.summary':       '/referral/info',
  'api.notifications.list':     '/notifications',
  // PATCH /notifications/read-all (NOT POST /read)
  'api.notifications.read':     '/notifications/read-all',
  'api.announcements.list':     '/admin/announcements/public',

  // ---- P2P (p2pService.ts) ----
  // Mobile uses Bybit/Binance terms: an "offer" = a listing, an "order" = a trade.
  // Production uses different terms: "order" = listing, "trade" = trade transaction.
  // Map mobile concepts to production paths.
  'api.p2p.offers.list':        '/p2p/orders',
  'api.p2p.offer.get':          '/p2p/orders/:offerId',
  'api.p2p.order.create':       '/p2p/trades',
  'api.p2p.order.get':          '/p2p/trades/:orderId',
  'api.p2p.order.markpaid':     '/p2p/trades/:orderId/confirm-payment',
  'api.p2p.order.release':      '/p2p/trades/:orderId/release',
  // No /dispute endpoint in production; leave to fall through to original path

  // ---- AI Chat (aiChatService.ts) — under /api/ai/web ----
  'api.ai.chat.send':           '/ai/web/conversations',         // legacy fallback path; real send via AIChat.tsx SSE
  'api.ai.chat.history':        '/ai/web/conversations',
  'api.ai.chat.conversation':   '/ai/web/conversations/:conversationId',
  'api.ai.settings.get':        '/ai/web/prefs',
  'api.ai.settings.update':     '/ai/web/prefs',
  'api.ai.memory.list':         '/ai/web/memory',
  'api.ai.memory.delete':       '/ai/web/memory/:itemId',
  'api.ai.memory.clear':        '/ai/web/memory',
  'api.ai.share.create':        '/ai/web/conversations/:conversationId/share',
  'api.ai.share.get':           '/ai/web-public/shares/:shareId',
  'api.ai.share.revoke':        '/ai/web/conversations/:conversationId/share',

  // ---- Card (cardService.ts) ----
  'api.card.get':               '/card/info',
  'api.card.apply':             '/card/create',
  'api.card.topup':             '/card/fund',
  'api.card.freeze':            '/card/freeze',
  // No /card/settings PATCH on production — fallback handler returns no-op
  'api.card.transactions':      '/card/transactions',

  // ---- NFT (nftService.ts) ----
  'api.nft.gallery':            '/nft/owned',
  'api.nft.market':             '/nft/marketplace',
  // nft.detail handled in FALLBACK_HANDLERS — needs :contract/:tokenId
  // nft.send (transfer) — backend has no transfer; fallback returns NOT_SUPPORTED

  // ---- Support (supportService.ts) ----
  'api.support.tickets.list':   '/support/tickets',
  'api.support.tickets.create': '/support/tickets',
  'api.support.tickets.detail': '/support/tickets/:ticketId',
  // Reply: POST /support/tickets/:id/reply (not /messages)
  'api.support.tickets.reply':  '/support/tickets/:ticketId/reply',
  // /support/articles is gateway-mounted; backend may not have it but path is consistent
  'api.support.articles':       '/support/articles',
  'api.support.article':        '/support/articles/:slug',
}

// ============================================================================
// METHOD OVERRIDES — match the verbs the production website uses.
// ============================================================================
const METHOD_OVERRIDES: Partial<Record<EndpointId, string>> = {
  // userService.updateProfile uses PUT
  'api.user.profile.update':   'PUT',
  // notificationService.markAllAsRead uses PATCH
  'api.notifications.read':    'PATCH',
}

// ============================================================================
// HARDCODED NETWORK LIST (no backend equivalent)
// ============================================================================
const NETWORKS: Record<string, Array<{ id: string; name: string; description: string; recommended?: boolean }>> = {
  USDT: [
    { id: 'TRC20',     name: 'TRON',         description: 'Fast · Low fee',     recommended: true },
    { id: 'ERC20',     name: 'Ethereum',     description: 'Slow · High fee' },
    { id: 'BEP20',     name: 'BNB Chain',    description: 'Fast · Low fee' },
    { id: 'POLYGON',   name: 'Polygon',      description: 'Fast · Very low' },
    { id: 'SOLANA',    name: 'Solana (SPL)', description: 'Instant' },
    { id: 'ARBITRUM',  name: 'Arbitrum One', description: 'Fast · Low' },
  ],
  USDC: [
    { id: 'ERC20',   name: 'Ethereum',     description: 'Standard',         recommended: true },
    { id: 'POLYGON', name: 'Polygon',      description: 'Fast · Very low' },
    { id: 'BASE',    name: 'Base',         description: 'Fast · Low' },
    { id: 'SOLANA',  name: 'Solana (SPL)', description: 'Instant' },
    { id: 'ARBITRUM',name: 'Arbitrum One', description: 'Fast · Low' },
  ],
  BTC: [{ id: 'BTC', name: 'Bitcoin', description: 'Native', recommended: true }],
  ETH: [
    { id: 'ERC20',    name: 'Ethereum', description: 'Native', recommended: true },
    { id: 'BASE',     name: 'Base',     description: 'L2 · Lower fees' },
    { id: 'ARBITRUM', name: 'Arbitrum', description: 'L2 · Lower fees' },
  ],
  SOL: [{ id: 'SOLANA', name: 'Solana', description: 'Native', recommended: true }],
  BNB: [{ id: 'BEP20', name: 'BNB Chain', description: 'Native', recommended: true }],
  MATIC: [{ id: 'POLYGON', name: 'Polygon', description: 'Native', recommended: true }],
  AVAX: [{ id: 'AVAX', name: 'Avalanche C-Chain', description: 'Native', recommended: true }],
  TRX: [{ id: 'TRC20', name: 'TRON', description: 'Native', recommended: true }],
  XRP: [{ id: 'XRP', name: 'XRP Ledger', description: 'Native', recommended: true }],
  DOGE: [{ id: 'DOGE', name: 'Dogecoin', description: 'Native', recommended: true }],
  LTC: [{ id: 'LTC', name: 'Litecoin', description: 'Native', recommended: true }],
  ADA: [{ id: 'ADA', name: 'Cardano', description: 'Native', recommended: true }],
  DOT: [{ id: 'DOT', name: 'Polkadot', description: 'Native', recommended: true }],
  XLM: [{ id: 'XLM', name: 'Stellar', description: 'Native', recommended: true }],
}

// ============================================================================
// FALLBACK HANDLERS — local implementations for missing/awkward backend endpoints.
// Returning a value here SHORT-CIRCUITS the network call. Throw to fall through.
// ============================================================================
const LS = (key: string) => `crymadx.fallback.${key}`

function readLS<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(LS(key))
    return raw ? JSON.parse(raw) as T : fallback
  } catch { return fallback }
}
function writeLS<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(LS(key), JSON.stringify(value)) } catch { /* noop */ }
}

// In-memory price cache (refreshed ~30s)
let _priceCache: { at: number; map: Record<string, { price: number; change24h: number }> } | null = null
async function fetchPrices(token: string | null | undefined): Promise<Record<string, { price: number; change24h: number }>> {
  if (_priceCache && Date.now() - _priceCache.at < 30_000) return _priceCache.map
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE_URL}/prices`, { headers })
    if (!res.ok) return _priceCache?.map ?? {}
    const data = await res.json() as { prices?: Array<{ symbol: string; price: number; change24h: number }> }
    const map: Record<string, { price: number; change24h: number }> = {}
    for (const p of (data.prices ?? [])) {
      map[p.symbol.toUpperCase()] = { price: p.price ?? 0, change24h: p.change24h ?? 0 }
    }
    // Stablecoins always 1
    map['USDT'] = { price: 1, change24h: 0 }
    map['USDC'] = { price: 1, change24h: 0 }
    map['DAI']  = { price: 1, change24h: 0 }
    map['BUSD'] = { price: 1, change24h: 0 }
    _priceCache = { at: Date.now(), map }
    return map
  } catch {
    return _priceCache?.map ?? {}
  }
}

const FALLBACK_HANDLERS: Partial<Record<EndpointId, (ctx: { pathParams: Record<string, string>; query: Record<string, string>; body?: any; token?: string | null }) => Promise<unknown>>> = {
  // Wallet networks — derived from full assets config (568 chain combinations).
  // Returns every (asset, network) pair where this asset is supported.
  'api.wallet.networks.list': async ({ pathParams }) => {
    const sym = (pathParams.asset || '').toUpperCase()
    const variants = allAssets.filter(a => a.symbol.toUpperCase() === sym)
    if (variants.length === 0) {
      // Fall back to the small hardcoded map for resilience
      const list = NETWORKS[sym] ?? []
      return { networks: list }
    }
    const networks = variants.map((v, i) => ({
      id: v.chainId,
      name: v.network,
      description: `${v.network} · ${v.confirmations} confirmations · min ${v.minDeposit} ${v.symbol}`,
      recommended: i === 0,
    }))
    return { networks }
  },

  // Wallet balances — composite call (balances + prices) → enriched payload with USD values
  'api.wallet.balances.list': async ({ token }) => {
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const [balRes, prices] = await Promise.all([
      fetch(`${API_BASE_URL}/balance/balances`, { headers }),
      fetchPrices(token),
    ])
    if (!balRes.ok) {
      if (balRes.status === 401) {
        setToken(null); setRefreshToken(null)
        if (typeof localStorage !== 'undefined') localStorage.removeItem('crymadx.auth')
      }
      throw new ApiError('BALANCES_FAILED', 'Could not load balances', balRes.status)
    }
    const raw = await balRes.json()

    // Collect items from any of the common shapes
    const items: any[] = []
    const seen = new Set<string>()
    const walletObj = raw?.balances ?? raw?.funding ?? raw

    const pushItem = (asset: string, amount: string, network: string, walletType: string) => {
      const key = `${walletType}:${network}:${asset}`
      if (seen.has(key)) return
      seen.add(key)
      const amt = parseFloat(amount) || 0
      const px = prices[asset.toUpperCase()]?.price ?? 0
      items.push({
        id: `bal_${walletType}_${network}_${asset}`,
        userId: '',
        asset,
        amount: fmt(amt, { grouping: false }),
        amountRaw: amt,
        usdValue: fmt(amt * px, { grouping: false }),
        usdValueRaw: amt * px,
        network,
        walletType,
      } as any)
    }

    if (walletObj && typeof walletObj === 'object' && !Array.isArray(walletObj)) {
      // Try: { funding: { ETH: { ETH: '0.5', USDT: '100' } }, trading: {...} }
      const tryWalletGroups = (groupKey: 'funding' | 'trading') => {
        const group = walletObj[groupKey]
        if (group && typeof group === 'object') {
          for (const [chain, assetMap] of Object.entries(group)) {
            if (assetMap && typeof assetMap === 'object') {
              for (const [asset, val] of Object.entries(assetMap as any)) {
                const amount = typeof val === 'object' && val ? String((val as any).amount ?? (val as any).balance ?? '0') : String(val ?? '0')
                pushItem(asset, amount, chain, groupKey)
              }
            }
          }
        }
      }
      tryWalletGroups('funding')
      tryWalletGroups('trading')

      // If no funding/trading nesting, walk one level
      if (items.length === 0) {
        for (const [k, v] of Object.entries(walletObj)) {
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            for (const [asset, val] of Object.entries(v as any)) {
              const amount = typeof val === 'object' && val ? String((val as any).amount ?? '0') : String(val ?? '0')
              pushItem(asset, amount, k, 'funding')
            }
          } else if (typeof v === 'string' || typeof v === 'number') {
            pushItem(k, String(v), '', 'funding')
          }
        }
      }
    } else if (Array.isArray(walletObj)) {
      walletObj.forEach((b: any) => {
        const asset = b.asset ?? b.token ?? b.symbol
        if (!asset) return
        pushItem(asset, String(b.amount ?? b.balance ?? '0'), b.network ?? b.chain ?? '', b.walletType ?? 'funding')
      })
    }

    // Aggregate same-asset across chains/wallets so the home shows one row per asset
    const aggregated = new Map<string, any>()
    for (const it of items) {
      const a = it.asset
      if (!aggregated.has(a)) {
        aggregated.set(a, { ...it, id: `bal_${a}`, network: '', walletType: 'all' })
      } else {
        const cur = aggregated.get(a)
        cur.amountRaw = (cur.amountRaw ?? 0) + (it.amountRaw ?? 0)
        cur.usdValueRaw = (cur.usdValueRaw ?? 0) + (it.usdValueRaw ?? 0)
        cur.amount = fmt(cur.amountRaw, { grouping: false })
        cur.usdValue = fmt(cur.usdValueRaw, { grouping: false })
      }
    }
    const finalItems = Array.from(aggregated.values())
      .filter((b: any) => (b.amountRaw ?? 0) > 0 || ['USDT','USDC','BTC','ETH'].includes(b.asset))
      .sort((a: any, b: any) => (b.usdValueRaw ?? 0) - (a.usdValueRaw ?? 0))

    let total = 0
    for (const b of finalItems) total += b.usdValueRaw ?? 0

    // BTC equivalent
    const btcPrice = prices['BTC']?.price ?? 0
    const btcEquivalent = btcPrice > 0 ? fmt(total / btcPrice, { grouping: false }) : '0.00'

    // 24h change weighted by USD value
    let weightedPct = 0
    let weightedAbs = 0
    if (total > 0) {
      for (const b of finalItems) {
        const pct = prices[b.asset.toUpperCase()]?.change24h ?? 0
        const v = b.usdValueRaw ?? 0
        weightedPct += (v / total) * pct
        weightedAbs += v * (pct / 100)
      }
    }

    return {
      total: fmt(total, { grouping: false }),
      change24h: fmtPct(weightedPct),
      changeAbs: fmtPct(weightedAbs),
      btcEquivalent,
      items: finalItems,
    }
  },

  // Transactions — production /api/balance/transactions returns
  //   { transactions: [{ id, type, chain, symbol, amount, amountUsd, txHash,
  //     status, confirmations, address, createdAt, completedAt }], total }
  // The backend also remaps internally so 'withdrawal' may come back as
  // 'withdraw'; we normalize that here. Screens check tx.asset / tx.network /
  // tx.amount, so we expose all aliases.
  'api.tx.list': async ({ query, token }) => {
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const url = new URL(`${API_BASE_URL}/balance/transactions`)
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      if (res.status === 401) throw new ApiError('UNAUTHENTICATED', 'Sign in required', 401)
      return { items: [], nextCursor: null, total: 0 }
    }
    const raw = await res.json()
    const arr = raw?.transactions ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    const total = raw?.total ?? arr.length

    const items = arr.map((t: any) => {
      const tx = deepCamel(t)
      const amountNum = parseFloat(String(tx.amount ?? tx.value ?? '0')) || 0
      const amountUsdNum = tx.amountUsd != null ? parseFloat(String(tx.amountUsd)) : null
      const feeNum = tx.fee != null ? parseFloat(String(tx.fee)) : null

      // Normalize type — copied from src/screens/wallet/HistoryScreen.tsx (production):
      //   'swap' or 'conversion' → 'convert'
      //   'withdrawal' → 'withdraw'
      //   'internal_transfer' or 'internal' → 'convert'
      // Final values: deposit | withdraw | convert | stake | unstake | reward | trade | card-topup
      let ty = String(tx.type ?? tx.kind ?? 'deposit').toLowerCase()
      if (ty === 'swap' || ty === 'conversion') ty = 'convert'
      if (ty === 'withdrawal') ty = 'withdraw'
      if (ty === 'internal_transfer' || ty === 'internal') ty = 'convert'

      // Normalize status. Backend uses 'confirmed' for finalized; UI expects 'completed'.
      let st = String(tx.status ?? 'completed').toLowerCase()
      if (st === 'confirmed') st = 'completed'

      // Asset resolution — production transaction shape has `symbol` and `chain`.
      // Older code paths still use `token` / `asset`. Try them all.
      const asset = (tx.asset ?? tx.symbol ?? tx.token ?? tx.currency ?? tx.chain ?? '').toString().toUpperCase()
      const chain = (tx.chain ?? tx.network ?? '').toString()

      // Convert-specific destination fields (production HistoryScreen.tsx)
      const assetTo = tx.toToken ?? tx.toAsset ?? tx.toCurrency ?? tx.toSymbol
      const amountToRaw = tx.toAmount != null ? parseFloat(String(tx.toAmount)) : null

      return {
        id: tx.id ?? tx._id ?? tx.txId ?? tx.requestId ?? tx.txHash ?? `tx_${Math.random().toString(36).slice(2)}`,
        userId: tx.userId ?? '',
        type: ty as any,
        // Primary frontend field — every screen reads tx.asset
        asset,
        // Aliases preserved for permissive matching (MATIC↔POL etc.)
        symbol: tx.symbol ?? asset,
        token: tx.token ?? asset,
        chain,
        // Destination side of a conversion (so screens can show "BTC → USDT")
        assetTo: assetTo ? String(assetTo).toUpperCase() : undefined,
        amountTo: amountToRaw != null ? fmt(amountToRaw, { grouping: false }) : undefined,
        amountToRaw: amountToRaw ?? undefined,
        amount: fmt(amountNum, { grouping: false }),
        amountRaw: amountNum,
        amountUsd: amountUsdNum != null ? fmt(amountUsdNum) : undefined,
        amountUsdRaw: amountUsdNum ?? undefined,
        status: st,
        network: tx.network ?? tx.chain ?? '',
        txHash: tx.txHash ?? tx.hash ?? tx.transactionHash,
        fromAddress: tx.fromAddress ?? tx.from,
        toAddress: tx.toAddress ?? tx.to ?? tx.address,
        address: tx.address ?? tx.toAddress ?? tx.fromAddress,
        fee: feeNum != null ? fmt(feeNum, { grouping: false }) : undefined,
        feeAsset: tx.feeAsset,
        createdAt: tx.createdAt ?? tx.timestamp ?? tx.time ?? new Date().toISOString(),
        completedAt: tx.completedAt ?? tx.confirmedAt,
        blockHeight: tx.blockHeight,
        confirmations: tx.confirmations,
      }
    })
    return { items, nextCursor: raw?.nextCursor ?? null, total }
  },

  // Wallet deposit address — call /api/user/wallets, look up wallet whose
  // .chain field matches the requested chainId (e.g. 'eth', 'matic', 'btc').
  // user-service returns: { wallets: [{ chain, address, type, memo?, tag?, walletId, createdAt }, ...] }
  'api.wallet.deposit.address': async ({ pathParams, token }) => {
    const asset = (pathParams.asset || '').toUpperCase()
    const networkParam = pathParams.network || ''
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE_URL}/user/wallets`, { headers })
    if (!res.ok) {
      if (res.status === 401) {
        setToken(null); setRefreshToken(null)
        if (typeof localStorage !== 'undefined') localStorage.removeItem('crymadx.auth')
      }
      throw new ApiError('NO_WALLET', 'Could not load wallets', res.status)
    }
    const data = await res.json()
    const wallets: any[] = Array.isArray(data?.wallets) ? data.wallets : (Array.isArray(data) ? data : [])

    // Normalize chainId. Asset config uses 'eth', 'matic', 'bsc', 'btc', etc.
    // Some screens may send the user-facing network NAME (e.g. 'Ethereum (ERC-20)')
    // — translate that back to chainId by finding the matching variant.
    let chain = networkParam.toLowerCase()
    const variant = allAssets.find(a =>
      a.symbol.toUpperCase() === asset &&
      (a.chainId.toLowerCase() === chain || a.network.toLowerCase() === networkParam.toLowerCase()),
    )
    if (variant) chain = variant.chainId.toLowerCase()
    // For native coins picked without a network selection, fall back to the asset's own chain
    if (!chain) {
      const native = allAssets.find(a => a.symbol.toUpperCase() === asset && a.type === 'native')
      if (native) chain = native.chainId.toLowerCase()
    }

    // Match wallet by chain. Tolerate aliases (e.g., 'bsc' vs 'bnb').
    const aliasMap: Record<string, string[]> = {
      bsc: ['bsc', 'bnb'],
      eth: ['eth'],
      matic: ['matic', 'polygon'],
      arb: ['arb', 'arbitrum'],
      op: ['op', 'optimism'],
      base: ['base'],
      avax: ['avax', 'avalanche'],
      sol: ['sol', 'solana'],
      btc: ['btc', 'bitcoin'],
      ltc: ['ltc'],
      doge: ['doge'],
      xrp: ['xrp'],
      xlm: ['xlm'],
      trx: ['trx', 'tron'],
    }
    const candidates = aliasMap[chain] ?? [chain]
    const wallet = wallets.find((w: any) => candidates.includes(String(w.chain).toLowerCase()))

    if (!wallet || !wallet.address) {
      // Helpful error: the user just doesn't have this wallet yet (most common case)
      throw new ApiError(
        'NO_ADDRESS',
        `No ${variant?.network ?? chain.toUpperCase()} wallet found. The wallet for this chain hasn't been created yet — try another network or contact support.`,
        404,
      )
    }

    // Build qrData with memo/tag for chains that need it
    let qrData = wallet.address as string
    if (wallet.memo) qrData = `${wallet.address}?memo=${wallet.memo}`
    if (wallet.tag) qrData = `${wallet.address}?dt=${wallet.tag}`

    return {
      asset,
      network: variant?.network ?? chain,
      address: wallet.address,
      qrData,
      memo: wallet.memo,
      tag: wallet.tag,
      minDeposit: variant?.minDeposit ?? '0.0001',
      confirmations: variant?.confirmations ?? 12,
      eta: variant?.confirmations && variant.confirmations <= 3 ? '~5 min'
        : variant?.confirmations && variant.confirmations <= 20 ? '~10 min'
        : '~30 min',
    }
  },

  // Withdraw fee — backend expects ?chain=&amount=&token= (NOT ?asset=).
  // Translate using the assets config + reshape response.
  'api.wallet.withdraw.fee': async ({ query, token }) => {
    const asset = String(query.asset ?? '').toUpperCase()
    const network = String(query.network ?? '').toLowerCase()
    const amount = String(query.amount ?? '1') // some screens probe with no amount; use 1 for an estimate

    // Resolve to a backend chain code via the assets config
    let variant = network
      ? allAssets.find(a => a.symbol.toUpperCase() === asset && a.chainId.toLowerCase() === network)
      : null
    if (!variant) variant = allAssets.find(a => a.symbol.toUpperCase() === asset)
    const chain = (variant?.chainId ?? asset).toUpperCase()
    const tokenSym = variant ? asset : asset

    const url = new URL(`${API_BASE_URL}/balance/withdraw/fee`)
    url.searchParams.set('chain', chain)
    url.searchParams.set('amount', amount)
    url.searchParams.set('token', tokenSym)

    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      // Don't blow up the screen — return a zero fee shape so the form stays usable.
      return { asset, fee: '0', feeUsd: '0', estimatedTime: '—' }
    }
    const data = await res.json()
    return {
      asset,
      fee: data.totalFeeToken ?? data.fee ?? '0',
      feeUsd: data.totalFeeUsd ?? data.feeUsd ?? '0',
      networkFeeUsd: data.networkFeeUsd,
      adminMarkupUsd: data.adminMarkupUsd,
      adminMarkupPercent: data.adminMarkupPercent,
      receiveAmount: data.receiveAmount,
      minWithdrawal: data.minWithdrawal ?? variant?.minWithdraw ?? '0',
      estimatedTime: data.estimatedTime,
    }
  },

  // Convert / swap execute — production swapService.createSwap requires
  // `destinationAddress` (the user's own wallet for the to-chain). Auto-resolve
  // it from /api/user/wallets so the mobile Convert screen doesn't need to
  // know about it. Mirrors src/services/swapService.ts createSwap().
  'api.wallet.convert.execute': async ({ body, token }) => {
    const fromAsset = String(body.fromAsset ?? body.fromToken ?? '').toUpperCase()
    const toAsset = String(body.toAsset ?? body.toToken ?? '').toUpperCase()
    const fromVariant = allAssets.find(a => a.symbol.toUpperCase() === fromAsset)
    const toVariant = allAssets.find(a => a.symbol.toUpperCase() === toAsset)
    const fromChain = (fromVariant?.chainId ?? body.fromChain ?? fromAsset).toLowerCase()
    const toChain = (toVariant?.chainId ?? body.toChain ?? toAsset).toLowerCase()

    // Resolve user's destination wallet for the to-chain. EVM chains share
    // the same ETH wallet (matic, base, arb, op, avax → ETH key in object form,
    // or chain='eth' in array form).
    const evmShared = ['eth', 'matic', 'base', 'arb', 'op', 'avax']
    const lookupChain = evmShared.includes(toChain) ? 'eth' : toChain

    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const wRes = await fetch(`${API_BASE_URL}/user/wallets`, { headers })
    if (!wRes.ok) throw new ApiError('NO_WALLET', 'Could not load wallets for destination', wRes.status)
    const wData = await wRes.json()
    const wallets = wData?.wallets

    let destinationAddress = ''
    if (Array.isArray(wallets)) {
      const w = wallets.find((x: any) => String(x.chain ?? '').toLowerCase() === lookupChain)
      destinationAddress = w?.address ?? ''
    } else if (wallets && typeof wallets === 'object') {
      // Object form keyed by uppercase chain. EVM share ETH.
      const objKey = lookupChain === 'eth' ? 'ETH'
        : lookupChain === 'sol' ? 'SOL'
        : lookupChain === 'btc' ? 'BTC'
        : lookupChain === 'bsc' ? 'BNB'
        : lookupChain.toUpperCase()
      destinationAddress = wallets[objKey]?.address ?? ''
    }

    if (!destinationAddress) {
      throw new ApiError('NO_DESTINATION_WALLET', `No ${toAsset} wallet on ${toChain.toUpperCase()} found. Set it up first.`, 400)
    }

    // Build the production-shaped payload.
    const payload = {
      fromChain,
      fromToken: fromAsset,
      toChain,
      toToken: toAsset,
      amount: String(body.fromAmount ?? body.amount ?? '0'),
      destinationAddress,
      rateId: body.rateId ?? body.quoteId,
      slippageTolerance: body.slippageTolerance,
    }

    const cRes = await fetch(`${API_BASE_URL}/swap/create`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!cRes.ok) {
      const errBody = await cRes.text().catch(() => '')
      throw new ApiError('SWAP_FAILED', errBody || `HTTP ${cRes.status}`, cRes.status)
    }
    const data = await cRes.json()
    // Translate to a Transaction-like shape so mobile screens can consume it.
    return {
      id: data.id ?? data.orderId ?? `swap_${Date.now()}`,
      type: 'convert',
      asset: fromAsset,
      assetTo: toAsset,
      amount: String(data.fromAmount ?? payload.amount),
      amountTo: String(data.expectedAmount ?? data.toAmount ?? '0'),
      status: (data.status ?? 'pending').toLowerCase(),
      network: fromChain,
      txHash: data.payinAddress ?? data.txHash,
      createdAt: data.createdAt ?? new Date().toISOString(),
      raw: data,
    }
  },

  // Markets candles — direct Binance public API (CORS-enabled)
  'api.markets.candles': async ({ pathParams, query }) => {
    const pair = String(pathParams.pair || '').replace('/', '').toUpperCase()
    const interval = (query.interval as string) || '15m'
    if (!pair) return { items: [] }
    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${encodeURIComponent(interval)}&limit=100`
    const res = await fetch(url)
    if (!res.ok) return { items: [] }
    const raw = await res.json() as Array<any[]>
    const items = raw.map(k => ({
      t: k[0] as number,
      o: parseFloat(k[1]),
      h: parseFloat(k[2]),
      l: parseFloat(k[3]),
      c: parseFloat(k[4]),
    }))
    return { items }
  },

  // Beneficiaries CRUD — localStorage
  'api.beneficiaries.list': async () => {
    return { items: readLS<any[]>('beneficiaries', []) }
  },
  'api.beneficiaries.create': async ({ body }) => {
    const list = readLS<any[]>('beneficiaries', [])
    const item = {
      id: `ben_${Date.now()}`,
      name: body.name,
      asset: body.asset,
      network: body.network,
      address: body.address,
      favorite: !!body.favorite,
      createdAt: new Date().toISOString(),
    }
    list.unshift(item)
    writeLS('beneficiaries', list)
    return item
  },
  'api.beneficiaries.delete': async ({ pathParams }) => {
    const list = readLS<any[]>('beneficiaries', []).filter(b => b.id !== pathParams.id)
    writeLS('beneficiaries', list)
    return { ok: true }
  },

  // System — hardcoded for now
  'api.system.status': async () => ({
    overall: 'operational',
    services: [
      { id: 'api',     name: 'API Gateway',  status: 'operational', uptime: '99.99%' },
      { id: 'trading', name: 'Trading',      status: 'operational', uptime: '99.95%' },
      { id: 'wallet',  name: 'Wallets',      status: 'operational', uptime: '99.97%' },
      { id: 'kyc',     name: 'KYC',          status: 'operational', uptime: '99.90%' },
      { id: 'card',    name: 'Card',         status: 'operational', uptime: '99.92%' },
    ],
    incidents: [],
  }),
  'api.system.version': async () => ({
    version: '2.8.0',
    build: 'live',
    minSupportedVersion: '2.0.0',
    forceUpdate: false,
  }),

  // NFT detail — translate :nftId (format "contract:tokenId") to /details/:contract/:tokenId
  'api.nft.detail': async ({ pathParams, token }) => {
    const id = pathParams.nftId || ''
    let contract = id, tokenId = '0'
    if (id.includes(':')) [contract, tokenId] = id.split(':')
    if (id.includes('/')) [contract, tokenId] = id.split('/')
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE_URL}/nft/details/${encodeURIComponent(contract)}/${encodeURIComponent(tokenId)}`, { headers })
    if (!res.ok) throw new ApiError('NOT_FOUND', `NFT not found`, res.status)
    return await res.json()
  },

  // NFT send — backend has no transfer endpoint, return error so screen shows "not supported"
  'api.nft.send': async () => {
    throw new ApiError('NOT_SUPPORTED', 'NFT transfers not yet supported on-chain via the API', 501)
  },

  // Rewards — production rewardsService only exposes /rewards/summary and
  // /rewards/tiers. There's no /badges, /tasks, or /daily endpoint. Derive
  // a badges list from the summary's badges field (if present), otherwise
  // return empty so the screen renders cleanly.
  'api.rewards.badges': async ({ token }) => {
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    try {
      const res = await fetch(`${API_BASE_URL}/rewards/summary`, { headers })
      if (!res.ok) return { items: [] }
      const data = await res.json()
      const arr = data?.badges ?? data?.summary?.badges ?? []
      return {
        items: arr.map((b: any) => ({
          id: b.id ?? b.code ?? b._id,
          name: b.name ?? b.title,
          description: b.description,
          progress: b.progress ?? 0,
          target: b.target ?? 1,
          earned: b.earned ?? !!b.unlockedAt,
          icon: b.icon ?? '🏆',
        })),
      }
    } catch { return { items: [] } }
  },
  // No daily-claim endpoint in production. Return graceful no-op so the UI
  // shows a helpful message rather than crashing.
  'api.rewards.claim-daily': async () => {
    throw new ApiError('NOT_AVAILABLE', 'Daily quest claim is not yet exposed by the backend.', 501)
  },

  // AI settings — backend may not have these. Return safe defaults from localStorage.
  'api.ai.settings.get': async () => {
    return readLS('ai.settings', {
      model: 'crymadx-v1',
      streaming: true,
      autoExecuteUnderUsd: 50,
      voice: 'Mira',
      voiceSpeed: 1.0,
      pushToTalk: false,
      wakeWord: false,
      pinTokenTtlMin: 30,
    })
  },
  'api.ai.settings.update': async ({ body }) => {
    const cur = readLS<any>('ai.settings', {})
    const next = { ...cur, ...body }
    writeLS('ai.settings', next)
    return next
  },
  'api.ai.tools.list': async () => {
    return readLS('ai.tools', {
      items: [
        { id: 'price.get',       name: 'Get Prices',       category: 'read',  enabled: true,  pinThresholdUsd: null },
        { id: 'balance.get',     name: 'View Balances',    category: 'read',  enabled: true,  pinThresholdUsd: null },
        { id: 'tx.list',         name: 'View Transactions', category: 'read', enabled: true,  pinThresholdUsd: null },
        { id: 'alert.create',    name: 'Set Alerts',       category: 'write', enabled: true,  pinThresholdUsd: null },
        { id: 'swap.execute',    name: 'Execute Swap',     category: 'write', enabled: false, pinThresholdUsd: 100 },
        { id: 'send.crypto',     name: 'Send Crypto',      category: 'write', enabled: false, pinThresholdUsd: 50 },
        { id: 'order.place',     name: 'Place Trade',      category: 'write', enabled: false, pinThresholdUsd: 200 },
        { id: 'savings.deposit', name: 'Deposit Savings',  category: 'write', enabled: false, pinThresholdUsd: 500 },
        { id: 'card.topup',      name: 'Top-up Card',      category: 'write', enabled: false, pinThresholdUsd: 100 },
      ],
    })
  },
  'api.ai.tools.update': async ({ body }) => {
    const tools: any = readLS('ai.tools', { items: [] })
    const idx = tools.items.findIndex((t: any) => t.id === body.id)
    if (idx >= 0) {
      tools.items[idx] = { ...tools.items[idx], ...body }
      writeLS('ai.tools', tools)
      return tools.items[idx]
    }
    return body
  },
  'api.ai.memory.list': async () => ({ items: readLS<any[]>('ai.memory', []) }),
  'api.ai.memory.delete': async ({ pathParams }) => {
    const list = readLS<any[]>('ai.memory', []).filter(m => m.id !== pathParams.itemId)
    writeLS('ai.memory', list)
    return { ok: true }
  },
  'api.ai.memory.clear': async () => { writeLS('ai.memory', []); return { ok: true } },
  'api.ai.scheduled.list': async () => ({ items: readLS<any[]>('ai.scheduled', []) }),
  'api.ai.scheduled.detail': async ({ pathParams }) => {
    const list = readLS<any[]>('ai.scheduled', [])
    const item = list.find(s => s.id === pathParams.actionId)
    if (!item) throw new ApiError('NOT_FOUND', 'Scheduled action not found', 404)
    return item
  },
  'api.ai.scheduled.cancel': async ({ pathParams }) => {
    const list = readLS<any[]>('ai.scheduled', [])
    const item = list.find(s => s.id === pathParams.actionId)
    if (item) { item.status = 'cancelled'; writeLS('ai.scheduled', list) }
    return item ?? { id: pathParams.actionId, status: 'cancelled' }
  },
  'api.ai.notifications': async () => ({ items: readLS<any[]>('ai.notifications', []) }),

  // Markets list — favorites tab handled here (others fall through to network)
  'api.markets.list': async ({ query, token }) => {
    const tab = query.tab as string | undefined
    // Always fetch the live ticker, then optionally apply favorites filter
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE_URL}/binance/ticker/24hr`, { headers })
    if (!res.ok) return { items: [] }
    const raw = await res.json() as any[]
    let items = raw
      .filter(p => typeof p.symbol === 'string' && p.symbol.endsWith('USDT'))
      .map(p => {
        const base = p.symbol.replace(/USDT$/, '')
        const priceNum = parseFloat(p.lastPrice ?? '0') || 0
        const volNum = parseFloat(p.volume ?? '0') || 0
        const highNum = parseFloat(p.highPrice ?? '0') || 0
        const lowNum = parseFloat(p.lowPrice ?? '0') || 0
        const chgNum = parseFloat(p.priceChangePercent ?? '0') || 0
        return {
          symbol: `${base}/USDT`,
          base,
          quote: 'USDT',
          price: fmt(priceNum, { grouping: false }),
          priceRaw: priceNum,
          change24h: chgNum.toFixed(2),
          volume24h: fmt(volNum, { grouping: false }),
          volume24hRaw: volNum,
          high24h: fmt(highNum, { grouping: false }),
          low24h: fmt(lowNum, { grouping: false }),
        } as any
      })
      .sort((a, b) => (b.volume24hRaw ?? 0) - (a.volume24hRaw ?? 0))
      .slice(0, 200)

    if (tab === 'favorites') {
      const favs = new Set(readLS<string[]>('markets.favorites', []))
      items = items.filter(p => favs.has(p.symbol))
    } else if (tab === 'gainers') {
      items = items.filter(p => parseFloat(p.change24h) > 0).slice(0, 50)
    } else if (tab === 'losers') {
      items = items.filter(p => parseFloat(p.change24h) < 0).slice(0, 50)
    } else if (tab === 'new') {
      items = items.slice(-50)
    }
    return { items }
  },

  // KYC start — backend route differs and needs minimal fallback for now
  'api.user.kyc.start': async ({ body, token }) => {
    const headers: Record<string, string> = { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_BASE_URL}/kyc/initiate`, {
      method: 'POST', headers,
      body: JSON.stringify({ level: body?.level ?? 1 }),
    })
    if (!res.ok) throw new ApiError('KYC_INIT_FAILED', 'Could not start KYC', res.status)
    return await res.json()
  },
}

// ============================================================================
// REQUEST ADAPTERS
// ============================================================================
const REQUEST_ADAPTERS: Partial<Record<EndpointId, (body: any) => any>> = {
  'api.auth.register': (body) => ({
    fullName: `${body.firstName ?? ''} ${body.lastName ?? ''}`.trim(),
    email: body.email,
    password: body.password,
    referralCode: body.referral,
    captchaToken: body.captchaToken,
  }),
  'api.auth.verify-2fa': (body) => ({
    userId: body.userId ?? body.loginToken,
    code: body.code,
  }),
  'api.auth.forgot-password': (body) => ({
    email: body.email,
    captchaToken: body.captchaToken,
  }),
  // Profile update — keep camelCase, server reads them
  'api.user.profile.update': (body) => body,
  // AI chat — adapt to chat-service shape
  'api.ai.chat.send': (body) => ({
    siteId: 'crymadx',
    message: body.text ?? body.message,
    history: body.history ?? [],
    conversationId: body.conversationId,
    agentId: body.agentId,
  }),
  // Withdraw — production withdrawalService.createWithdrawal sends:
  //   { chain, amount, address, memo?, tokenAddress?, verificationToken? }
  // verificationToken comes from POST /api/otp/verify after the user enters
  // their email OTP. Frontend currently captures only a PIN, so we pass
  // body.pin as verificationToken (backend will reject if it doesn't match
  // a real OTP token; the screen needs an OTP step to be fully functional).
  'api.wallet.withdraw.create': (body) => {
    const asset = String(body.asset ?? '').toUpperCase()
    const network = String(body.network ?? '').toLowerCase()
    const variant = allAssets.find(a => a.symbol.toUpperCase() === asset && a.chainId.toLowerCase() === network)
      ?? allAssets.find(a => a.symbol.toUpperCase() === asset)
    const chain = (variant?.chainId ?? asset).toLowerCase()
    return {
      chain,
      amount: String(body.amount),
      address: body.address,
      memo: body.memo,
      tokenAddress: body.tokenAddress,
      verificationToken: body.verificationToken ?? body.pin,
    }
  },

  // Fiat — body shapes copied from src/services/fiatService.ts (production).
  // Backend uses snake_case fields.
  'api.fiat.quote': (body) => ({
    fiat_amount: body.fiatAmount,
    fiat_currency: body.fiatCurrency,
    crypto_currency: body.cryptoAsset ?? body.cryptoCurrency,
    crypto_network: body.network ?? body.cryptoNetwork,
    payment_method: body.paymentMethod,
  }),
  'api.fiat.order.create': (body) => ({
    quote_id: body.quoteId,
    fiat_amount: body.fiatAmount,
    fiat_currency: body.fiatCurrency,
    crypto_currency: body.cryptoAsset ?? body.cryptoCurrency,
    crypto_network: body.network ?? body.cryptoNetwork,
    payment_method: body.paymentMethod,
    wallet_address: body.walletAddress,
    wallet_memo: body.walletMemo,
    user_data: body.userData,
  }),
  // No request body for status — but it's a request adapter slot. Skip.

  // Swap (Convert) — production swapService.getEstimate sends SwapEstimateRequest:
  //   { fromChain, fromToken, toChain, toToken, amount }
  // and createSwap sends CreateSwapRequest. Translate from frontend's
  // { fromAsset, toAsset, fromAmount, ... } shape.
  'api.wallet.convert.quote': (body) => {
    const fromVariant = allAssets.find(a => a.symbol.toUpperCase() === String(body.fromAsset ?? '').toUpperCase())
    const toVariant = allAssets.find(a => a.symbol.toUpperCase() === String(body.toAsset ?? '').toUpperCase())
    return {
      fromChain: (fromVariant?.chainId ?? body.fromChain ?? body.fromAsset ?? '').toLowerCase(),
      fromToken: String(body.fromAsset ?? body.fromToken ?? '').toUpperCase(),
      toChain:   (toVariant?.chainId   ?? body.toChain   ?? body.toAsset   ?? '').toLowerCase(),
      toToken:   String(body.toAsset ?? body.toToken ?? '').toUpperCase(),
      amount: String(body.fromAmount ?? body.amount ?? '0'),
    }
  },
  'api.wallet.convert.execute': (body) => {
    const fromVariant = allAssets.find(a => a.symbol.toUpperCase() === String(body.fromAsset ?? '').toUpperCase())
    const toVariant = allAssets.find(a => a.symbol.toUpperCase() === String(body.toAsset ?? '').toUpperCase())
    return {
      fromChain: (fromVariant?.chainId ?? body.fromChain ?? body.fromAsset ?? '').toLowerCase(),
      fromToken: String(body.fromAsset ?? body.fromToken ?? '').toUpperCase(),
      toChain:   (toVariant?.chainId   ?? body.toChain   ?? body.toAsset   ?? '').toLowerCase(),
      toToken:   String(body.toAsset ?? body.toToken ?? '').toUpperCase(),
      amount:    String(body.fromAmount ?? body.amount ?? '0'),
      rateId:    body.rateId ?? body.quoteId,
    }
  },
}

// ============================================================================
// RESPONSE ADAPTERS
// ============================================================================
function snakeToCamelKey(k: string): string {
  return k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function deepCamel<T = any>(obj: any): T {
  if (Array.isArray(obj)) return obj.map(deepCamel) as any
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) {
      out[snakeToCamelKey(k)] = deepCamel(v)
    }
    return out
  }
  return obj
}

function adaptUser(raw: any): any {
  if (!raw) return null
  const u = deepCamel(raw)
  return {
    id: u.id ?? u.userId,
    firstName: u.firstName ?? (u.fullName?.split(' ')[0] ?? ''),
    lastName:  u.lastName  ?? (u.fullName?.split(' ').slice(1).join(' ') ?? ''),
    email: u.email,
    phone: u.phone ?? u.phoneNumber ?? '',
    country: u.country ?? '',
    avatarUrl: u.avatarUrl ?? u.profilePicture ?? undefined,
    kycLevel: typeof u.kycLevel === 'number' ? u.kycLevel : (u.kycStatus === 'verified' ? 1 : 0),
    kycStatus: u.kycStatus ?? (u.kycVerified ? 'verified' : 'unverified'),
    tier: u.tier ?? 'bronze',
    xp: u.xp ?? 0,
    createdAt: u.createdAt ?? new Date().toISOString(),
    ...u,
  }
}

const RESPONSE_ADAPTERS: Partial<Record<EndpointId, (raw: any) => any>> = {
  // Fiat order create — Guardarian backend returns { redirect_url, transaction_id }
  // (snake_case). Normalize to the frontend's camelCase shape, and surface
  // every URL alias the backend has used (checkout/redirect/widget) so the
  // caller's fallback chain works.
  'api.fiat.order.create': (raw) => {
    const r = raw?.data ?? raw
    return {
      orderId: r.transaction_id ?? r.transactionId ?? r.order_id ?? r.orderId ?? r.id,
      checkoutUrl: r.checkout_url ?? r.checkoutUrl,
      redirectUrl: r.redirect_url ?? r.redirectUrl,
      widgetUrl: r.widget_url ?? r.widgetUrl,
      // Keep the snake_case keys too in case any caller reads them directly.
      transaction_id: r.transaction_id ?? r.transactionId,
      redirect_url: r.redirect_url ?? r.redirectUrl,
    }
  },
  // Fiat order status — backend returns { id, type, fiat_amount, fiat_currency,
  // crypto_amount, crypto_currency, status, created_at, ... } (snake_case).
  // Map to the frontend's expected shape and harden against missing fields so
  // the screen never crashes on `order.id.slice(...)` etc.
  'api.fiat.order.status': (raw) => {
    const r = raw?.data ?? raw?.order ?? raw?.transaction ?? raw ?? {}
    const id = r.id ?? r._id ?? r.order_id ?? r.orderId ?? r.transaction_id ?? r.transactionId ?? ''
    return {
      id: String(id),
      orderId: String(id),
      status: r.status ?? 'pending',
      fiatAmount: String(r.fiat_amount ?? r.fiatAmount ?? r.amount ?? '0'),
      fiatCurrency: r.fiat_currency ?? r.fiatCurrency ?? r.currency ?? '',
      cryptoAmount: String(r.crypto_amount ?? r.cryptoAmount ?? r.amount_to ?? '0'),
      cryptoAsset: r.crypto_currency ?? r.cryptoAsset ?? r.crypto_asset ?? r.asset ?? '',
      fee: String(r.fee ?? r.total_fee ?? '0'),
      paymentMethod: r.payment_method ?? r.paymentMethod ?? '',
      createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
      completedAt: r.completed_at ?? r.completedAt ?? null,
      // Guardarian sometimes returns its hosted URL on the order — surface it
      // so we can resume the checkout iframe if needed.
      redirectUrl: r.redirect_url ?? r.redirectUrl ?? r.checkout_url ?? r.checkoutUrl,
    }
  },
  'api.auth.login': (raw) => {
    const tokens = raw.tokens ?? raw
    const expiresIn = tokens.expiresIn ?? 3600
    return {
      accessToken: tokens.accessToken ?? raw.accessToken,
      refreshToken: tokens.refreshToken ?? raw.refreshToken,
      expiresAt: tokens.expiresAt ?? new Date(Date.now() + expiresIn * 1000).toISOString(),
      user: adaptUser(raw.user ?? raw.profile),
      requires2FA: !!raw.requires2FA,
      userId: raw.userId,
    }
  },
  // Google sign-in returns the same JWT session shape as /login.
  'api.auth.google': (raw) => {
    const tokens = raw.tokens ?? raw
    const expiresIn = tokens.expiresIn ?? 3600
    return {
      accessToken: tokens.accessToken ?? raw.accessToken,
      refreshToken: tokens.refreshToken ?? raw.refreshToken,
      expiresAt: tokens.expiresAt ?? new Date(Date.now() + expiresIn * 1000).toISOString(),
      user: adaptUser(raw.user ?? raw.profile),
      isNewUser: !!raw.isNewUser,
    }
  },
  'api.auth.verify-2fa': (raw) => {
    const tokens = raw.tokens ?? raw
    const expiresIn = tokens.expiresIn ?? 3600
    return {
      verified: true,
      accessToken: tokens.accessToken ?? raw.accessToken,
      refreshToken: tokens.refreshToken ?? raw.refreshToken,
      expiresAt: tokens.expiresAt ?? new Date(Date.now() + expiresIn * 1000).toISOString(),
      user: adaptUser(raw.user ?? raw.profile),
    }
  },
  'api.auth.refresh': (raw) => {
    const tokens = raw.tokens ?? raw
    const expiresIn = tokens.expiresIn ?? 3600
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt ?? new Date(Date.now() + expiresIn * 1000).toISOString(),
    }
  },
  'api.auth.complete-profile': (raw) => adaptUser(raw.user ?? raw.profile ?? raw),

  'api.user.profile.get': (raw) => adaptUser(raw.user ?? raw.profile ?? raw),
  'api.user.profile.update': (raw) => adaptUser(raw.user ?? raw.profile ?? raw),

  'api.user.kyc.status': (raw) => {
    const r = deepCamel(raw)
    return {
      level: r.level ?? r.kycLevel ?? 0,
      status: r.status ?? 'unverified',
      submittedAt: r.submittedAt ?? null,
      reviewedAt: r.reviewedAt ?? null,
      steps: r.steps ?? [],
      ...r,
    }
  },

  'api.wallet.balances.list': (raw) => {
    if (raw && Array.isArray(raw.items)) return raw
    const items: any[] = []
    let total = 0
    // Backend balance-service returns { funding: { ETH: { ETH: 0.5, USDT: 100 }, ... }, trading: ... }
    const wallets = raw?.balances ?? raw?.funding ?? raw
    if (wallets && typeof wallets === 'object' && !Array.isArray(wallets)) {
      const collect = (obj: any, walletType: string = 'funding') => {
        for (const [chain, assetMap] of Object.entries(obj)) {
          if (typeof assetMap === 'object' && assetMap) {
            for (const [asset, val] of Object.entries(assetMap as any)) {
              const amount = typeof val === 'object' ? String((val as any).amount ?? (val as any).balance ?? '0') : String(val ?? '0')
              const usdValue = typeof val === 'object' ? String((val as any).usdValue ?? '0') : '0'
              if (parseFloat(amount) > 0 || asset === 'USDT' || asset === 'BTC' || asset === 'ETH') {
                items.push({
                  id: `bal_${walletType}_${chain}_${asset}`,
                  userId: '',
                  asset,
                  amount,
                  usdValue,
                  network: chain,
                })
              }
            }
          }
        }
      }
      // try several common shapes
      if (wallets.funding) collect(wallets.funding, 'funding')
      else if (wallets.trading) collect(wallets.trading, 'trading')
      else collect(wallets, 'funding')
    } else if (Array.isArray(wallets)) {
      wallets.forEach((b: any, i: number) => {
        items.push({
          id: b.id ?? `bal_${i}`,
          userId: b.userId ?? b.user_id ?? '',
          asset: b.asset ?? b.token ?? b.symbol,
          amount: String(b.amount ?? b.balance ?? '0'),
          usdValue: String(b.usdValue ?? b.usd_value ?? '0'),
        })
      })
    }
    items.forEach(b => { total += parseFloat(b.usdValue) || 0 })
    return {
      total: total.toFixed(2),
      change24h: raw?.change24h ?? '0.00',
      changeAbs: raw?.changeAbs ?? '0.00',
      items,
    }
  },

  'api.wallet.balance.get': (raw) => {
    // balance-service returns the same /balances payload — frontend only needs a single asset
    // Filter happens in the screen; here just return the full list
    return raw
  },

  'api.tx.list': (raw) => {
    const arr = raw?.items ?? raw?.transactions ?? (Array.isArray(raw) ? raw : [])
    return { items: arr.map(deepCamel), nextCursor: raw?.nextCursor ?? null }
  },

  'api.tx.get': (raw) => deepCamel(raw?.transaction ?? raw),

  'api.markets.pair': (raw) => {
    if (Array.isArray(raw)) raw = raw[0]
    if (!raw) return null
    const sym = raw.symbol ?? ''
    const base = sym.replace(/USDT$/, '').replace(/BUSD$/, '')
    return {
      symbol: base ? `${base}/USDT` : sym,
      base, quote: 'USDT',
      price: String(raw.lastPrice ?? '0'),
      change24h: String(raw.priceChangePercent ?? '0'),
      volume24h: String(raw.volume ?? '0'),
      high24h: String(raw.highPrice ?? '0'),
      low24h: String(raw.lowPrice ?? '0'),
    }
  },

  'api.markets.orderbook': (raw) => {
    const bids = (raw?.bids ?? []).map((b: any) => ({ price: b[0] ?? b.price, amount: b[1] ?? b.amount }))
    const asks = (raw?.asks ?? []).map((b: any) => ({ price: b[0] ?? b.price, amount: b[1] ?? b.amount }))
    const spread = bids[0] && asks[0]
      ? (parseFloat(asks[0].price) - parseFloat(bids[0].price)).toFixed(2)
      : '0.00'
    return { bids, asks, spread }
  },

  // Earn — staking returns { options: [...] }, frontend wants { items: [...] }
  'api.earn.staking.products': (raw) => {
    const arr = raw?.options ?? raw?.items ?? raw?.products ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },
  'api.earn.staking.positions': (raw) => {
    const arr = raw?.positions ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },
  'api.earn.savings.products': (raw) => {
    const arr = raw?.products ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },
  'api.earn.savings.positions': (raw) => {
    const arr = raw?.positions ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },
  'api.earn.vault.list': (raw) => {
    const arr = raw?.products ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },
  'api.earn.autoinvest.list': (raw) => {
    const arr = raw?.plans ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },

  // P2P — production calls listings "orders" (mobile calls them "offers")
  'api.p2p.offers.list': (raw) => {
    const arr = raw?.orders ?? raw?.offers ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },
  'api.p2p.payments.list': (raw) => {
    const arr = raw?.methods ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },

  // Cards
  'api.card.transactions': (raw) => {
    const arr = raw?.transactions ?? raw?.items ?? raw ?? []
    return { items: Array.isArray(arr) ? arr : [] }
  },

  // NFT
  'api.nft.gallery': (raw) => {
    const arr = raw?.nfts ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr.map((n: any) => deepCamel(n)) }
  },
  'api.nft.market': (raw) => {
    const arr = raw?.listings ?? raw?.nfts ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr.map((n: any) => deepCamel(n)) }
  },

  // Notifications
  'api.notifications.list': (raw) => {
    const arr = raw?.notifications ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr.map(deepCamel) }
  },
  'api.announcements.list': (raw) => {
    const arr = raw?.announcements ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr.map(deepCamel) }
  },

  // Rewards summary — production returns { totalPoints, currentTier, nextTier,
  // tierProgress, tradingVolume }. Mobile expects { xp, nextTierXp, tier,
  // badges, badgesTotal, ... }. Translate.
  'api.rewards.summary': (raw) => {
    const r = raw ?? {}
    const tier = String(r.currentTier ?? r.tier ?? 'Bronze').toLowerCase()
    const xp = Number(r.totalPoints ?? r.xp ?? 0) || 0
    const progressPct = Number(r.tierProgress ?? 0) || 0
    // Production gives a 0–100 percentage. Reverse-engineer an absolute
    // nextTierXp so the mobile UI's percentage math (xp / nextTierXp) works.
    let nextTierXp = xp
    if (xp > 0 && progressPct > 0 && progressPct < 100) {
      nextTierXp = Math.round(xp / (progressPct / 100))
    } else if (progressPct === 0 && xp > 0) {
      nextTierXp = xp * 2 || 500
    } else if (xp === 0) {
      nextTierXp = 500 // default Silver threshold
    }
    return {
      tier,
      xp,
      nextTierXp,
      nextTier: String(r.nextTier ?? 'Silver').toLowerCase(),
      badges: Number(r.badges ?? 0) || 0,
      badgesTotal: Number(r.badgesTotal ?? 0) || 0,
      tradingVolume: r.tradingVolume ?? '$0',
      ...r,
    }
  },

  // Rewards — badges came from /tasks
  'api.rewards.badges': (raw) => {
    const arr = raw?.tasks ?? raw?.items ?? raw?.badges ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr.map((b: any) => ({
      id: b.id ?? b._id,
      name: b.title ?? b.name,
      description: b.description,
      progress: b.progress ?? 0,
      target: b.target ?? 1,
      earned: b.completed ?? b.earned ?? false,
      icon: b.icon ?? '🏆',
    })) }
  },
  'api.rewards.tiers': (raw) => {
    const arr = raw?.tiers ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr }
  },

  // Support tickets
  'api.support.tickets.list': (raw) => {
    const arr = raw?.tickets ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr.map(deepCamel) }
  },
  'api.support.articles': (raw) => {
    const arr = raw?.articles ?? raw?.items ?? (Array.isArray(raw) ? raw : []) ?? []
    return { items: arr.map(deepCamel) }
  },

  // Fiat quote — match the mapping done by src/services/fiatService.ts (mapQuote)
  'api.fiat.quote': (raw) => {
    if (!raw) return null
    const fb = raw.fee_breakdown
    const validForSec = raw.quote_valid_for ?? 30
    return {
      quoteId: raw.quote_id ?? raw.quoteId,
      fiatAmount: String(raw.fiat_amount ?? raw.fiatAmount ?? '0'),
      fiatCurrency: raw.fee_currency ?? raw.fiatCurrency ?? '',
      cryptoAmount: String(raw.crypto_amount ?? raw.cryptoAmount ?? '0'),
      cryptoAsset: raw.crypto_currency ?? raw.cryptoCurrency ?? '',
      rate: String(raw.exchange_rate ?? raw.rate ?? '0'),
      fee: String(raw.fee ?? raw.totalFee ?? '0'),
      networkFee: String(fb?.network_fee ?? raw.network_fee ?? '0'),
      partnerFee: String(fb?.partner_fee ?? '0'),
      validForSec,
      expiresAt: new Date(Date.now() + validForSec * 1000).toISOString(),
      minAmount: raw.min_amount,
      maxAmount: raw.max_amount,
      errorHint: raw.error_hint,
    }
  },

  // Swap quote — production swapService.getEstimate maps to:
  //   { fromChain, fromToken, toChain, toToken, fromAmount, toAmount,
  //     rate, fee, networkFee, validUntil, rateId, minAmount }
  // Frontend Convert screen expects { quoteId, toAmount, rate, feeUsdt, slippage, validForSec, expiresAt }
  'api.wallet.convert.quote': (raw) => {
    const r = deepCamel(raw)
    const validUntil = r.validUntil ? new Date(r.validUntil) : null
    const validForSec = validUntil ? Math.max(0, Math.floor((validUntil.getTime() - Date.now()) / 1000)) : 30
    return {
      quoteId: r.rateId ?? r.quoteId ?? r.id ?? `q_${Date.now()}`,
      rateId: r.rateId,
      fromAsset: r.fromToken ?? r.fromAsset,
      toAsset: r.toToken ?? r.toAsset,
      fromAmount: String(r.fromAmount ?? '0'),
      toAmount: String(r.estimatedAmount ?? r.toAmount ?? '0'),
      rate: String(r.rate ?? '0'),
      feeUsdt: String(r.networkFee ?? r.fee ?? '0'),
      networkFee: String(r.networkFee ?? '0'),
      slippage: String(r.slippage ?? '0.10'),
      validForSec,
      expiresAt: validUntil ? validUntil.toISOString() : new Date(Date.now() + validForSec * 1000).toISOString(),
      minAmount: r.minAmount,
    }
  },
}

// ============================================================================
// URL builder (with overrides applied)
// ============================================================================
function realPath(endpointId: EndpointId, pathParams?: Record<string, string | number>): string {
  let template = REAL_PATH_OVERRIDES[endpointId] ?? ENDPOINTS[endpointId].path
  if (pathParams) {
    for (const [k, v] of Object.entries(pathParams)) {
      template = template.replace(`:${k}`, encodeURIComponent(String(v)))
    }
  }
  return template
}

// ============================================================================
// MAIN
// ============================================================================
export async function api<T = unknown>(
  endpointId: EndpointId,
  opts: CallOpts = {},
): Promise<T> {
  const def = ENDPOINTS[endpointId]
  if (!def) throw new ApiError('UNKNOWN_ENDPOINT', `No such endpoint: ${endpointId}`, 500)

  const query: Record<string, string> = {}
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) query[k] = String(v)
    }
  }

  if (USE_MOCK) {
    try {
      const path = endpointPath(endpointId, opts.pathParams as Record<string, string | number> | undefined)
      void path
      return await dispatchMock(endpointId, {
        pathParams: (opts.pathParams as Record<string, string>) ?? {},
        query,
        body: opts.body,
      }) as T
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError('MOCK_ERROR', (err as Error).message, 500)
    }
  }

  // ===== Fallback handlers (short-circuit) =====
  const fallback = FALLBACK_HANDLERS[endpointId]
  if (fallback) {
    try {
      return await fallback({
        pathParams: (opts.pathParams as Record<string, string>) ?? {},
        query,
        body: opts.body,
        token: opts.token ?? getToken(),
      }) as T
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError('FALLBACK_ERROR', (err as Error).message, 500)
    }
  }

  // ===== Real backend =====
  const path = realPath(endpointId, opts.pathParams as Record<string, string | number> | undefined)
  const url = new URL(API_BASE_URL + path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')

  if (endpointId === 'api.trading.orders.open') url.searchParams.set('status', 'open')
  if (endpointId === 'api.trading.orders.history') url.searchParams.set('status', 'history')

  if (endpointId === 'api.markets.orderbook' && opts.pathParams?.pair) {
    const pair = String(opts.pathParams.pair)
    url.searchParams.set('symbol', pair.replace('/', ''))
  }
  if (endpointId === 'api.markets.pair' && opts.pathParams?.pair) {
    const pair = String(opts.pathParams.pair)
    url.searchParams.set('symbol', pair.replace('/', ''))
  }
  if (endpointId === 'api.wallet.withdraw.fee' && query.asset) {
    // already in query
  }

  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)

  let body = opts.body
  const reqAdapter = REQUEST_ADAPTERS[endpointId]
  if (reqAdapter && body !== undefined) body = reqAdapter(body)

  const token = opts.token ?? getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const method = METHOD_OVERRIDES[endpointId] ?? def.method
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined && method !== 'GET' && method !== 'DELETE' ? JSON.stringify(body) : undefined,
    credentials: 'omit',
  })

  let json: any = null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try { json = await res.json() } catch { json = null }
  } else {
    try { const text = await res.text(); json = text ? { message: text } : null } catch { json = null }
  }

  if (!res.ok) {
    const code = json?.error?.code ?? json?.code ?? `HTTP_${res.status}`
    const message = json?.error?.message ?? json?.message ?? json?.error ?? res.statusText
    if (res.status === 401) {
      try {
        setToken(null)
        setRefreshToken(null)
        if (typeof localStorage !== 'undefined') localStorage.removeItem('crymadx.auth')
      } catch { /* noop */ }
    }
    throw new ApiError(String(code), String(message ?? 'Request failed'), res.status)
  }

  const respAdapter = RESPONSE_ADAPTERS[endpointId]
  if (respAdapter) {
    try { return respAdapter(json) as T } catch { return json as T }
  }
  return json as T
}

export { ApiError }

// All supported deposit/withdraw asset symbols (deduplicated from the
// full asset config — 230+ unique tickers across 568 chain combinations).
export function getSupportedAssets(): string[] {
  const set = new Set<string>()
  for (const a of allAssets) set.add(a.symbol.toUpperCase())
  return Array.from(set).sort()
}

// Helper for screens that want to toggle a market favorite locally
export function toggleFavoriteSymbol(symbol: string): string[] {
  const cur = readLS<string[]>('markets.favorites', [])
  const next = cur.includes(symbol) ? cur.filter(s => s !== symbol) : [...cur, symbol]
  writeLS('markets.favorites', next)
  return next
}
export function getFavoriteSymbols(): string[] {
  return readLS<string[]>('markets.favorites', [])
}
