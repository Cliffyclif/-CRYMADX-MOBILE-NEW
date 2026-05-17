/**
 * App — top-level router.
 * Public routes are open. Anything else is wrapped in <ProtectedRoute>.
 *
 * Routes are CODE-SPLIT: every screen is a React.lazy() chunk so the
 * initial bundle is just the shell + entry screen instead of all 110+
 * screens. Vite emits one small chunk per screen; React Query / framer /
 * charts split out automatically via manualChunks (see vite.config.ts).
 * Only the Splash entry screen is eager so first paint has nothing to wait
 * on — the native Capacitor splash covers the rest while chunks stream in.
 */

import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './components/ProtectedRoute'
import { IconSprite } from './components/Icon'
import { ROUTES } from './routes'

// Eager — the entry screen. Everything else is lazy (below).
import { Splash } from './screens/auth/Splash'

/**
 * lazyScreen — wraps a named-export screen module as a React.lazy chunk.
 * The screens use named exports, so we remap `{ X }` → `{ default: X }`.
 * The import() string must stay a literal for Vite to split the chunk.
 */
function lazyScreen<M extends Record<string, unknown>, K extends keyof M>(
  loader: () => Promise<M>,
  key: K,
) {
  return lazy(async () => ({ default: (await loader())[key] as ComponentType }))
}

// Phase 1 — auth + tab roots + wallet flow
const Login = lazyScreen(() => import('./screens/auth/Login'), 'Login')
const Register = lazyScreen(() => import('./screens/auth/Register'), 'Register')
const VerifyEmail = lazyScreen(() => import('./screens/auth/VerifyEmail'), 'VerifyEmail')
const Home = lazyScreen(() => import('./screens/tabs/Home'), 'Home')
const Markets = lazyScreen(() => import('./screens/tabs/Markets'), 'Markets')
const AIChat = lazyScreen(() => import('./screens/tabs/AIChat'), 'AIChat')
const Wallet = lazyScreen(() => import('./screens/tabs/Wallet'), 'Wallet')
const Profile = lazyScreen(() => import('./screens/tabs/Profile'), 'Profile')
const DepositPick = lazyScreen(() => import('./screens/wallet/DepositPick'), 'DepositPick')
const Deposit = lazyScreen(() => import('./screens/wallet/Deposit'), 'Deposit')
const Withdraw = lazyScreen(() => import('./screens/wallet/Withdraw'), 'Withdraw')
const WithdrawConfirm = lazyScreen(() => import('./screens/wallet/WithdrawConfirm'), 'WithdrawConfirm')
const TxHistory = lazyScreen(() => import('./screens/wallet/TxHistory'), 'TxHistory')
const TxDetail = lazyScreen(() => import('./screens/wallet/TxDetail'), 'TxDetail')

// Phase 2 — wallet remainder
const Convert = lazyScreen(() => import('./screens/wallet/Convert'), 'Convert')
const ConvertConfirm = lazyScreen(() => import('./screens/wallet/ConvertConfirm'), 'ConvertConfirm')
const AssetDetail = lazyScreen(() => import('./screens/wallet/AssetDetail'), 'AssetDetail')
const Beneficiaries = lazyScreen(() => import('./screens/wallet/Beneficiaries'), 'Beneficiaries')
const WhitelistConfirm = lazyScreen(() => import('./screens/wallet/WhitelistConfirm'), 'WhitelistConfirm')

// Phase 2 — trading
const SpotTrading = lazyScreen(() => import('./screens/trading/SpotTrading'), 'SpotTrading')
const OrderConfirm = lazyScreen(() => import('./screens/trading/OrderConfirm'), 'OrderConfirm')
const Activity = lazyScreen(() => import('./screens/trading/Activity'), 'Activity')
const TradeDetail = lazyScreen(() => import('./screens/trading/TradeDetail'), 'TradeDetail')

