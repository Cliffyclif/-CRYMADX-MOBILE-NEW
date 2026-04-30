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
  'api.auth.resend-code':      { method: 'POST', path: '/auth/resend-code' },
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
  'api.wallet.convert.quote':  { method: 'POST', path: '/wallet/convert/quote' },
  'api.wallet.convert.execute': { method: 'POST', path: '/wallet/convert/execute' },

  // ---- Transactions ----
  'api.tx.list':               { method: 'GET',  path: '/transactions' },
  'api.tx.get':                { method: 'GET',  path: '/transactions/:txId' },

  // ---- Beneficiaries ----
  'api.beneficiaries.list':    { method: 'GET',  path: '/beneficiaries' },
  'api.beneficiaries.create':  { method: 'POST', path: '/beneficiaries' },
  'api.beneficiaries.delete':  { method: 'DELETE', path: '/beneficiaries/:id' },

  // ---- Markets ----
  'api.markets.list':          { method: 'GET',  path: '/markets' },
  'api.markets.pair':          { method: 'GET',  path: '/markets/:pair' },
  'api.markets.candles':       { method: 'GET',  path: '/markets/:pair/candles' },
  'api.markets.orderbook':     { method: 'GET',  path: '/markets/:pair/orderbook' },
  /** Live trades stream — recent fills for a pair (Binance public proxy). */
  'api.markets.trades':        { method: 'GET',  path: '/markets/:pair/trades' },

  // ---- Trading ----
  'api.trading.order.create':  { method: 'POST', path: '/trading/orders' },
  'api.trading.order.cancel':  { method: 'DELETE', path: '/trading/orders/:orderId' },
  'api.trading.orders.open':   { method: 'GET',  path: '/trading/orders?status=open' },
  'api.trading.orders.history':{ method: 'GET',  path: '/trading/orders?status=history' },
  'api.trading.trades':        { method: 'GET',  path: '/trading/trades' },
  'api.trading.trade':         { method: 'GET',  path: '/trading/trades/:tradeId' },

  // ---- Earn ----
  'api.earn.savings.products': { method: 'GET',  path: '/earn/savings/products' },
  'api.earn.savings.deposit':  { method: 'POST', path: '/earn/savings/deposit' },
  'api.earn.savings.positions':{ method: 'GET',  path: '/earn/savings/positions' },
  'api.earn.staking.products': { method: 'GET',  path: '/earn/staking/products' },
  'api.earn.staking.stake':    { method: 'POST', path: '/earn/staking/stake' },
  'api.earn.staking.unstake':  { method: 'POST', path: '/earn/staking/unstake' },
  'api.earn.staking.positions':{ method: 'GET',  path: '/earn/staking/positions' },
  'api.earn.autoinvest.list':  { method: 'GET',  path: '/earn/auto-invest' },
  'api.earn.autoinvest.create':{ method: 'POST', path: '/earn/auto-invest' },
  'api.earn.autoinvest.update':{ method: 'PATCH', path: '/earn/auto-invest/:id' },
  'api.earn.vault.list':       { method: 'GET',  path: '/earn/vaults' },

  // ---- P2P ----
  'api.p2p.offers.list':       { method: 'GET',  path: '/p2p/offers' },
  'api.p2p.offer.get':         { method: 'GET',  path: '/p2p/offers/:offerId' },
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
  'api.security.2fa.enable':   { method: 'POST', path: '/security/2fa/enable' },
  'api.security.2fa.disable':  { method: 'POST', path: '/security/2fa/disable' },
  'api.security.backup-codes': { method: 'POST', path: '/security/backup-codes' },
  'api.security.password.change': { method: 'POST', path: '/security/password' },
  'api.security.pin.change':   { method: 'POST', path: '/security/pin' },
  'api.security.sessions.list':{ method: 'GET',  path: '/security/sessions' },
  'api.security.sessions.revoke': { method: 'DELETE', path: '/security/sessions/:sessionId' },

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

  // ---- Engagement ----
  'api.rewards.summary':       { method: 'GET',  path: '/rewards' },
  'api.rewards.badges':        { method: 'GET',  path: '/rewards/badges' },
  'api.rewards.tiers':         { method: 'GET',  path: '/rewards/tiers' },
  'api.rewards.claim-daily':   { method: 'POST', path: '/rewards/daily' },
  'api.referral.summary':      { method: 'GET',  path: '/referral' },
  'api.notifications.list':    { method: 'GET',  path: '/notifications' },
  'api.notifications.read':    { method: 'POST', path: '/notifications/read' },
  'api.notifications.read-one': { method: 'PATCH', path: '/notifications/:id/read' },
  'api.notifications.delete':   { method: 'DELETE', path: '/notifications/:id' },
  /** Web Push: register the browser push subscription with the backend */
  'api.notifications.subscribe': { method: 'POST', path: '/notifications/subscribe' },
  'api.notifications.unsubscribe': { method: 'DELETE', path: '/notifications/subscribe' },
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
