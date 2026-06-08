/**
 * ROUTE REGISTRY
 * --------------
 * Every screen path lives here once, keyed with a stable ID.
 * Screens never hardcode path strings — they use `routeFor(id, params)`.
 *
 * Adding a new screen:
 *   1. Append an entry below with a stable ID and path.
 *   2. Import the component and wire it in App.tsx.
 *   3. Tick it off in PROGRESS.md.
 */

export const ROUTES = {
  // Boot & auth
  'route.splash':              { path: '/' },
  'route.onboarding':          { path: '/onboarding' },
  'route.auth.register':       { path: '/register' },
  'route.auth.verify-email':   { path: '/verify-email' },
  'route.auth.complete-profile': { path: '/complete-profile' },
  'route.auth.login':          { path: '/login' },
  'route.auth.login-2fa':      { path: '/login/2fa' },
  'route.auth.forgot':         { path: '/forgot-password' },
  'route.auth.reset':          { path: '/reset-password' },
  'route.auth.biometric':      { path: '/biometric-setup' },

  // Tab roots
  'route.tab.home':            { path: '/home' },
  'route.tab.markets':         { path: '/markets' },
  'route.tab.ai':              { path: '/ai' },
  'route.tab.wallet':          { path: '/wallet' },
  'route.tab.profile':         { path: '/profile' },

  // Wallet flow
  'route.wallet.deposit-pick': { path: '/wallet/deposit' },
  'route.wallet.deposit':      { path: '/wallet/deposit/:asset' },
  'route.wallet.withdraw':     { path: '/wallet/withdraw' },
  'route.wallet.withdraw.confirm': { path: '/wallet/withdraw/confirm' },
  'route.wallet.convert':      { path: '/wallet/convert' },
  'route.wallet.convert.confirm': { path: '/wallet/convert/confirm' },
  'route.wallet.asset':        { path: '/wallet/asset/:symbol' },
  'route.wallet.tx-history':   { path: '/wallet/transactions' },
  'route.wallet.tx-detail':    { path: '/wallet/transactions/:txId' },
  'route.wallet.beneficiaries': { path: '/wallet/beneficiaries' },
  'route.wallet.whitelist.confirm': { path: '/wallet/whitelist/confirm' },

  // Trading
  'route.trading.spot':        { path: '/trade/:pair' },
  'route.trading.confirm':     { path: '/trade/confirm' },
  'route.trading.activity':    { path: '/trade/activity' },
  'route.trading.detail':      { path: '/trade/:tradeId/detail' },

  // Earn
  'route.earn.hub':            { path: '/earn' },
  'route.earn.savings':        { path: '/earn/savings' },
  'route.earn.savings.detail': { path: '/earn/savings/:productId' },
  'route.earn.savings.deposit':{ path: '/earn/savings/:productId/deposit' },
  'route.earn.staking':        { path: '/earn/staking' },
  'route.earn.unstake':        { path: '/earn/staking/unstake' },
  'route.earn.autoinvest':     { path: '/earn/auto-invest' },
  'route.earn.vault':          { path: '/earn/vault' },

  // Education (Academy)
  'route.education.home':      { path: '/learn' },
  'route.education.explore':   { path: '/learn/explore' },
  'route.education.my-courses':{ path: '/learn/my-courses' },
  'route.education.tracks':    { path: '/learn/tracks' },
  'route.education.certificates': { path: '/learn/certificates' },
  'route.education.course':    { path: '/learn/course/:slug' },
  'route.education.player':    { path: '/learn/course/:slug/lesson/:lessonId' },

  // P2P
  'route.p2p.market':          { path: '/p2p' },
  'route.p2p.offer':           { path: '/p2p/offer/:offerId' },
  'route.p2p.order':           { path: '/p2p/order/:orderId' },
  'route.p2p.chat':            { path: '/p2p/order/:orderId/chat' },
  'route.p2p.payments':        { path: '/p2p/payment-methods' },

  // Card
  'route.card.hub':            { path: '/card' },
  'route.card.topup':          { path: '/card/top-up' },
  'route.card.settings':       { path: '/card/settings' },
  'route.card.transactions':   { path: '/card/transactions' },
  'route.card.onboarding':     { path: '/card/apply' },

  // NFT
  'route.nft.gallery':         { path: '/nft' },
  'route.nft.market':          { path: '/nft/marketplace' },
  'route.nft.detail':          { path: '/nft/:nftId' },
  'route.nft.send':            { path: '/nft/:nftId/send' },

  // AI
  'route.ai.voice':            { path: '/ai/voice' },
  'route.ai.history':          { path: '/ai/history' },
  'route.ai.conversation':     { path: '/ai/conversation/:conversationId' },
  'route.ai.settings':         { path: '/ai/settings' },
  'route.ai.voice-settings':   { path: '/ai/settings/voice' },
  'route.ai.tools':            { path: '/ai/settings/tools' },
  'route.ai.memory':           { path: '/ai/memory' },
  'route.ai.scheduled':        { path: '/ai/scheduled' },
  'route.ai.action':           { path: '/ai/scheduled/:actionId' },
  'route.ai.share':            { path: '/ai/share/:conversationId' },
  'route.ai.shared-viewer':    { path: '/share/:shareId' },
  'route.ai.pin':              { path: '/ai/settings/pin' },
  'route.ai.onboarding':       { path: '/ai/onboarding' },
  'route.ai.notifications':    { path: '/ai/notifications' },

  // Security
  'route.security.hub':        { path: '/security' },
  'route.security.2fa':        { path: '/security/2fa' },
  'route.security.backup-codes': { path: '/security/backup-codes' },
  'route.security.password':   { path: '/security/password' },
  'route.security.pin':        { path: '/security/pin' },
  'route.security.sessions':   { path: '/security/sessions' },
  'route.security.anti-phishing': { path: '/security/anti-phishing' },

  // KYC
  'route.kyc.status':          { path: '/kyc' },
  'route.kyc.flow':            { path: '/kyc/verify' },
  'route.kyc.pending':         { path: '/kyc/pending' },
  'route.kyc.levels':          { path: '/kyc/levels' },

  // Settings
  'route.settings.notifications': { path: '/settings/notifications' },
  'route.settings.theme':      { path: '/settings/theme' },
  'route.settings.language':   { path: '/settings/language' },
  'route.settings.currency':   { path: '/settings/currency' },
  'route.settings.alerts':     { path: '/settings/alerts' },
  'route.settings.alert-edit': { path: '/settings/alerts/edit' },
  'route.settings.developer':  { path: '/settings/developer' },
  'route.settings.api-keys':   { path: '/settings/api-keys' },
  'route.settings.api-key':    { path: '/settings/api-keys/:keyId' },
  'route.settings.ecosystem':  { path: '/settings/ecosystem' },

  // Fiat
  'route.fiat.buy':            { path: '/buy' },
  'route.fiat.confirm':        { path: '/buy/confirm' },
  'route.fiat.gateway':        { path: '/buy/gateway' },
  'route.fiat.status':         { path: '/buy/status/:orderId' },

  // Engagement
  'route.engage.rewards':      { path: '/rewards' },
  'route.engage.tier':         { path: '/rewards/tier' },
  'route.engage.referral':     { path: '/refer' },
  'route.engage.notifications':{ path: '/notifications' },
  'route.engage.announcements':{ path: '/announcements' },

  // Support
  'route.support.help':        { path: '/help' },
  'route.support.article':     { path: '/help/article/:slug' },
  'route.support.tickets':     { path: '/help/tickets' },
  'route.support.ticket':      { path: '/help/tickets/:ticketId' },
  'route.support.contact':     { path: '/help/contact' },

  // Legal & misc
  'route.legal.terms':         { path: '/legal/terms' },
  'route.legal.privacy':       { path: '/legal/privacy' },
  'route.legal.cookies':       { path: '/legal/cookies' },
  'route.legal.about':         { path: '/about' },
  'route.legal.status':        { path: '/status' },
  'route.misc.scan-qr':        { path: '/scan' },
  'route.misc.debug':          { path: '/debug' },
  'route.misc.services':       { path: '/services' },

  // System states (rendered via component-level conditions, not direct routes,
  // but registered here for completeness and deep-linking)
  'route.system.offline':      { path: '/offline' },
  'route.system.force-update': { path: '/update' },
} as const