// Phase 2 — earn
const EarnHub = lazyScreen(() => import('./screens/earn/EarnHub'), 'EarnHub')
const Savings = lazyScreen(() => import('./screens/earn/Savings'), 'Savings')
const SavingsDetail = lazyScreen(() => import('./screens/earn/SavingsDetail'), 'SavingsDetail')
const SavingsDeposit = lazyScreen(() => import('./screens/earn/SavingsDeposit'), 'SavingsDeposit')
const Staking = lazyScreen(() => import('./screens/earn/Staking'), 'Staking')
const Unstake = lazyScreen(() => import('./screens/earn/Unstake'), 'Unstake')
const AutoInvest = lazyScreen(() => import('./screens/earn/AutoInvest'), 'AutoInvest')
const Vault = lazyScreen(() => import('./screens/earn/Vault'), 'Vault')

// Phase 2 — fiat
const BuyCrypto = lazyScreen(() => import('./screens/fiat/BuyCrypto'), 'BuyCrypto')
const FiatOrderConfirm = lazyScreen(() => import('./screens/fiat/FiatOrderConfirm'), 'FiatOrderConfirm')
const Guardarian = lazyScreen(() => import('./screens/fiat/Guardarian'), 'Guardarian')
const FiatOrderStatus = lazyScreen(() => import('./screens/fiat/FiatOrderStatus'), 'FiatOrderStatus')

// Phase 3 — AI
const VoiceMode = lazyScreen(() => import('./screens/ai/VoiceMode'), 'VoiceMode')
const ChatHistory = lazyScreen(() => import('./screens/ai/ChatHistory'), 'ChatHistory')
const ConversationDetail = lazyScreen(() => import('./screens/ai/ConversationDetail'), 'ConversationDetail')
const AISettingsScreen = lazyScreen(() => import('./screens/ai/AISettings'), 'AISettingsScreen')
const AIVoiceSettings = lazyScreen(() => import('./screens/ai/AIVoiceSettings'), 'AIVoiceSettings')
const AITools = lazyScreen(() => import('./screens/ai/AITools'), 'AITools')
const AIMemory = lazyScreen(() => import('./screens/ai/AIMemory'), 'AIMemory')
const AIScheduled = lazyScreen(() => import('./screens/ai/AIScheduled'), 'AIScheduled')
const AIActionDetail = lazyScreen(() => import('./screens/ai/AIActionDetail'), 'AIActionDetail')
const AIShareScreen = lazyScreen(() => import('./screens/ai/AIShare'), 'AIShareScreen')
const AISharedViewer = lazyScreen(() => import('./screens/ai/AISharedViewer'), 'AISharedViewer')
const AIPinSettings = lazyScreen(() => import('./screens/ai/AIPinSettings'), 'AIPinSettings')
const AIOnboarding = lazyScreen(() => import('./screens/ai/AIOnboarding'), 'AIOnboarding')
const AINotifications = lazyScreen(() => import('./screens/ai/AINotifications'), 'AINotifications')

// Phase 3 — P2P
const Marketplace = lazyScreen(() => import('./screens/p2p/Marketplace'), 'Marketplace')
const OfferDetail = lazyScreen(() => import('./screens/p2p/OfferDetail'), 'OfferDetail')
const P2POrderScreen = lazyScreen(() => import('./screens/p2p/Order'), 'Order')
const P2PChatScreen = lazyScreen(() => import('./screens/p2p/Chat'), 'Chat')
const PaymentMethods = lazyScreen(() => import('./screens/p2p/PaymentMethods'), 'PaymentMethods')

// Phase 3 — Card
const CardHub = lazyScreen(() => import('./screens/card/CardHub'), 'CardHub')
const CardTopUp = lazyScreen(() => import('./screens/card/CardTopUp'), 'CardTopUp')
const CardSettingsScreen = lazyScreen(() => import('./screens/card/CardSettingsScreen'), 'CardSettingsScreen')
const CardTransactions = lazyScreen(() => import('./screens/card/CardTransactions'), 'CardTransactions')
const CardOnboarding = lazyScreen(() => import('./screens/card/CardOnboarding'), 'CardOnboarding')

// Phase 3 — NFT
const NFTGallery = lazyScreen(() => import('./screens/nft/NFTGallery'), 'NFTGallery')
const NFTMarketplace = lazyScreen(() => import('./screens/nft/NFTMarketplace'), 'NFTMarketplace')
const NFTDetail = lazyScreen(() => import('./screens/nft/NFTDetail'), 'NFTDetail')
const NFTSend = lazyScreen(() => import('./screens/nft/NFTSend'), 'NFTSend')

