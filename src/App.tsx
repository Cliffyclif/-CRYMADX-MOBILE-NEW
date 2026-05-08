/**
 * App — top-level router.
 * Public routes are open. Anything else is wrapped in <ProtectedRoute>.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './components/ProtectedRoute'
import { IconSprite } from './components/Icon'
import { ROUTES } from './routes'

// Phase 1 — auth + tab roots + wallet flow
import { Splash } from './screens/auth/Splash'
import { Login } from './screens/auth/Login'
import { Register } from './screens/auth/Register'
import { VerifyEmail } from './screens/auth/VerifyEmail'
import { Home } from './screens/tabs/Home'
import { Markets } from './screens/tabs/Markets'
import { AIChat } from './screens/tabs/AIChat'
import { Wallet } from './screens/tabs/Wallet'
import { Profile } from './screens/tabs/Profile'
import { DepositPick } from './screens/wallet/DepositPick'
import { Deposit } from './screens/wallet/Deposit'
import { Withdraw } from './screens/wallet/Withdraw'
import { WithdrawConfirm } from './screens/wallet/WithdrawConfirm'
import { TxHistory } from './screens/wallet/TxHistory'
import { TxDetail } from './screens/wallet/TxDetail'

// Phase 2 — wallet remainder
import { Convert } from './screens/wallet/Convert'
import { ConvertConfirm } from './screens/wallet/ConvertConfirm'
import { AssetDetail } from './screens/wallet/AssetDetail'
import { Beneficiaries } from './screens/wallet/Beneficiaries'
import { WhitelistConfirm } from './screens/wallet/WhitelistConfirm'

// Phase 2 — trading
import { SpotTrading } from './screens/trading/SpotTrading'
import { OrderConfirm } from './screens/trading/OrderConfirm'
import { Activity } from './screens/trading/Activity'
import { TradeDetail } from './screens/trading/TradeDetail'

// Phase 2 — earn
import { EarnHub } from './screens/earn/EarnHub'
import { Savings } from './screens/earn/Savings'
import { SavingsDetail } from './screens/earn/SavingsDetail'
import { SavingsDeposit } from './screens/earn/SavingsDeposit'
import { Staking } from './screens/earn/Staking'
import { Unstake } from './screens/earn/Unstake'
import { AutoInvest } from './screens/earn/AutoInvest'
import { Vault } from './screens/earn/Vault'

// Phase 2 — fiat
import { BuyCrypto } from './screens/fiat/BuyCrypto'
import { FiatOrderConfirm } from './screens/fiat/FiatOrderConfirm'
import { Guardarian } from './screens/fiat/Guardarian'
import { FiatOrderStatus } from './screens/fiat/FiatOrderStatus'

// Phase 3 — AI
import { VoiceMode } from './screens/ai/VoiceMode'
import { ChatHistory } from './screens/ai/ChatHistory'
import { ConversationDetail } from './screens/ai/ConversationDetail'
import { AISettingsScreen } from './screens/ai/AISettings'
import { AIVoiceSettings } from './screens/ai/AIVoiceSettings'
import { AITools } from './screens/ai/AITools'
import { AIMemory } from './screens/ai/AIMemory'
import { AIScheduled } from './screens/ai/AIScheduled'
import { AIActionDetail } from './screens/ai/AIActionDetail'
import { AIShareScreen } from './screens/ai/AIShare'
import { AISharedViewer } from './screens/ai/AISharedViewer'
import { AIPinSettings } from './screens/ai/AIPinSettings'
import { AIOnboarding } from './screens/ai/AIOnboarding'
import { AINotifications } from './screens/ai/AINotifications'

// Phase 3 — P2P
import { Marketplace } from './screens/p2p/Marketplace'
import { OfferDetail } from './screens/p2p/OfferDetail'
import { Order as P2POrderScreen } from './screens/p2p/Order'
import { Chat as P2PChatScreen } from './screens/p2p/Chat'
import { PaymentMethods } from './screens/p2p/PaymentMethods'

// Phase 3 — Card
import { CardHub } from './screens/card/CardHub'
import { CardTopUp } from './screens/card/CardTopUp'
import { CardSettingsScreen } from './screens/card/CardSettingsScreen'
import { CardTransactions } from './screens/card/CardTransactions'
import { CardOnboarding } from './screens/card/CardOnboarding'

// Phase 3 — NFT
import { NFTGallery } from './screens/nft/NFTGallery'
import { NFTMarketplace } from './screens/nft/NFTMarketplace'
import { NFTDetail } from './screens/nft/NFTDetail'
import { NFTSend } from './screens/nft/NFTSend'

// Phase 4 — Onboarding + auth fillers
import { Onboarding } from './screens/auth/Onboarding'
import { CompleteProfile } from './screens/auth/CompleteProfile'
import { Login2FA } from './screens/auth/Login2FA'
import { ForgotPassword } from './screens/auth/ForgotPassword'
import { ResetPassword } from './screens/auth/ResetPassword'
import { BiometricSetup } from './screens/auth/BiometricSetup'

// Phase 4 — Security
import { SecurityHub } from './screens/security/SecurityHub'
import { TwoFactorSetup } from './screens/security/TwoFactorSetup'
import { BackupCodes } from './screens/security/BackupCodes'
import { ChangePassword } from './screens/security/ChangePassword'
import { ChangePin } from './screens/security/ChangePin'
import { Sessions } from './screens/security/Sessions'
import { AntiPhishing } from './screens/security/AntiPhishing'

// Phase 4 — KYC
import { KYCStatus } from './screens/kyc/KYCStatus'
import { KYCFlow } from './screens/kyc/KYCFlow'
import { KYCPending } from './screens/kyc/KYCPending'
import { KYCLevelInfo } from './screens/kyc/KYCLevelInfo'

// Phase 4 — Settings
import { NotificationsSettings } from './screens/settings/NotificationsSettings'
import { Theme } from './screens/settings/Theme'
import { Language } from './screens/settings/Language'
import { Currency } from './screens/settings/Currency'
import { PriceAlerts } from './screens/settings/PriceAlerts'
import { PriceAlertEdit } from './screens/settings/PriceAlertEdit'
import { Developer } from './screens/settings/Developer'
import { ApiKeys } from './screens/settings/ApiKeys'
import { ApiKeyDetail } from './screens/settings/ApiKeyDetail'
import { Ecosystem } from './screens/settings/Ecosystem'

// Phase 4 — Engagement
import { Rewards } from './screens/engage/Rewards'
import { TierDetail } from './screens/engage/TierDetail'
import { Referral } from './screens/engage/Referral'
import { Notifications as EngageNotifications } from './screens/engage/Notifications'
import { Announcements } from './screens/engage/Announcements'

// Phase 4 — Support
import { HelpCenter } from './screens/support/HelpCenter'
import { Article } from './screens/support/Article'
import { Tickets } from './screens/support/Tickets'
import { TicketDetail } from './screens/support/TicketDetail'
import { Contact } from './screens/support/Contact'

// Phase 4 — Legal & Misc
import { Terms } from './screens/legal/Terms'
import { Privacy } from './screens/legal/Privacy'
import { Cookie } from './screens/legal/Cookie'
import { About } from './screens/legal/About'
import { Status } from './screens/legal/Status'
import { ScanQR } from './screens/misc/ScanQR'
import { AssetSelector } from './screens/misc/AssetSelector'
import { PairSelector } from './screens/misc/PairSelector'
import { Debug } from './screens/misc/Debug'
import { Services } from './screens/misc/Services'

// Phase 4 — System states
import { Offline } from './screens/system/Offline'
import { ForceUpdate } from './screens/system/ForceUpdate'

import { NotFound } from './screens/NotFound'

// Initialize theme from localStorage on app load
import './stores/theme'
import { useApplyDisplayScale } from './stores/display'
import { useLiveNotifications } from './hooks/useLiveNotifications'
import { NotificationToast } from './components/NotificationToast'
import { listenForNotificationClicks, registerServiceWorker } from './lib/webPush'
import { Toaster as SonnerToaster } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

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
      //   refetchOnWindowFocus only when stale — natural feel on tab switch
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

function AppInner() {
  useApplyDisplayScale()
  // Polls /api/notifications while signed in, pushes new ones to the toast queue.
  useLiveNotifications()
  // When a user taps a system push notification while the app is closed/hidden,
  // the Service Worker postMessages us with { type: 'navigate', href }. Route to it.
  const nav = useNavigate()
  useEffect(() => {
    listenForNotificationClicks((href) => {
      try { nav(href) } catch { /* ignore bad href */ }
    })
  }, [nav])
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
