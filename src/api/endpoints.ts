/**
 * ENDPOINT REGISTRY
 * -----------------
 * Every API call this app makes is declared here once with a stable ID,
 * method, path, and TypeScript types for request and response.
 *
 * The mock layer (src/mock/handlers.ts) and the real backend
 * MUST agree on these shapes. The backend dev gets BACKEND.md as the spec.
 *
 * Adding a new endpoint:
 *   1. Append an entry below with a stable ID, method, path.
 *   2. Add request/response types if needed.
 *   3. Implement the corresponding handler in src/mock/handlers.ts.
 *   4. Use it via `useEndpoint('api.your.id')` or `apiClient.call('api.your.id', ...)`.
 */

// ---------- Shared response wrappers ----------

export type ApiError = {
  error: { code: string; message: string }
}

export type Paginated<T> = {
  items: T[]
  nextCursor: string | null
}

// ---------- Domain types (lightweight; expand as needed) ----------

export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  avatarUrl?: string
  kycLevel: 0 | 1 | 2 | 3
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  xp: number
  createdAt: string
}

export type Asset = {
  symbol: string
  name: string
  decimals: number
  iconColor: string
  network: string
}

export type Balance = {
  id: string
  userId: string
  asset: string
  amount: string  // decimal as string
  usdValue: string
}

export type Transaction = {
  id: string
  userId: string
  // Mirrors src/screens/wallet/HistoryScreen.tsx (production):
  // backend returns 'withdrawal' / 'swap' / 'conversion' / 'internal_transfer'
  // → normalized in client.ts api.tx.list adapter to:
  type: 'deposit' | 'withdraw' | 'convert' | 'stake' | 'unstake' | 'reward' | 'trade' | 'card-topup'
  /** Destination asset for converts (e.g. USDT when swapping BTC→USDT) */
  assetTo?: string
  /** Destination amount for converts */
  amountTo?: string
  asset: string
  amount: string
  status: 'pending' | 'completed' | 'failed'
  network?: string
  txHash?: string
  fromAddress?: string
  toAddress?: string
  fee?: string
  feeAsset?: string
  createdAt: string
  blockHeight?: number
  confirmations?: number
}

export type MarketPair = {
  symbol: string  // e.g., "BTC/USDT"
  base: string
  quote: string
  price: string
  change24h: string  // % as string e.g. "+2.89"
  volume24h: string
  high24h: string
  low24h: string
}

// Quote response from /api/wallet/convert.quote (proxies to backend /swap/estimate).
// Adapter at api/client.ts maps backend's `estimatedAmount` to `toAmount`.
export type SwapQuote = {
  quoteId: string
  fromAsset: string
  toAsset: string
  fromAmount: string
  toAmount: string
  rate: string
  feeUsdt: string
  slippage: string
  validForSec: number
  minAmount?: string
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: User
}

// ---------- Endpoint definitions ----------