// Phase 4 — Onboarding + auth fillers
const Onboarding = lazyScreen(() => import('./screens/auth/Onboarding'), 'Onboarding')
const CompleteProfile = lazyScreen(() => import('./screens/auth/CompleteProfile'), 'CompleteProfile')
const Login2FA = lazyScreen(() => import('./screens/auth/Login2FA'), 'Login2FA')
const ForgotPassword = lazyScreen(() => import('./screens/auth/ForgotPassword'), 'ForgotPassword')
const ResetPassword = lazyScreen(() => import('./screens/auth/ResetPassword'), 'ResetPassword')
const BiometricSetup = lazyScreen(() => import('./screens/auth/BiometricSetup'), 'BiometricSetup')

// Phase 4 — Security
const SecurityHub = lazyScreen(() => import('./screens/security/SecurityHub'), 'SecurityHub')
const TwoFactorSetup = lazyScreen(() => import('./screens/security/TwoFactorSetup'), 'TwoFactorSetup')
const BackupCodes = lazyScreen(() => import('./screens/security/BackupCodes'), 'BackupCodes')
const ChangePassword = lazyScreen(() => import('./screens/security/ChangePassword'), 'ChangePassword')
const ChangePin = lazyScreen(() => import('./screens/security/ChangePin'), 'ChangePin')
const Sessions = lazyScreen(() => import('./screens/security/Sessions'), 'Sessions')
const AntiPhishing = lazyScreen(() => import('./screens/security/AntiPhishing'), 'AntiPhishing')

// Phase 4 — KYC
const KYCStatus = lazyScreen(() => import('./screens/kyc/KYCStatus'), 'KYCStatus')
const KYCFlow = lazyScreen(() => import('./screens/kyc/KYCFlow'), 'KYCFlow')
const KYCPending = lazyScreen(() => import('./screens/kyc/KYCPending'), 'KYCPending')
const KYCLevelInfo = lazyScreen(() => import('./screens/kyc/KYCLevelInfo'), 'KYCLevelInfo')

// Phase 4 — Settings
const NotificationsSettings = lazyScreen(() => import('./screens/settings/NotificationsSettings'), 'NotificationsSettings')
const Theme = lazyScreen(() => import('./screens/settings/Theme'), 'Theme')
const Language = lazyScreen(() => import('./screens/settings/Language'), 'Language')
const Currency = lazyScreen(() => import('./screens/settings/Currency'), 'Currency')
const PriceAlerts = lazyScreen(() => import('./screens/settings/PriceAlerts'), 'PriceAlerts')
const PriceAlertEdit = lazyScreen(() => import('./screens/settings/PriceAlertEdit'), 'PriceAlertEdit')
const Developer = lazyScreen(() => import('./screens/settings/Developer'), 'Developer')
const ApiKeys = lazyScreen(() => import('./screens/settings/ApiKeys'), 'ApiKeys')
const ApiKeyDetail = lazyScreen(() => import('./screens/settings/ApiKeyDetail'), 'ApiKeyDetail')
const Ecosystem = lazyScreen(() => import('./screens/settings/Ecosystem'), 'Ecosystem')

// Phase 4 — Engagement
const Rewards = lazyScreen(() => import('./screens/engage/Rewards'), 'Rewards')
const TierDetail = lazyScreen(() => import('./screens/engage/TierDetail'), 'TierDetail')
const Referral = lazyScreen(() => import('./screens/engage/Referral'), 'Referral')
const EngageNotifications = lazyScreen(() => import('./screens/engage/Notifications'), 'Notifications')
const Announcements = lazyScreen(() => import('./screens/engage/Announcements'), 'Announcements')

// Phase 4 — Support
const HelpCenter = lazyScreen(() => import('./screens/support/HelpCenter'), 'HelpCenter')
const Article = lazyScreen(() => import('./screens/support/Article'), 'Article')
const Tickets = lazyScreen(() => import('./screens/support/Tickets'), 'Tickets')
const TicketDetail = lazyScreen(() => import('./screens/support/TicketDetail'), 'TicketDetail')
const Contact = lazyScreen(() => import('./screens/support/Contact'), 'Contact')