export type RouteId = keyof typeof ROUTES

/**
 * Resolve a route ID + params → URL path.
 * Replaces `:foo` segments with corresponding param values.
 */
export function routeFor<T extends RouteId>(id: T, params?: Record<string, string | number>): string {
  let path: string = ROUTES[id].path
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(`:${k}`, encodeURIComponent(String(v)))
    }
  }
  return path
}

/** All route paths, for the router config */
export const ALL_ROUTES = Object.entries(ROUTES).map(([id, def]) => ({
  id: id as RouteId,
  path: def.path,
}))

/**
 * Routes that do NOT require authentication.
 * Anything not listed here is gated by ProtectedRoute.
 */
export const PUBLIC_ROUTES: RouteId[] = [
  'route.splash',
  'route.onboarding',
  'route.auth.register',
  'route.auth.verify-email',
  'route.auth.complete-profile',
  'route.auth.login',
  'route.auth.login-2fa',
  'route.auth.forgot',
  'route.auth.reset',
  'route.auth.biometric',
  'route.legal.terms',
  'route.legal.privacy',
  'route.legal.cookies',
  'route.legal.about',
  'route.legal.status',
  'route.ai.shared-viewer', // public share viewer
  'route.system.offline',
  'route.system.force-update',
]

/** Routes that show the bottom tab bar */
export const TAB_ROUTES: RouteId[] = [
  'route.tab.home',
  'route.tab.markets',
  'route.tab.ai',
  'route.tab.wallet',
  'route.tab.profile',
]