export const ENDPOINTS = {
  // ---- Auth ----
  'api.auth.register':         { method: 'POST', path: '/auth/register' },
  'api.auth.verify-email':     { method: 'POST', path: '/auth/verify-email' },
  'api.auth.resend-code':      { method: 'POST', path: '/auth/resend-verification' },
  'api.auth.complete-profile': { method: 'POST', path: '/auth/complete-profile' },
  'api.auth.login':            { method: 'POST', path: '/auth/login' },
  /** Google sign-in. Body: { credential: <Google access token> }. Returns the
   *  same AuthSession shape as /auth/login. Works for both new + existing users. */
  'api.auth.google':           { method: 'POST', path: '/auth/google' },
  'api.auth.verify-2fa':       { method: 'POST', path: '/auth/verify-2fa' },
  'api.auth.forgot-password':  { method: 'POST', path: '/auth/forgot-password' },
  'api.auth.reset-password':   { method: 'POST', path: '/auth/reset-password' },
  'api.auth.refresh':          { method: 'POST', path: '/auth/refresh' },
  'api.auth.logout':           { method: 'POST', path: '/auth/logout' },

  // ---- User ----
  'api.user.profile.get':      { method: 'GET',  path: '/user/profile' },
  'api.user.profile.update':   { method: 'PATCH', path: '/user/profile' },
  /** Caller's own permanent UID (auto-mints if missing — defensive). */
  'api.user.uid':              { method: 'GET',  path: '/user/uid' },
  /** Public-ish recipient lookup by UID. Returns {userId, displayName, kycLevel} or 404. */
  'api.user.uid.lookup':       { method: 'GET',  path: '/user/uid/lookup' },
  'api.user.kyc.status':       { method: 'GET',  path: '/user/kyc' },
  'api.user.kyc.start':        { method: 'POST', path: '/user/kyc/start' },
  /** Real in-house KYC: multipart upload (front, back, selfie, livenessVideo, personalInfo) */
  'api.kyc.submit':            { method: 'POST', path: '/kyc/submit' },
  'api.kyc.status':            { method: 'GET',  path: '/kyc/status' },
  'api.kyc.retry':             { method: 'POST', path: '/kyc/retry' },

  // ---- Wallet ----
  'api.wallet.balances.list':  { method: 'GET',  path: '/wallet/balances' },
  'api.wallet.balance.get':    { method: 'GET',  path: '/wallet/balances/:asset' },
  'api.wallet.deposit.address': { method: 'GET',  path: '/wallet/deposit/:asset/:network' },
  'api.wallet.networks.list':  { method: 'GET',  path: '/wallet/networks/:asset' },
  'api.wallet.withdraw.create': { method: 'POST', path: '/wallet/withdraw' },
  'api.wallet.withdraw.fee':   { method: 'GET',  path: '/wallet/withdraw/fee' },
  /** UID-to-UID internal transfer (instant, no fee). */
  'api.transfer.internal.create': { method: 'POST', path: '/transfer/internal' },
  'api.transfer.internal.list':   { method: 'GET',  path: '/transfers/internal' },
  'api.transfer.internal.get':    { method: 'GET',  path: '/transfers/internal/:transferId' },
  'api.wallet.convert.quote':  { method: 'POST', path: '/wallet/convert/quote' },
  'api.wallet.convert.execute': { method: 'POST', path: '/wallet/convert/execute' },

  // ---- Transactions ----
  'api.tx.list':               { method: 'GET',  path: '/transactions' },
  'api.tx.get':                { method: 'GET',  path: '/transactions/:txId' },

  // ---- Beneficiaries / Whitelist ----
  // The mobile UI calls these "beneficiaries" but the backend stores them as
  // an address whitelist. Aliased so existing screens keep working while new
  // ones can use the explicit `whitelist.*` names.
  'api.beneficiaries.list':    { method: 'GET',  path: '/beneficiaries' },
  'api.beneficiaries.create':  { method: 'POST', path: '/beneficiaries' },
  'api.beneficiaries.delete':  { method: 'DELETE', path: '/beneficiaries/:id' },
  'api.wallet.whitelist.list':    { method: 'GET',    path: '/wallet/whitelist' },
  'api.wallet.whitelist.add':     { method: 'POST',   path: '/wallet/whitelist' },
  'api.wallet.whitelist.update':  { method: 'PATCH',  path: '/wallet/whitelist/:id' },
  'api.wallet.whitelist.remove':  { method: 'DELETE', path: '/wallet/whitelist/:id' },
  'api.wallet.whitelist.confirm': { method: 'POST',   path: '/wallet/whitelist/:id/confirm' },
  /** Check if a single address is whitelisted (drives the "skip OTP" decision on Withdraw). */
  'api.wallet.whitelist.check':   { method: 'GET',    path: '/wallet/whitelist/check' },

  // ---- OTP (email verification codes) ----
  /** Trigger an email OTP. Body: `{ purpose: 'withdrawal' | 'login' | ... }` */
  'api.otp.send':              { method: 'POST', path: '/otp/send' },
  'api.otp.verify':            { method: 'POST', path: '/otp/verify' },

  // ---- Markets ----
  'api.markets.list':          { method: 'GET',  path: '/markets' },
  'api.markets.pair':          { method: 'GET',  path: '/markets/:pair' },
  'api.markets.candles':       { method: 'GET',  path: '/markets/:pair/candles' },
  'api.markets.orderbook':     { method: 'GET',  path: '/markets/:pair/orderbook' },
  /** Live trades stream — recent fills for a pair (Binance public proxy). */
  'api.markets.trades':        { method: 'GET',  path: '/markets/:pair/trades' },

  // ---- Trading (spot-trading-service via /api/spot) ----
  'api.trading.order.create':  { method: 'POST',  path: '/trading/orders' },
  'api.trading.order.oco':     { method: 'POST',  path: '/trading/orders/oco' },
  'api.trading.order.cancel':  { method: 'DELETE', path: '/trading/orders/:orderId' },
  'api.trading.orders.open':   { method: 'GET',   path: '/trading/orders?status=open' },
  'api.trading.orders.history':{ method: 'GET',   path: '/trading/orders?status=history' },
  // Completed swaps shown as orders (the web exchange merges these into history)
  'api.trading.swaps.history': { method: 'GET',   path: '/swap/history' },
  'api.trading.trades':        { method: 'GET',   path: '/trading/trades' },
  'api.trading.trade':         { method: 'GET',   path: '/trading/trades/:tradeId' },

  // ---- Earn ----
  'api.earn.savings.products': { method: 'GET',  path: '/earn/savings/products' },
  'api.earn.savings.deposit':  { method: 'POST', path: '/earn/savings/deposit' },
  'api.earn.savings.positions':{ method: 'GET',  path: '/earn/savings/positions' },
  'api.earn.staking.products': { method: 'GET',  path: '/earn/staking/products' },
  'api.earn.staking.stake':    { method: 'POST', path: '/earn/staking/stake' },
  'api.earn.staking.unstake':  { method: 'POST', path: '/earn/staking/unstake' },
  'api.earn.staking.positions':{ method: 'GET',  path: '/earn/staking/positions' },
  'api.earn.staking.stats':    { method: 'GET',  path: '/earn/staking/stats' },
  'api.earn.autoinvest.list':  { method: 'GET',  path: '/earn/auto-invest' },
  'api.earn.autoinvest.create':{ method: 'POST', path: '/earn/auto-invest' },
  'api.earn.autoinvest.update':{ method: 'PATCH', path: '/earn/auto-invest/:id' },
  'api.earn.vault.list':       { method: 'GET',  path: '/earn/vaults' },
  // Plan-based savings vault (savings-service)
  'api.earn.vault.plans':        { method: 'GET',    path: '/earn/vault/plans' },
  'api.earn.vault.subscribe':    { method: 'POST',   path: '/earn/vault/subscribe' },
  'api.earn.vault.positions':    { method: 'GET',    path: '/earn/vault/positions' },
  'api.earn.vault.unlock':       { method: 'POST',   path: '/earn/vault/unlock/:id' },
  'api.earn.vault.topup':        { method: 'POST',   path: '/earn/vault/positions/:id/topup' },
  'api.earn.vault.contribute':   { method: 'POST',   path: '/earn/vault/positions/:id/contribute' },
  'api.earn.vault.stats':        { method: 'GET',    path: '/earn/vault/stats' },
  'api.earn.vault.autosave.list':   { method: 'GET',    path: '/earn/vault/auto-save' },
  'api.earn.vault.autosave.set':    { method: 'POST',   path: '/earn/vault/auto-save' },
  'api.earn.vault.autosave.delete': { method: 'DELETE', path: '/earn/vault/auto-save/:id' },

  // ---- P2P ----
  'api.p2p.offers.list':       { method: 'GET',  path: '/p2p/offers' },
  'api.p2p.offer.get':         { method: 'GET',  path: '/p2p/offers/:offerId' },
  // Post a buy/sell ad (web exchange calls these "orders"); order.create below
  // takes an existing offer (→ /p2p/trades), so ads need their own route.
  'api.p2p.ad.create':         { method: 'POST', path: '/p2p/orders' },
  'api.p2p.order.create':      { method: 'POST', path: '/p2p/orders' },
  'api.p2p.order.get':         { method: 'GET',  path: '/p2p/orders/:orderId' },
  'api.p2p.order.markpaid':    { method: 'POST', path: '/p2p/orders/:orderId/mark-paid' },
  'api.p2p.order.release':     { method: 'POST', path: '/p2p/orders/:orderId/release' },
  'api.p2p.order.dispute':     { method: 'POST', path: '/p2p/orders/:orderId/dispute' },
  'api.p2p.chat.send':         { method: 'POST', path: '/p2p/orders/:orderId/messages' },
  'api.p2p.chat.list':         { method: 'GET',  path: '/p2p/orders/:orderId/messages' },
  'api.p2p.payments.list':     { method: 'GET',  path: '/p2p/payment-methods' },
  'api.p2p.payments.create':   { method: 'POST', path: '/p2p/payment-methods' },

  // ---- Card ----
  'api.card.get':              { method: 'GET',  path: '/card' },
  'api.card.apply':            { method: 'POST', path: '/card/apply' },
  // AlchemyPay KYC (PageMode) — same routes the web exchange uses
  'api.card.kyc.init':         { method: 'POST', path: '/card/kyc/init' },
  'api.card.kyc.status':       { method: 'GET',  path: '/card/kyc/status' },
  'api.card.topup':            { method: 'POST', path: '/card/top-up' },
  'api.card.freeze':           { method: 'POST', path: '/card/freeze' },
  'api.card.settings.update':  { method: 'PATCH', path: '/card/settings' },
  'api.card.transactions':     { method: 'GET',  path: '/card/transactions' },

  // ---- NFT ----
  'api.nft.gallery':           { method: 'GET',  path: '/nfts/owned' },
  'api.nft.market':            { method: 'GET',  path: '/nfts/market' },
  'api.nft.detail':            { method: 'GET',  path: '/nfts/:nftId' },
  'api.nft.send':              { method: 'POST', path: '/nfts/:nftId/send' },

  // ---- AI ----
  'api.ai.chat.send':          { method: 'POST', path: '/ai/chat' },
  'api.ai.chat.history':       { method: 'GET',  path: '/ai/chat/history' },
  'api.ai.chat.conversation':  { method: 'GET',  path: '/ai/chat/:conversationId' },
  'api.ai.voice.start':        { method: 'POST', path: '/ai/voice/start' },
  'api.ai.voice.end':          { method: 'POST', path: '/ai/voice/end' },
  'api.ai.settings.get':       { method: 'GET',  path: '/ai/settings' },
  'api.ai.settings.update':    { method: 'PATCH', path: '/ai/settings' },
  'api.ai.tools.list':         { method: 'GET',  path: '/ai/tools' },
  'api.ai.tools.update':       { method: 'PATCH', path: '/ai/tools' },
  'api.ai.memory.list':        { method: 'GET',  path: '/ai/memory' },
  'api.ai.memory.delete':      { method: 'DELETE', path: '/ai/memory/:itemId' },
  'api.ai.memory.clear':       { method: 'DELETE', path: '/ai/memory' },
  'api.ai.scheduled.list':     { method: 'GET',  path: '/ai/scheduled' },
  'api.ai.scheduled.create':   { method: 'POST', path: '/ai/scheduled' },
  'api.ai.scheduled.detail':   { method: 'GET',  path: '/ai/scheduled/:actionId' },
  'api.ai.scheduled.cancel':   { method: 'DELETE', path: '/ai/scheduled/:actionId' },
  'api.ai.share.create':       { method: 'POST', path: '/ai/chat/:conversationId/share' },
  'api.ai.share.get':          { method: 'GET',  path: '/ai/share/:shareId' },
  'api.ai.share.revoke':       { method: 'DELETE', path: '/ai/chat/:conversationId/share' },
  'api.ai.notifications':      { method: 'GET',  path: '/ai/notifications' },

  // ---- Security ----
  'api.security.summary':      { method: 'GET',  path: '/security' },
  'api.security.2fa.setup':    { method: 'POST', path: '/2fa/setup' },
  'api.security.2fa.enable':   { method: 'POST', path: '/2fa/enable' },
  'api.security.2fa.disable':  { method: 'POST', path: '/2fa/disable' },
  'api.security.backup-codes': { method: 'POST', path: '/2fa/backup-codes' },
  'api.security.password.change': { method: 'POST', path: '/security/password' },
  'api.security.pin.status':   { method: 'GET',  path: '/security/pin/status' },
  'api.security.pin.otp':      { method: 'POST', path: '/security/pin/otp' },
  'api.security.pin.setup':    { method: 'POST', path: '/security/pin/setup' },
  'api.security.pin.change':   { method: 'POST', path: '/security/pin' },
  'api.security.pin.verify':   { method: 'POST', path: '/security/pin/verify' },
  'api.security.pin.reset':    { method: 'POST', path: '/security/pin/reset' },
  'api.security.sessions.list':{ method: 'GET',  path: '/user/sessions' },
  'api.security.sessions.revoke': { method: 'DELETE', path: '/user/sessions/:sessionId' },
  'api.security.sessions.revoke-all': { method: 'POST', path: '/user/sessions/revoke-all' },
  'api.security.anti-phishing.get': { method: 'GET',  path: '/user/anti-phishing' },
  'api.security.anti-phishing.set': { method: 'POST', path: '/user/anti-phishing' },

  // ---- Settings ----
  'api.settings.notifications.get':    { method: 'GET',  path: '/settings/notifications' },
  'api.settings.notifications.update': { method: 'PATCH', path: '/settings/notifications' },
  'api.settings.alerts.list':  { method: 'GET',  path: '/settings/alerts' },
  'api.settings.alerts.create':{ method: 'POST', path: '/settings/alerts' },
  'api.settings.alerts.update':{ method: 'PATCH', path: '/settings/alerts/:alertId' },
  'api.settings.alerts.delete':{ method: 'DELETE', path: '/settings/alerts/:alertId' },
  'api.settings.api-keys.list':{ method: 'GET',  path: '/settings/api-keys' },
  'api.settings.api-keys.create': { method: 'POST', path: '/settings/api-keys' },
  'api.settings.api-keys.delete': { method: 'DELETE', path: '/settings/api-keys/:keyId' },

  // ---- Fiat ----
  'api.fiat.quote':            { method: 'POST', path: '/fiat/quote' },
  'api.fiat.order.create':     { method: 'POST', path: '/fiat/orders' },
  'api.fiat.order.status':     { method: 'GET',  path: '/fiat/orders/:orderId' },
  'api.fiat.order.refresh':    { method: 'POST', path: '/fiat/orders/:orderId/refresh' },
  'api.fiat.sell.refresh':     { method: 'POST', path: '/fiat/sell/:orderId/refresh' },

  // ---- Engagement ----
  'api.rewards.summary':       { method: 'GET',  path: '/rewards' },
  'api.rewards.badges':        { method: 'GET',  path: '/rewards/badges' },
  'api.rewards.tiers':         { method: 'GET',  path: '/rewards/tiers' },
  'api.rewards.claim-daily':   { method: 'POST', path: '/rewards/daily' },
  /** Aggregated referral data — kept for backward-compat. New code should
   *  use the four endpoints below directly so we mirror production. */
  'api.referral.summary':      { method: 'GET',  path: '/referral' },
  /** Public — program metadata (commission %, min trade volume, cooldown). */
  'api.referral.info':         { method: 'GET',  path: '/referral/info' },
  /** Auth — the user's referral code + share link. */
  'api.referral.code':         { method: 'GET',  path: '/referral/code' },
  /** Auth — list of users referred (referrals + total). */
  'api.referral.referrals':    { method: 'GET',  path: '/referral/referrals' },
  /** Auth — rewards summary { total, pending, paid } + payout history. */
  'api.referral.rewards':      { method: 'GET',  path: '/referral/rewards' },
  /** Auth — totals { totalReferrals, activeReferrals, totalEarned, totalVolume } */
  'api.referral.stats':        { method: 'GET',  path: '/referral/stats' },
  /** Auth — apply someone else's code at signup time. */
  'api.referral.apply':        { method: 'POST', path: '/referral/apply' },
  /** Tier+referral commission system (volume-aggregator schema). */
  'api.referral.tier':         { method: 'GET',  path: '/referral/tier' },
  'api.referral.earnings':     { method: 'GET',  path: '/referral/earnings' },
  'api.referral.earnings.summary': { method: 'GET', path: '/referral/earnings/summary' },
  'api.referral.payouts':      { method: 'GET',  path: '/referral/payouts' },
  'api.referral.payouts.request': { method: 'POST', path: '/referral/payouts/request' },
  'api.referral.payouts.cancel':  { method: 'POST', path: '/referral/payouts/:id/cancel' },
  'api.notifications.list':    { method: 'GET',  path: '/notifications' },
  'api.notifications.read':    { method: 'POST', path: '/notifications/read' },
  'api.notifications.read-one': { method: 'PATCH', path: '/notifications/:id/read' },
  'api.notifications.delete':   { method: 'DELETE', path: '/notifications/:id' },
  /** Web Push: register the browser push subscription with the backend */
  'api.notifications.subscribe': { method: 'POST', path: '/notifications/subscribe' },
  'api.notifications.unsubscribe': { method: 'DELETE', path: '/notifications/subscribe' },
  /** Native push (Capacitor): register/unregister the device push token */
  'api.notifications.registerDevice': { method: 'POST', path: '/notifications/register-device' },
  'api.notifications.unregisterDevice': { method: 'DELETE', path: '/notifications/register-device' },
  'api.announcements.list':    { method: 'GET',  path: '/announcements' },

  // ---- Support ----
  'api.support.articles':      { method: 'GET',  path: '/support/articles' },
  'api.support.article':       { method: 'GET',  path: '/support/articles/:slug' },
  'api.support.tickets.list':  { method: 'GET',  path: '/support/tickets' },
  'api.support.tickets.create':{ method: 'POST', path: '/support/tickets' },
  'api.support.tickets.detail':{ method: 'GET',  path: '/support/tickets/:ticketId' },
  'api.support.tickets.reply': { method: 'POST', path: '/support/tickets/:ticketId/messages' },

  // ---- System ----
  'api.system.status':         { method: 'GET',  path: '/system/status' },
  'api.system.version':        { method: 'GET',  path: '/system/version' },

  // ---- Prices (public) ----
  'api.prices.list':           { method: 'GET',  path: '/prices' },

  // ---- Fiat currencies + payment methods (public) ----
  'api.fiat.currencies':       { method: 'GET',  path: '/fiat/currencies' },
} as const

export type EndpointId = keyof typeof ENDPOINTS

/**
 * Resolve endpoint id + params → URL path.
 */
export function endpointPath(id: EndpointId, params?: Record<string, string | number>): string {
  let path: string = ENDPOINTS[id].path
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(`:${k}`, encodeURIComponent(String(v)))
    }
  }
  return path
}