// Phase 4 — Legal & Misc
const Terms = lazyScreen(() => import('./screens/legal/Terms'), 'Terms')
const Privacy = lazyScreen(() => import('./screens/legal/Privacy'), 'Privacy')
const Cookie = lazyScreen(() => import('./screens/legal/Cookie'), 'Cookie')
const About = lazyScreen(() => import('./screens/legal/About'), 'About')
const Status = lazyScreen(() => import('./screens/legal/Status'), 'Status')
const ScanQR = lazyScreen(() => import('./screens/misc/ScanQR'), 'ScanQR')
const AssetSelector = lazyScreen(() => import('./screens/misc/AssetSelector'), 'AssetSelector')
const PairSelector = lazyScreen(() => import('./screens/misc/PairSelector'), 'PairSelector')
const Debug = lazyScreen(() => import('./screens/misc/Debug'), 'Debug')
const Services = lazyScreen(() => import('./screens/misc/Services'), 'Services')

// Phase 4 — System states
const Offline = lazyScreen(() => import('./screens/system/Offline'), 'Offline')
const ForceUpdate = lazyScreen(() => import('./screens/system/ForceUpdate'), 'ForceUpdate')

const NotFound = lazyScreen(() => import('./screens/NotFound'), 'NotFound')

// Initialize theme from localStorage on app load
import './stores/theme'
import { useApplyDisplayScale } from './stores/display'
import { useLiveNotifications } from './hooks/useLiveNotifications'
import { useCapacitorAppState } from './hooks/useCapacitorAppState'
import { ErrorBoundary } from './components/ErrorBoundary'
import { NotificationToast } from './components/NotificationToast'
import { listenForNotificationClicks, registerServiceWorker } from './lib/webPush'
import { setNativePushNavHandler, maybePromptNativePush } from './lib/nativePush'
import { useAuth } from './stores/auth'
import { Toaster as SonnerToaster } from 'sonner'

// Register the runtime SW cache on app boot (no-op if already registered).
// Caches: app shell, hashed assets, static images, external coin icons.
// Hard-bypassed for /api/ and any Authorization-bearing request.
if (typeof window !== 'undefined') {
  void registerServiceWorker()
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tuned for a calmer feel — was very chatty (refetched every 20s + on
      // every focus). New rule of thumb:
      //   staleTime 60s — most data stays fresh long enough to skip a refetch
      //                   on screen reopen / tab switch
      //   gcTime 10min — keep results in memory after unmount so revisiting
      //                   a screen feels instant (TanStack 5 alias for cacheTime)
      //   refetchInterval false — opt-in per query (markets/balances do their
      //                            own polling); avoids hammering the gateway
      //   refetchOnWindowFocus only when stale — natural feel on tab switch.
      //   NOTE: on the Capacitor native build, browser focus events don't
      //   fire on app resume — useCapacitorAppState bridges that into the
      //   focusManager so balances refresh when you reopen the app.
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      retry: 1,
    },
  },
})

/** Minimal full-screen loader shown while a route chunk streams in. */
function RouteFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#060d09',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: '3px solid rgba(255,255,255,0.15)',
          borderTopColor: '#3ddc84',
          borderRadius: '50%',
          animation: 'crymadx-spin 0.7s linear infinite',
        }}
      />
      <style>{'@keyframes crymadx-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

function AppInner() {
  useApplyDisplayScale()
  // Bridges Capacitor app-resume → React Query focus + hides the native
  // splash once React has painted. No-op on the plain web build.
  useCapacitorAppState()
  // Polls /api/notifications while signed in, pushes new ones to the toast queue.
  useLiveNotifications()
  // When a user taps a system push notification while the app is closed/hidden,
  // the Service Worker postMessages us with { type: 'navigate', href }. Route to it.
  const nav = useNavigate()
  const authUser = useAuth(s => s.user)
  useEffect(() => {
    // Web Push (browser): the SW postMessages { type:'navigate', href } on tap.
    listenForNotificationClicks((href) => {
      try { nav(href) } catch { /* ignore bad href */ }
    })
    // Native push (FCM): a tapped system notification routes to its deep link.
    setNativePushNavHandler((href) => {
      try { nav(href) } catch { /* ignore bad href */ }
    })
  }, [nav])
  // Auto opt-in to native OS push once, after the user is signed in (native
  // build only — no-ops in the browser). A Settings toggle also controls it.
  useEffect(() => {
    if (authUser) void maybePromptNativePush()
  }, [authUser])
  return (
    <>
      <IconSprite />
      <NotificationToast />
      <SonnerToaster
        position="top-center"
        theme="dark"
        richColors
        closeButton={false}
        toastOptions={{ style: { background: 'rgba(20,22,28,.95)', border: '1px solid rgba(255,255,255,.08)', color: 'var(--text-strong)' } }}
      />
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path={ROUTES['route.splash'].path} element={<Splash />} />
          <Route path={ROUTES['route.auth.login'].path} element={<Login />} />
          <Route path={ROUTES['route.auth.register'].path} element={<Register />} />
          <Route path={ROUTES['route.auth.verify-email'].path} element={<VerifyEmail />} />

          {/* Tab roots */}
          <Route path={ROUTES['route.tab.home'].path}    element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path={ROUTES['route.tab.markets'].path} element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path={ROUTES['route.tab.ai'].path}      element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
          <Route path={ROUTES['route.tab.wallet'].path}  element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path={ROUTES['route.tab.profile'].path} element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Wallet */}
          <Route path={ROUTES['route.wallet.deposit-pick'].path}   element={<ProtectedRoute><DepositPick /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.deposit'].path}        element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.withdraw'].path}       element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.withdraw.confirm'].path} element={<ProtectedRoute><WithdrawConfirm /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.convert'].path}        element={<ProtectedRoute><Convert /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.convert.confirm'].path} element={<ProtectedRoute><ConvertConfirm /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.asset'].path}          element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.tx-history'].path}     element={<ProtectedRoute><TxHistory /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.tx-detail'].path}      element={<ProtectedRoute><TxDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.wallet.beneficiaries'].path}  element={<ProtectedRoute><Beneficiaries /></ProtectedRoute>} />
          {/* Public — confirms an address whitelist entry from the email link.
              Token in the URL is the proof; no auth required so the user can
              click from any browser/device, even logged-out. */}
          <Route path={ROUTES['route.wallet.whitelist.confirm'].path} element={<WhitelistConfirm />} />

          {/* Trading */}
          <Route path={ROUTES['route.trading.spot'].path}     element={<ProtectedRoute><SpotTrading /></ProtectedRoute>} />
          <Route path={ROUTES['route.trading.confirm'].path}  element={<ProtectedRoute><OrderConfirm /></ProtectedRoute>} />
          <Route path={ROUTES['route.trading.activity'].path} element={<ProtectedRoute><Activity /></ProtectedRoute>} />
          <Route path={ROUTES['route.trading.detail'].path}   element={<ProtectedRoute><TradeDetail /></ProtectedRoute>} />

          {/* Earn */}
          <Route path={ROUTES['route.earn.hub'].path}             element={<ProtectedRoute><EarnHub /></ProtectedRoute>} />
          <Route path={ROUTES['route.earn.savings'].path}         element={<ProtectedRoute><Savings /></ProtectedRoute>} />
          <Route path={ROUTES['route.earn.savings.detail'].path}  element={<ProtectedRoute><SavingsDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.earn.savings.deposit'].path} element={<ProtectedRoute><SavingsDeposit /></ProtectedRoute>} />
          <Route path={ROUTES['route.earn.staking'].path}         element={<ProtectedRoute><Staking /></ProtectedRoute>} />
          <Route path={ROUTES['route.earn.unstake'].path}         element={<ProtectedRoute><Unstake /></ProtectedRoute>} />
          <Route path={ROUTES['route.earn.autoinvest'].path}      element={<ProtectedRoute><AutoInvest /></ProtectedRoute>} />
          <Route path={ROUTES['route.earn.vault'].path}           element={<ProtectedRoute><Vault /></ProtectedRoute>} />

          {/* Fiat */}
          <Route path={ROUTES['route.fiat.buy'].path}     element={<ProtectedRoute><BuyCrypto /></ProtectedRoute>} />
          <Route path={ROUTES['route.fiat.confirm'].path} element={<ProtectedRoute><FiatOrderConfirm /></ProtectedRoute>} />
          <Route path={ROUTES['route.fiat.gateway'].path} element={<ProtectedRoute><Guardarian /></ProtectedRoute>} />
          <Route path={ROUTES['route.fiat.status'].path}  element={<ProtectedRoute><FiatOrderStatus /></ProtectedRoute>} />

          {/* AI */}
          <Route path={ROUTES['route.ai.voice'].path}          element={<ProtectedRoute><VoiceMode /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.history'].path}        element={<ProtectedRoute><ChatHistory /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.conversation'].path}   element={<ProtectedRoute><ConversationDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.settings'].path}       element={<ProtectedRoute><AISettingsScreen /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.voice-settings'].path} element={<ProtectedRoute><AIVoiceSettings /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.tools'].path}          element={<ProtectedRoute><AITools /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.memory'].path}         element={<ProtectedRoute><AIMemory /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.scheduled'].path}      element={<ProtectedRoute><AIScheduled /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.action'].path}         element={<ProtectedRoute><AIActionDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.share'].path}          element={<ProtectedRoute><AIShareScreen /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.shared-viewer'].path}  element={<AISharedViewer />} />
          <Route path={ROUTES['route.ai.pin'].path}            element={<ProtectedRoute><AIPinSettings /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.onboarding'].path}     element={<ProtectedRoute><AIOnboarding /></ProtectedRoute>} />
          <Route path={ROUTES['route.ai.notifications'].path}  element={<ProtectedRoute><AINotifications /></ProtectedRoute>} />

          {/* P2P */}
          <Route path={ROUTES['route.p2p.market'].path}   element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
          <Route path={ROUTES['route.p2p.offer'].path}    element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.p2p.order'].path}    element={<ProtectedRoute><P2POrderScreen /></ProtectedRoute>} />
          <Route path={ROUTES['route.p2p.chat'].path}     element={<ProtectedRoute><P2PChatScreen /></ProtectedRoute>} />
          <Route path={ROUTES['route.p2p.payments'].path} element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />

          {/* Card */}
          <Route path={ROUTES['route.card.hub'].path}          element={<ProtectedRoute><CardHub /></ProtectedRoute>} />
          <Route path={ROUTES['route.card.topup'].path}        element={<ProtectedRoute><CardTopUp /></ProtectedRoute>} />
          <Route path={ROUTES['route.card.settings'].path}     element={<ProtectedRoute><CardSettingsScreen /></ProtectedRoute>} />
          <Route path={ROUTES['route.card.transactions'].path} element={<ProtectedRoute><CardTransactions /></ProtectedRoute>} />
          <Route path={ROUTES['route.card.onboarding'].path}   element={<ProtectedRoute><CardOnboarding /></ProtectedRoute>} />

          {/* NFT */}
          <Route path={ROUTES['route.nft.gallery'].path} element={<ProtectedRoute><NFTGallery /></ProtectedRoute>} />
          <Route path={ROUTES['route.nft.market'].path}  element={<ProtectedRoute><NFTMarketplace /></ProtectedRoute>} />
          <Route path={ROUTES['route.nft.detail'].path}  element={<ProtectedRoute><NFTDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.nft.send'].path}    element={<ProtectedRoute><NFTSend /></ProtectedRoute>} />

          {/* Onboarding + remaining auth */}
          <Route path={ROUTES['route.onboarding'].path}              element={<Onboarding />} />
          <Route path={ROUTES['route.auth.complete-profile'].path}    element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
          <Route path={ROUTES['route.auth.login-2fa'].path}           element={<Login2FA />} />
          <Route path={ROUTES['route.auth.forgot'].path}              element={<ForgotPassword />} />
          <Route path={ROUTES['route.auth.reset'].path}               element={<ResetPassword />} />
          <Route path={ROUTES['route.auth.biometric'].path}           element={<ProtectedRoute><BiometricSetup /></ProtectedRoute>} />

          {/* Security */}
          <Route path={ROUTES['route.security.hub'].path}             element={<ProtectedRoute><SecurityHub /></ProtectedRoute>} />
          <Route path={ROUTES['route.security.2fa'].path}             element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />
          <Route path={ROUTES['route.security.backup-codes'].path}    element={<ProtectedRoute><BackupCodes /></ProtectedRoute>} />
          <Route path={ROUTES['route.security.password'].path}        element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path={ROUTES['route.security.pin'].path}             element={<ProtectedRoute><ChangePin /></ProtectedRoute>} />
          <Route path={ROUTES['route.security.sessions'].path}        element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path={ROUTES['route.security.anti-phishing'].path}   element={<ProtectedRoute><AntiPhishing /></ProtectedRoute>} />

          {/* KYC */}
          <Route path={ROUTES['route.kyc.status'].path}    element={<ProtectedRoute><KYCStatus /></ProtectedRoute>} />
          <Route path={ROUTES['route.kyc.flow'].path}      element={<ProtectedRoute><KYCFlow /></ProtectedRoute>} />
          <Route path={ROUTES['route.kyc.pending'].path}   element={<ProtectedRoute><KYCPending /></ProtectedRoute>} />
          <Route path={ROUTES['route.kyc.levels'].path}    element={<ProtectedRoute><KYCLevelInfo /></ProtectedRoute>} />

          {/* Settings */}
          <Route path={ROUTES['route.settings.notifications'].path} element={<ProtectedRoute><NotificationsSettings /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.theme'].path}         element={<ProtectedRoute><Theme /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.language'].path}      element={<ProtectedRoute><Language /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.currency'].path}      element={<ProtectedRoute><Currency /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.alerts'].path}        element={<ProtectedRoute><PriceAlerts /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.alert-edit'].path}    element={<ProtectedRoute><PriceAlertEdit /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.developer'].path}     element={<ProtectedRoute><Developer /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.api-keys'].path}      element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.api-key'].path}       element={<ProtectedRoute><ApiKeyDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.settings.ecosystem'].path}     element={<ProtectedRoute><Ecosystem /></ProtectedRoute>} />

          {/* Engagement */}
          <Route path={ROUTES['route.engage.rewards'].path}        element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
          <Route path={ROUTES['route.engage.tier'].path}           element={<ProtectedRoute><TierDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.engage.referral'].path}       element={<ProtectedRoute><Referral /></ProtectedRoute>} />
          <Route path={ROUTES['route.engage.notifications'].path}  element={<ProtectedRoute><EngageNotifications /></ProtectedRoute>} />
          <Route path={ROUTES['route.engage.announcements'].path}  element={<ProtectedRoute><Announcements /></ProtectedRoute>} />

          {/* Support */}
          <Route path={ROUTES['route.support.help'].path}    element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
          <Route path={ROUTES['route.support.article'].path} element={<ProtectedRoute><Article /></ProtectedRoute>} />
          <Route path={ROUTES['route.support.tickets'].path} element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
          <Route path={ROUTES['route.support.ticket'].path}  element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
          <Route path={ROUTES['route.support.contact'].path} element={<ProtectedRoute><Contact /></ProtectedRoute>} />

          {/* Legal & Misc */}
          <Route path={ROUTES['route.legal.terms'].path}     element={<Terms />} />
          <Route path={ROUTES['route.legal.privacy'].path}   element={<Privacy />} />
          <Route path={ROUTES['route.legal.cookies'].path}   element={<Cookie />} />
          <Route path={ROUTES['route.legal.about'].path}     element={<About />} />
          <Route path={ROUTES['route.legal.status'].path}    element={<Status />} />
          <Route path={ROUTES['route.misc.scan-qr'].path}    element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
          <Route path={ROUTES['route.misc.debug'].path}      element={<ProtectedRoute><Debug /></ProtectedRoute>} />
          <Route path={ROUTES['route.misc.services'].path}   element={<ProtectedRoute><Services /></ProtectedRoute>} />

          {/* Sheets registered as routes */}
          <Route path="/select/asset" element={<ProtectedRoute><AssetSelector /></ProtectedRoute>} />
          <Route path="/select/pair"  element={<ProtectedRoute><PairSelector /></ProtectedRoute>} />

          {/* System states */}
          <Route path={ROUTES['route.system.offline'].path}      element={<Offline />} />
          <Route path={ROUTES['route.system.force-update'].path} element={<ForceUpdate />} />

          {/* Catch-all for screens not yet implemented */}
          <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
