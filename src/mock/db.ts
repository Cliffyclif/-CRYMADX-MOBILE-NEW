/**
 * MOCK DB
 * -------
 * The fake database. Every placeholder data point lives here, hierarchical,
 * with stable IDs. Persisted to localStorage so user actions (deposits,
 * settings toggles, etc.) survive reloads.
 *
 * Screens MUST NOT import from this file. They go through the API client.
 * The mock handlers (./handlers.ts) read and mutate this DB.
 */

import type {
  User,
  Balance,
  Transaction,
  MarketPair,
} from '../api/endpoints'

// ---------- Types specific to mock DB ----------

export type DepositAddress = {
  asset: string
  network: string
  address: string
  qrData: string
}

export type Beneficiary = {
  id: string
  userId: string
  name: string
  asset: string
  network: string
  address: string
  favorite: boolean
}

export type SecuritySummary = {
  score: number
  twoFAEnabled: boolean
  biometricEnabled: boolean
  passwordChangedAt: string
  backupCodesGenerated: number
  backupCodesUnused: number
  antiPhishingCode: string
  activeSessions: number
}

export type Notification = {
  id: string
  userId: string
  type: 'trading' | 'wallet' | 'security' | 'reward' | 'ai' | 'p2p' | 'news'
  icon: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export type RewardsSummary = {
  xp: number
  badges: number
  badgesTotal: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  nextTierXp: number
}

// ---------- Earn ----------

export type SavingsProduct = {
  id: string
  asset: string
  type: 'flexible' | 'locked'
  termDays: number  // 0 for flexible
  apy: string  // e.g., "8.0"
  minAmount: string
  maxAmount: string
  description: string
}

export type SavingsPosition = {
  id: string
  userId: string
  productId: string
  asset: string
  amount: string
  earned: string
  apy: string
  startDate: string
  endDate: string | null  // null for flexible
  status: 'active' | 'matured' | 'closed'
}

export type StakingProduct = {
  id: string
  asset: string
  protocol: string  // e.g., "Marinade"
  apy: string
  liquidToken: string  // e.g., "mSOL"
  unbondingDays: number  // 0 for instant
  description: string
}

export type StakingPosition = {
  id: string
  userId: string
  productId: string
  asset: string
  amount: string
  earned: string
  liquidAmount: string  // amount of mSOL etc.
  startDate: string
}

export type AutoInvestPlan = {
  id: string
  userId: string
  asset: string  // BTC, ETH, etc.
  fundingAsset: string  // USD, USDT
  amount: string  // per cycle
  cadence: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  nextRunAt: string
  totalInvested: string
  pnlPct: string  // e.g., "+13.05"
  status: 'active' | 'paused' | 'cancelled'
  cyclesCompleted: number
  cyclesTotal: number
}

export type VaultProduct = {
  id: string
  name: string
  apy: string
  risk: 'LOW' | 'MED' | 'HIGH'
  description: string
  strategy: string
}

// ---------- Trading ----------

export type TradingOrder = {
  id: string
  userId: string
  pair: string  // BTC/USDT
  side: 'buy' | 'sell'
  type: 'limit' | 'market' | 'stop-limit'
  price: string  // for limit
  amount: string  // base asset
  filled: string  // base asset filled
  total: string  // quote asset
  status: 'open' | 'filled' | 'cancelled' | 'partial'
  createdAt: string
  filledAt?: string
}

export type Trade = {
  id: string
  userId: string
  orderId?: string
  pair: string
  side: 'buy' | 'sell'
  price: string
  amount: string
  total: string
  fee: string
  feeAsset: string
  createdAt: string
}

// ---------- AI ----------

export type AIConversation = {
  id: string
  userId: string
  title: string
  preview: string
  pinned: boolean
  archived: boolean
  messageCount: number
  createdAt: string
  updatedAt: string
}

export type AIMessage = {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export type AIMemoryItem = {
  id: string
  userId: string
  icon: string
  category: 'preference' | 'context' | 'goal' | 'trading-style'
  title: string
  detail: string
  source: string
  createdAt: string
}

export type AIScheduledAction = {
  id: string
  userId: string
  icon: string
  title: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  trigger: string
  action: string
  source: string
  cooldown: string
  expiresAt: string | null
  recurring: boolean
  history: Array<{ when: string; type: 'created' | 'triggered' | 'failed'; detail: string }>
}

export type AITool = {
  id: string
  name: string
  description: string
  scope: 'read' | 'write'
  pinThresholdUsd: number | null
  enabled: boolean
  category: 'read' | 'write'
}

export type AIShare = {
  id: string
  conversationId: string
  isPublic: boolean
  expiresAt: string | null
  createdAt: string
  showAuthorName: boolean
}

export type AISettings = {
  userId: string
  model: string
  streaming: boolean
  autoExecuteUnderUsd: number
  defaultChain: string
  pinTokenTtlMin: number
  biometricForActions: boolean
  pinForEverySend: boolean
  pinThresholdSwapUsd: number
  showPinOnColdStart: boolean
  voice: string
  voiceSpeed: number
  pushToTalk: boolean
  wakeWord: boolean
  autoLanguage: boolean
}

// ---------- P2P ----------

export type P2POffer = {
  id: string
  side: 'buy' | 'sell'  // buyer wants, or seller offering
  sellerName: string
  sellerInitial: string
  reputationPct: string
  reputationCount: number
  asset: string  // USDT
  fiatCurrency: string  // NGN
  price: string  // 1610.00
  available: string
  minLimit: string
  maxLimit: string
  paymentMethods: string[]
  avgReleaseMin: number
  online: boolean
  verified: boolean
}

export type P2POrder = {
  id: string
  userId: string
  offerId: string
  side: 'buy' | 'sell'
  cryptoAsset: string
  cryptoAmount: string
  fiatAmount: string
  fiatCurrency: string
  rate: string
  paymentMethod: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  reference: string
  counterpartyName: string
  counterpartyInitial: string
  status: 'pending-payment' | 'paid' | 'released' | 'cancelled' | 'disputed'
  expiresAt: string
  timeline: Array<{ icon: string; title: string; detail: string; tone: 'g' | 'gd' | 'r' | 'mute' }>
  createdAt: string
}

export type P2PMessage = {
  id: string
  orderId: string
  senderId: string
  senderName: string
  text: string
  attachment?: { name: string; sizeKb: number }
  createdAt: string
}

export type P2PPaymentMethod = {
  id: string
  userId: string
  type: 'bank' | 'mobile-money' | 'wise' | 'other'
  provider: string  // "Access Bank" / "OPay" / "Wise"
  label: string  // "Access Bank · ****2854"
  accountName: string
  accountValue: string  // ****2854 or 0801****678
  fiatCurrency: string  // NGN, USD
  status: 'verified' | 'pending'
}

// ---------- Card ----------

export type CardSettings = {
  id: string
  userId: string
  cardLast4: string
  cardholderName: string
  status: 'active' | 'frozen' | 'cancelled' | 'awaiting-kyc'
  type: 'virtual' | 'physical'
  network: 'visa' | 'mastercard'
  balance: string
  balanceCurrency: string  // USD
  dailySpendLimit: string
  monthlySpendLimit: string
  spentToday: string
  spentMonth: string
  contactlessEnabled: boolean
  onlineEnabled: boolean
  internationalEnabled: boolean
  allowedRegions: string[]  // emoji + country names
  cashbackPct: string  // "3"
  cashbackEarned: string  // "5.52"
  txnsThisMonth: number
}

export type CardTransaction = {
  id: string
  userId: string
  merchant: string
  category: string
  amount: string
  cashback: string
  createdAt: string
  status: 'approved' | 'declined' | 'pending'
  declineReason?: string
  merchantTint: string  // rgb tuple
}

// ---------- NFT ----------

export type NFT = {
  id: string
  ownerId: string | null
  collection: string
  collectionVerified: boolean
  tokenId: string
  name: string
  chain: 'ETH' | 'POLYGON' | 'BASE' | 'ARB' | 'SOL'
  price: string  // "1.59"
  priceCurrency: string  // ETH
  lastSale?: string
  lastSaleChange?: string
  contractAddress: string
  imageGradient: string
  traits: Array<{ key: string; value: string; rarity: string }>
}

// ---------- Settings · Price alerts ----------

export type PriceAlert = {
  id: string
  userId: string
  asset: string
  condition: 'above' | 'below' | 'pct-change'
  thresholdValue: string  // price or %
  thresholdAmount: string  // for percent
  active: boolean
  oneTime: boolean
  notifyPush: boolean
  notifyEmail: boolean
  createdAt: string
}

// ---------- Settings · API keys ----------

export type APIKey = {
  id: string
  userId: string
  name: string
  publicKey: string
  secretKeyPreview: string  // only shown at creation
  scopes: { read: boolean; trade: boolean; withdraw: boolean; manage: boolean }
  ipAllowlist: string[]
  callsLast30d: number
  callsQuotaMonthly: number
  expiresAt: string | null
  status: 'live' | 'test' | 'expiring' | 'revoked'
  createdAt: string
}

// ---------- Sessions / login history ----------

export type Session = {
  id: string
  userId: string
  device: string  // "iPhone 14 Pro"
  deviceIcon: 'phone' | 'grid' | 'globe'
  location: string  // "Lagos, NG"
  os: string
  app: string  // "iOS 17.4 · CrymadX 2.1.0"
  isCurrent: boolean
  lastActive: string
  status: 'active' | 'idle'
}

export type LoginEvent = {
  id: string
  userId: string
  device: string
  deviceIcon: 'phone' | 'grid' | 'globe'
  location: string
  result: 'success' | 'failed'
  failureReason?: string
  at: string
}

// ---------- KYC ----------

export type KYCSubmission = {
  userId: string
  level: 1 | 2 | 3
  status: 'unverified' | 'pending' | 'verified' | 'rejected'
  submittedAt: string | null
  reviewedAt: string | null
  rejectionReason?: string
  estimatedCompleteAt?: string
  steps: Array<{ key: string; label: string; done: boolean }>
}

// ---------- Engagement · badges ----------

export type Badge = {
  id: string
  userId: string | null  // null means available, not earned
  title: string
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC'
  xp: string  // "+25 XP"
  category: 'trader' | 'volume' | 'depositor' | 'hodler' | 'explorer'
  earnedAt: string | null
  progress: string | null  // "2/3" or "0/90 days"
}

// ---------- Engagement · referrals ----------

export type Referral = {
  id: string
  inviter: string  // userId
  invitedHandle: string
  joinedAt: string | null
  verifiedKyc: boolean
  reward: string  // "+$20 +100 XP"
  status: 'verified' | 'pending'
}

// ---------- Support ----------

export type SupportArticle = {
  slug: string
  category: 'wallet' | 'trading' | 'security' | 'kyc' | 'card' | 'ai' | 'other'
  title: string
  excerpt: string
  body: string  // markdown-ish
  helpfulPct: number  // 0-100
  helpfulCount: number
  updatedAt: string
}

export type SupportTicket = {
  id: string
  userId: string
  subject: string
  category: string
  status: 'open' | 'awaiting' | 'closed'
  team: string
  updatedAt: string
  unread: boolean
  meta?: Record<string, string>
}

export type SupportTicketMessage = {
  id: string
  ticketId: string
  authorRole: 'user' | 'agent'
  authorName: string
  body: string
  attachment?: { name: string; sizeKb: number }
  createdAt: string
}

// ---------- Announcements ----------

export type Announcement = {
  id: string
  emoji: string
  title: string
  body: string
  category: 'product' | 'listings' | 'maintenance' | 'promo'
  createdAt: string
  pinned: boolean
}

// ---------- System status ----------

export type SystemIncident = {
  id: string
  service: string
  status: 'investigating' | 'identified' | 'resolved' | 'completed'
  title: string
  message: string
  at: string
}

// ---------- Fiat ----------

export type FiatOrder = {
  id: string
  userId: string
  fiatAmount: string
  fiatCurrency: string
  cryptoAmount: string
  cryptoAsset: string
  rate: string
  fee: string
  status: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  createdAt: string
  completedAt?: string
}

// ---------- DB shape ----------

export type MockDb = {
  /** Currently signed-in user id (null = signed out) */
  authUserId: string | null
  /** Indexed by user id */
  users: Record<string, User>
  balances: Balance[]
  transactions: Transaction[]
  beneficiaries: Beneficiary[]
  marketPairs: MarketPair[]
  notifications: Notification[]
  rewards: Record<string /* userId */, RewardsSummary>
  security: Record<string /* userId */, SecuritySummary>

  // Earn
  savingsProducts: SavingsProduct[]
  savingsPositions: SavingsPosition[]
  stakingProducts: StakingProduct[]
  stakingPositions: StakingPosition[]
  autoInvestPlans: AutoInvestPlan[]
  vaultProducts: VaultProduct[]

  // Trading
  tradingOrders: TradingOrder[]
  trades: Trade[]

  // AI
  aiConversations: AIConversation[]
  aiMessages: AIMessage[]
  aiMemoryItems: AIMemoryItem[]
  aiScheduledActions: AIScheduledAction[]
  aiTools: AITool[]
  aiShares: AIShare[]
  aiSettings: Record<string /* userId */, AISettings>

  // P2P
  p2pOffers: P2POffer[]
  p2pOrders: P2POrder[]
  p2pMessages: P2PMessage[]
  p2pPaymentMethods: P2PPaymentMethod[]

  // Card
  cards: Record<string /* userId */, CardSettings>
  cardTransactions: CardTransaction[]

  // NFT
  nfts: NFT[]

  // Settings
  priceAlerts: PriceAlert[]
  apiKeys: APIKey[]

  // Sessions / login history
  sessions: Session[]
  loginHistory: LoginEvent[]

  // KYC
  kycSubmissions: Record<string /* userId */, KYCSubmission>

  // Engagement
  badges: Badge[]
  referrals: Referral[]

  // Support
  supportArticles: SupportArticle[]
  supportTickets: SupportTicket[]
  supportTicketMessages: SupportTicketMessage[]

  // Announcements
  announcements: Announcement[]

  // System status
  systemIncidents: SystemIncident[]

  // Fiat
  fiatOrders: FiatOrder[]

  /** Persisted UI prefs */
  prefs: {
    theme: 'dark' | 'light'
    language: string
    currency: string
    notifications: Record<string, boolean>
  }
}

// ---------- Seed data ----------

const USR_001: User = {
  id: 'usr_001',
  firstName: 'Joseph',
  lastName: 'Obasi',
  email: 'joseph@email.com',
  phone: '+234 801 234 5678',
  country: 'Nigeria',
  kycLevel: 2,
  kycStatus: 'verified',
  tier: 'bronze',
  xp: 175,
  createdAt: '2026-01-15T09:00:00.000Z',
}

export const SEED_DB: MockDb = {
  authUserId: null, // start signed out

  users: {
    'usr_001': USR_001,
  },

  balances: [
    { id: 'bal_001', userId: 'usr_001', asset: 'BTC',  amount: '0.18700000', usdValue: '12541.32' },
    { id: 'bal_002', userId: 'usr_001', asset: 'ETH',  amount: '0.05200000', usdValue: '198.86' },
    { id: 'bal_003', userId: 'usr_001', asset: 'USDT', amount: '108.50',     usdValue: '108.50' },
    { id: 'bal_004', userId: 'usr_001', asset: 'SOL',  amount: '2.45',       usdValue: '446.32' },
    { id: 'bal_005', userId: 'usr_001', asset: 'USDC', amount: '24.96',      usdValue: '24.96' },
    { id: 'bal_006', userId: 'usr_001', asset: 'MATIC', amount: '152.0',     usdValue: '84.86' },
  ],

  transactions: [
    { id: 'tx_001', userId: 'usr_001', type: 'deposit',    asset: 'BTC',  amount: '0.005',    status: 'completed', network: 'Bitcoin',     createdAt: '2026-04-28T14:22:00.000Z', txHash: 'a8f3b92e1c4d567890123abc4567def8', confirmations: 6, blockHeight: 834221, fromAddress: 'bc1qfrom...3a8', toAddress: 'bc1qey5...8pd', fee: '0.00012', feeAsset: 'BTC' },
    { id: 'tx_002', userId: 'usr_001', type: 'withdraw', asset: 'USDT', amount: '100.00',   status: 'completed', network: 'TRC20',       createdAt: '2026-04-28T12:15:00.000Z' },
    { id: 'tx_003', userId: 'usr_001', type: 'convert',       asset: 'BTC→USDT', amount: '3353.42', status: 'completed',                       createdAt: '2026-04-28T09:48:00.000Z' },
    { id: 'tx_004', userId: 'usr_001', type: 'trade',      asset: 'SOL/USDT', amount: '1.50',  status: 'completed',                         createdAt: '2026-04-27T18:30:00.000Z' },
    { id: 'tx_005', userId: 'usr_001', type: 'deposit',    asset: 'USDT', amount: '50.00',    status: 'completed', network: 'TRC20',       createdAt: '2026-04-27T11:00:00.000Z' },
    { id: 'tx_006', userId: 'usr_001', type: 'withdraw', asset: 'BTC',  amount: '0.01',     status: 'completed', network: 'Bitcoin',     createdAt: '2026-04-26T22:14:00.000Z' },
    { id: 'tx_007', userId: 'usr_001', type: 'reward',     asset: 'XP',   amount: '25',       status: 'completed',                         createdAt: '2026-04-26T10:00:00.000Z' },
    { id: 'tx_008', userId: 'usr_001', type: 'convert',       asset: 'ETH→BTC', amount: '0.001', status: 'completed',                         createdAt: '2026-04-25T16:22:00.000Z' },
    { id: 'tx_009', userId: 'usr_001', type: 'card-topup', asset: 'USDC', amount: '25.00',    status: 'completed',                         createdAt: '2026-04-25T09:18:00.000Z' },
    { id: 'tx_010', userId: 'usr_001', type: 'trade',      asset: 'XRP/USDT', amount: '200',  status: 'completed',                         createdAt: '2026-04-24T14:50:00.000Z' },
  ],

  beneficiaries: [
    { id: 'ben_001', userId: 'usr_001', name: 'Cold Storage', asset: 'BTC',  network: 'Bitcoin', address: 'bc1qcold...x9z', favorite: true },
    { id: 'ben_002', userId: 'usr_001', name: 'Binance',      asset: 'USDT', network: 'TRC20',   address: 'TR8gBn...kd2',  favorite: false },
    { id: 'ben_003', userId: 'usr_001', name: 'Phantom',      asset: 'SOL',  network: 'Solana',  address: '5Hp9...2eY',    favorite: false },
    { id: 'ben_004', userId: 'usr_001', name: 'Trezor',       asset: 'ETH',  network: 'Ethereum', address: '0x47a...e8a',  favorite: true },
  ],

  marketPairs: [
    { symbol: 'BTC/USDT',  base: 'BTC',  quote: 'USDT', price: '67241.90',  change24h: '+2.89', volume24h: '28400000000', high24h: '68212', low24h: '65341' },
    { symbol: 'ETH/USDT',  base: 'ETH',  quote: 'USDT', price: '3824.28',   change24h: '+2.61', volume24h: '12800000000', high24h: '3892',  low24h: '3712' },
    { symbol: 'SOL/USDT',  base: 'SOL',  quote: 'USDT', price: '182.4400',  change24h: '+5.52', volume24h: '4200000000',  high24h: '188',   low24h: '171' },
    { symbol: 'BNB/USDT',  base: 'BNB',  quote: 'USDT', price: '612.45',    change24h: '+4.86', volume24h: '1800000000',  high24h: '624',   low24h: '581' },
    { symbol: 'XRP/USDT',  base: 'XRP',  quote: 'USDT', price: '1.3500',    change24h: '+2.15', volume24h: '2100000000',  high24h: '1.39',  low24h: '1.31' },
    { symbol: 'DOGE/USDT', base: 'DOGE', quote: 'USDT', price: '0.0893',    change24h: '-1.52', volume24h: '900000000',   high24h: '0.092', low24h: '0.087' },
    { symbol: 'DOT/USDT',  base: 'DOT',  quote: 'USDT', price: '5.2700',    change24h: '+8.35', volume24h: '420000000',   high24h: '5.41',  low24h: '4.84' },
    { symbol: 'AVAX/USDT', base: 'AVAX', quote: 'USDT', price: '9.1900',    change24h: '+3.39', volume24h: '380000000',   high24h: '9.42',  low24h: '8.84' },
    { symbol: 'LINK/USDT', base: 'LINK', quote: 'USDT', price: '14.32',     change24h: '+0.84', volume24h: '320000000',   high24h: '14.55', low24h: '14.10' },
  ],

  notifications: [
    { id: 'ntf_001', userId: 'usr_001', type: 'trading',  icon: 'check', title: 'Order filled',      body: 'Bought 0.05 BTC at $67,241', read: false, createdAt: '2026-04-28T14:22:00.000Z' },
    { id: 'ntf_002', userId: 'usr_001', type: 'trading',  icon: 'bell',  title: 'Price alert',       body: 'SOL crossed $200',           read: false, createdAt: '2026-04-28T14:09:00.000Z' },
    { id: 'ntf_003', userId: 'usr_001', type: 'wallet',   icon: 'dl',    title: 'Deposit received',  body: '+0.005 BTC confirmed',       read: true,  createdAt: '2026-04-28T13:22:00.000Z' },
    { id: 'ntf_004', userId: 'usr_001', type: 'security', icon: 'shield', title: 'New login',        body: 'iPhone · Lagos · 14:22',     read: true,  createdAt: '2026-04-28T11:22:00.000Z' },
    { id: 'ntf_005', userId: 'usr_001', type: 'reward',   icon: 'gift',  title: 'Daily streak',      body: '+5 XP earned · 7 day streak', read: true, createdAt: '2026-04-28T09:00:00.000Z' },
  ],

  rewards: {
    'usr_001': { xp: 175, badges: 4, badgesTotal: 25, tier: 'bronze', nextTierXp: 500 },
  },

  security: {
    'usr_001': {
      score: 75,
      twoFAEnabled: true,
      biometricEnabled: true,
      passwordChangedAt: '2026-04-16T00:00:00.000Z',
      backupCodesGenerated: 10,
      backupCodesUnused: 8,
      antiPhishingCode: 'GREEN-WAVES-42',
      activeSessions: 3,
    },
  },

  savingsProducts: [
    { id: 'svp_001', asset: 'BTC',  type: 'flexible', termDays: 0,  apy: '3.2',  minAmount: '0.0001', maxAmount: '10',     description: 'Withdraw anytime · Daily compounding' },
    { id: 'svp_002', asset: 'ETH',  type: 'flexible', termDays: 0,  apy: '4.5',  minAmount: '0.001',  maxAmount: '50',     description: 'Withdraw anytime · Daily compounding' },
    { id: 'svp_003', asset: 'USDT', type: 'flexible', termDays: 0,  apy: '6.0',  minAmount: '10',     maxAmount: '50000',  description: 'Withdraw anytime · Daily compounding' },
    { id: 'svp_004', asset: 'USDT', type: 'locked',   termDays: 7,  apy: '5.5',  minAmount: '10',     maxAmount: '20000',  description: '7-day lock · Flexible exit with 5% penalty' },
    { id: 'svp_005', asset: 'USDT', type: 'locked',   termDays: 30, apy: '8.0',  minAmount: '100',    maxAmount: '10000',  description: '30-day lock · 5% early-exit fee' },
    { id: 'svp_006', asset: 'USDT', type: 'locked',   termDays: 90, apy: '12.0', minAmount: '500',    maxAmount: '50000',  description: '90-day lock · No early exit' },
    { id: 'svp_007', asset: 'USDC', type: 'locked',   termDays: 30, apy: '7.5',  minAmount: '100',    maxAmount: '10000',  description: '30-day lock · 5% early-exit fee' },
    { id: 'svp_008', asset: 'SOL',  type: 'locked',   termDays: 60, apy: '6.2',  minAmount: '0.5',    maxAmount: '500',    description: '60-day lock · Liquid via stSOL' },
    { id: 'svp_009', asset: 'BNB',  type: 'flexible', termDays: 0,  apy: '5.0',  minAmount: '0.01',   maxAmount: '50',     description: 'Withdraw anytime' },
    { id: 'svp_010', asset: 'DAI',  type: 'locked',   termDays: 90, apy: '9.5',  minAmount: '50',     maxAmount: '10000',  description: '90-day lock · No early exit' },
  ],

  savingsPositions: [
    { id: 'svps_001', userId: 'usr_001', productId: 'svp_005', asset: 'USDT', amount: '420.50', earned: '8.32',  apy: '8.0', startDate: '2026-04-15T00:00:00.000Z', endDate: '2026-05-15T00:00:00.000Z', status: 'active' },
    { id: 'svps_002', userId: 'usr_001', productId: 'svp_008', asset: 'SOL',  amount: '1.50',   earned: '0.032', apy: '6.2', startDate: '2026-03-01T00:00:00.000Z', endDate: '2026-04-30T00:00:00.000Z', status: 'active' },
    { id: 'svps_003', userId: 'usr_001', productId: 'svp_001', asset: 'BTC',  amount: '0.025',  earned: '0.00027', apy: '3.2', startDate: '2026-03-15T00:00:00.000Z', endDate: null, status: 'active' },
  ],

  stakingProducts: [
    { id: 'stp_001', asset: 'SOL',   protocol: 'Marinade', apy: '6.8', liquidToken: 'mSOL',     unbondingDays: 0,  description: 'Liquid staking via Marinade · Instant unstake' },
    { id: 'stp_002', asset: 'ETH',   protocol: 'Lido',     apy: '4.2', liquidToken: 'stETH',    unbondingDays: 4,  description: 'Liquid staking via Lido · 2-4 day unbond' },
    { id: 'stp_003', asset: 'BNB',   protocol: 'Ankr',     apy: '5.0', liquidToken: 'ankrBNB',  unbondingDays: 7,  description: 'Liquid staking via Ankr' },
    { id: 'stp_004', asset: 'MATIC', protocol: 'Stader',   apy: '5.5', liquidToken: 'MaticX',   unbondingDays: 5,  description: 'Liquid staking via Stader' },
    { id: 'stp_005', asset: 'ADA',   protocol: 'Native',   apy: '3.8', liquidToken: 'ADA',      unbondingDays: 0,  description: 'Native Cardano delegation' },
    { id: 'stp_006', asset: 'SOL',   protocol: 'Jito',     apy: '7.4', liquidToken: 'JitoSOL',  unbondingDays: 0,  description: 'MEV-boosted staking via Jito' },
  ],

  stakingPositions: [
    { id: 'stps_001', userId: 'usr_001', productId: 'stp_001', asset: 'SOL', amount: '2.45', earned: '0.012', liquidAmount: '2.45', startDate: '2026-04-01T00:00:00.000Z' },
  ],

  autoInvestPlans: [
    { id: 'aip_001', userId: 'usr_001', asset: 'BTC', fundingAsset: 'USD', amount: '10', cadence: 'daily',  nextRunAt: '2026-04-29T12:00:00.000Z', totalInvested: '190.00', pnlPct: '+13.05', status: 'active', cyclesCompleted: 19, cyclesTotal: 50 },
    { id: 'aip_002', userId: 'usr_001', asset: 'ETH', fundingAsset: 'USD', amount: '50', cadence: 'weekly', nextRunAt: '2026-05-04T09:00:00.000Z', totalInvested: '200.00', pnlPct: '+8.40',  status: 'active', cyclesCompleted: 4,  cyclesTotal: 12 },
  ],

  vaultProducts: [
    { id: 'vlt_001', name: 'Stable Yield',           apy: '9.5',  risk: 'LOW',  description: 'USDT/USDC LP · Low risk',                strategy: 'Stable LP' },
    { id: 'vlt_002', name: 'BTC Covered Call',       apy: '12.0', risk: 'MED',  description: 'BTC + sell calls · Medium risk',         strategy: 'Options income' },
    { id: 'vlt_003', name: 'ETH Volatility Harvest', apy: '15.5', risk: 'HIGH', description: 'ETH delta-neutral · High risk',          strategy: 'Vol harvesting' },
    { id: 'vlt_004', name: 'Multi-chain Index',      apy: '8.2',  risk: 'LOW',  description: 'BTC/ETH/SOL/MATIC basket',               strategy: 'Index basket' },
    { id: 'vlt_005', name: 'Crypto Momentum',        apy: '11.4', risk: 'MED',  description: 'Top 10 momentum strategy',               strategy: 'Momentum' },
  ],

  tradingOrders: [
    { id: 'ord_001', userId: 'usr_001', pair: 'BTC/USDT', side: 'buy',  type: 'limit',      price: '67241.00', amount: '0.05',   filled: '0.006',  total: '3362.05', status: 'partial',   createdAt: '2026-04-28T13:00:00.000Z' },
    { id: 'ord_002', userId: 'usr_001', pair: 'ETH/USDT', side: 'sell', type: 'stop-limit', price: '4000.00',  amount: '0.052',  filled: '0',      total: '208.00',  status: 'open',      createdAt: '2026-04-28T11:30:00.000Z' },
    { id: 'ord_003', userId: 'usr_001', pair: 'SOL/USDT', side: 'buy',  type: 'limit',      price: '175.00',   amount: '5',      filled: '0',      total: '875.00',  status: 'open',      createdAt: '2026-04-28T09:15:00.000Z' },
    { id: 'ord_004', userId: 'usr_001', pair: 'BTC/USDT', side: 'buy',  type: 'limit',      price: '66800.00', amount: '0.0235', filled: '0.0235', total: '1569.80', status: 'filled',    createdAt: '2026-04-27T18:00:00.000Z', filledAt: '2026-04-27T18:32:18.000Z' },
    { id: 'ord_005', userId: 'usr_001', pair: 'ETH/USDT', side: 'sell', type: 'limit',      price: '3850.00',  amount: '0.1',    filled: '0',      total: '385.00',  status: 'cancelled', createdAt: '2026-04-26T14:00:00.000Z' },
  ],

  trades: [
    { id: 'trd_001', userId: 'usr_001', orderId: 'ord_004', pair: 'BTC/USDT', side: 'buy',  price: '66800.00', amount: '0.0235', total: '1569.80', fee: '1.57', feeAsset: 'USDT', createdAt: '2026-04-27T18:32:18.000Z' },
    { id: 'trd_002', userId: 'usr_001',                     pair: 'ETH/USDT', side: 'sell', price: '3824.00',  amount: '0.10',   total: '382.40',  fee: '0.38', feeAsset: 'USDT', createdAt: '2026-04-28T12:14:00.000Z' },
    { id: 'trd_003', userId: 'usr_001',                     pair: 'SOL/USDT', side: 'buy',  price: '182.00',   amount: '2.0',    total: '364.00',  fee: '0.36', feeAsset: 'USDT', createdAt: '2026-04-27T18:30:00.000Z' },
  ],

  fiatOrders: [
    { id: 'fo_001', userId: 'usr_001', fiatAmount: '100', fiatCurrency: 'USD', cryptoAmount: '0.00148',  cryptoAsset: 'BTC', rate: '67241', fee: '0.50',  status: 'completed', paymentMethod: 'visa-4821', createdAt: '2026-04-25T10:00:00.000Z', completedAt: '2026-04-25T10:08:00.000Z' },
  ],

  // ---- Price alerts ----
  priceAlerts: [
    { id: 'al_001', userId: 'usr_001', asset: 'BTC',   condition: 'above', thresholdValue: '70000', thresholdAmount: '0', active: true,  oneTime: true,  notifyPush: true,  notifyEmail: false, createdAt: '2026-04-20T00:00:00.000Z' },
    { id: 'al_002', userId: 'usr_001', asset: 'BTC',   condition: 'below', thresholdValue: '60000', thresholdAmount: '0', active: true,  oneTime: true,  notifyPush: true,  notifyEmail: false, createdAt: '2026-04-20T00:00:00.000Z' },
    { id: 'al_003', userId: 'usr_001', asset: 'ETH',   condition: 'above', thresholdValue: '4500',  thresholdAmount: '0', active: true,  oneTime: true,  notifyPush: true,  notifyEmail: true,  createdAt: '2026-04-15T00:00:00.000Z' },
    { id: 'al_004', userId: 'usr_001', asset: 'SOL',   condition: 'above', thresholdValue: '200',   thresholdAmount: '0', active: true,  oneTime: true,  notifyPush: true,  notifyEmail: false, createdAt: '2026-04-12T00:00:00.000Z' },
    { id: 'al_005', userId: 'usr_001', asset: 'DOGE',  condition: 'below', thresholdValue: '0.05',  thresholdAmount: '0', active: false, oneTime: true,  notifyPush: false, notifyEmail: false, createdAt: '2026-04-10T00:00:00.000Z' },
    { id: 'al_006', userId: 'usr_001', asset: 'XRP',   condition: 'above', thresholdValue: '2.00',  thresholdAmount: '0', active: true,  oneTime: true,  notifyPush: true,  notifyEmail: false, createdAt: '2026-04-08T00:00:00.000Z' },
    { id: 'al_007', userId: 'usr_001', asset: 'MATIC', condition: 'below', thresholdValue: '0.50',  thresholdAmount: '0', active: true,  oneTime: true,  notifyPush: true,  notifyEmail: false, createdAt: '2026-04-05T00:00:00.000Z' },
    { id: 'al_008', userId: 'usr_001', asset: 'LINK',  condition: 'above', thresholdValue: '20',    thresholdAmount: '0', active: true,  oneTime: true,  notifyPush: true,  notifyEmail: false, createdAt: '2026-04-03T00:00:00.000Z' },
  ],

  // ---- API keys ----
  apiKeys: [
    { id: 'ak_001', userId: 'usr_001', name: 'Production', publicKey: 'pk_live_8xa3f9e2b4d2c8a1f0e5', secretKeyPreview: 'sk_live_8xa3f9...4d2', scopes: { read: true, trade: true, withdraw: true, manage: false }, ipAllowlist: ['54.32.18.*', '118.224.40.20', '203.74.55.18'], callsLast30d: 98_200, callsQuotaMonthly: 5_000_000, expiresAt: null, status: 'live', createdAt: '2026-01-20T00:00:00.000Z' },
    { id: 'ak_002', userId: 'usr_001', name: 'Sandbox',    publicKey: 'pk_test_b3ae42c8e91d24f7a3', secretKeyPreview: 'sk_test_b3ae42...c8e', scopes: { read: true, trade: true, withdraw: true, manage: false }, ipAllowlist: [], callsLast30d: 12_000, callsQuotaMonthly: 1_000_000, expiresAt: null, status: 'test', createdAt: '2026-02-12T00:00:00.000Z' },
    { id: 'ak_003', userId: 'usr_001', name: 'Tax Bot',    publicKey: 'pk_live_92xd1300a18b73ed25', secretKeyPreview: 'sk_live_92xd13...0a1', scopes: { read: true, trade: false, withdraw: false, manage: false }, ipAllowlist: ['72.14.21.55'], callsLast30d: 2_800, callsQuotaMonthly: 100_000, expiresAt: '2026-05-04T00:00:00.000Z', status: 'expiring', createdAt: '2026-03-01T00:00:00.000Z' },
  ],

  // ---- Sessions / login history ----
  sessions: [
    { id: 'sess_001', userId: 'usr_001', device: 'iPhone 14 Pro', deviceIcon: 'phone', location: 'Lagos, NG · 14:22 today', os: 'iOS 17.4',          app: 'iOS 17.4 · CrymadX 2.1.0', isCurrent: true,  lastActive: '2026-04-28T14:22:00.000Z', status: 'active' },
    { id: 'sess_002', userId: 'usr_001', device: 'MacBook Pro',   deviceIcon: 'grid',  location: 'Lagos, NG · 13:48 today', os: 'macOS Sonoma',     app: 'macOS Sonoma · Chrome',    isCurrent: false, lastActive: '2026-04-28T13:48:00.000Z', status: 'active' },
    { id: 'sess_003', userId: 'usr_001', device: 'Pixel 8',       deviceIcon: 'phone', location: 'Abuja, NG · Apr 26',     os: 'Android 14',       app: 'Android 14 · CrymadX 2.0.8', isCurrent: false, lastActive: '2026-04-26T18:30:00.000Z', status: 'idle'   },
  ],

  loginHistory: [
    { id: 'lh_001', userId: 'usr_001', device: 'Lagos, NG · iPhone',      deviceIcon: 'phone', location: 'Lagos, NG',     result: 'success', at: '2026-04-28T14:22:00.000Z' },
    { id: 'lh_002', userId: 'usr_001', device: 'Lagos, NG · MacBook',     deviceIcon: 'grid',  location: 'Lagos, NG',     result: 'success', at: '2026-04-28T13:48:00.000Z' },
    { id: 'lh_003', userId: 'usr_001', device: 'New York, US · Unknown', deviceIcon: 'globe', location: 'New York, US', result: 'failed', failureReason: 'wrong PW', at: '2026-04-27T03:14:00.000Z' },
    { id: 'lh_004', userId: 'usr_001', device: 'Lagos, NG · Pixel',       deviceIcon: 'phone', location: 'Lagos, NG',     result: 'success', at: '2026-04-26T18:30:00.000Z' },
  ],

  // ---- KYC ----
  kycSubmissions: {
    'usr_001': {
      userId: 'usr_001',
      level: 2,
      status: 'verified',
      submittedAt: '2026-01-20T00:00:00.000Z',
      reviewedAt: '2026-01-20T00:15:00.000Z',
      steps: [
        { key: 'personal', label: 'Personal info',       done: true },
        { key: 'id',       label: 'Government ID',       done: true },
        { key: 'selfie',   label: 'Selfie · Liveness',   done: true },
        { key: 'address',  label: 'Address proof (L3)',  done: false },
      ],
    },
  },

  // ---- Badges ----
  badges: [
    { id: 'b_001', userId: 'usr_001', title: 'First Trade',          rarity: 'COMMON',   xp: '+25 XP',  category: 'trader',    earnedAt: '2026-01-04T00:00:00.000Z', progress: null },
    { id: 'b_002', userId: 'usr_001', title: 'First Deposit',        rarity: 'COMMON',   xp: '+25 XP',  category: 'depositor', earnedAt: '2026-01-04T00:00:00.000Z', progress: null },
    { id: 'b_003', userId: 'usr_001', title: 'Verified Trader L2',   rarity: 'UNCOMMON', xp: '+100 XP', category: 'trader',    earnedAt: '2026-01-12T00:00:00.000Z', progress: null },
    { id: 'b_004', userId: 'usr_001', title: 'First Swap',           rarity: 'COMMON',   xp: '+25 XP',  category: 'trader',    earnedAt: '2026-01-15T00:00:00.000Z', progress: null },
    { id: 'b_005', userId: null,      title: 'Multi-Chain Explorer', rarity: 'RARE',     xp: '+300 XP', category: 'explorer',  earnedAt: null,                       progress: '2/3 chains' },
    { id: 'b_006', userId: null,      title: '90-Day HODLer',        rarity: 'RARE',     xp: '+500 XP', category: 'hodler',    earnedAt: null,                       progress: '12/90 days' },
    { id: 'b_007', userId: null,      title: 'AI Power User',        rarity: 'EPIC',     xp: '+1000 XP', category: 'explorer', earnedAt: null,                       progress: '5/100 chats' },
  ],

  // ---- Referrals ----
  referrals: [
    { id: 'r_001', inviter: 'usr_001', invitedHandle: 'marcus_p', joinedAt: '2026-04-26T00:00:00.000Z', verifiedKyc: true, reward: '+$20 +100 XP', status: 'verified' },
    { id: 'r_002', inviter: 'usr_001', invitedHandle: 'emma_o',   joinedAt: '2026-04-22T00:00:00.000Z', verifiedKyc: true, reward: '+$20 +100 XP', status: 'verified' },
    { id: 'r_003', inviter: 'usr_001', invitedHandle: 'ade_chk',  joinedAt: '2026-04-18T00:00:00.000Z', verifiedKyc: true, reward: '+$20 +100 XP', status: 'verified' },
    { id: 'r_004', inviter: 'usr_001', invitedHandle: 'friend_4', joinedAt: null,                       verifiedKyc: false, reward: '—',           status: 'pending' },
    { id: 'r_005', inviter: 'usr_001', invitedHandle: 'friend_5', joinedAt: null,                       verifiedKyc: false, reward: '—',           status: 'pending' },
  ],

  // ---- Support articles ----
  supportArticles: [
    { slug: 'enable-2fa',       category: 'security', title: 'How to enable Two-Factor Authentication (2FA)', excerpt: 'Set up 2FA in 4 simple steps', body: '2FA adds a second layer of security to your CrymadX account. Even if someone gets your password, they cannot log in without your second factor.\n\n## Step 1: Download an Authenticator App\nWe recommend Google Authenticator, Authy, or 1Password. Avoid SMS-based 2FA — vulnerable to SIM swap attacks.\n\n## Step 2: Enable in CrymadX\nGo to Profile → Security → Two-Factor Auth → Enable. We will show a QR code.\n\n## Step 3: Scan the QR Code\nOpen your authenticator app, tap "+", and scan the QR with your camera. The app will start generating 6-digit codes that change every 30 seconds.\n\n## Step 4: Save Backup Codes\nWe will show you 10 one-time backup codes. Save these! If you lose your phone, they are how you get back in.', helpfulPct: 96, helpfulCount: 1240, updatedAt: '2026-04-12T00:00:00.000Z' },
    { slug: 'withdraw-bank',    category: 'wallet',   title: 'How do I withdraw to my bank?',                  excerpt: 'Sell crypto and move to your bank account', body: 'Withdrawing to bank is a 2-step flow: first, sell or convert your crypto to a stablecoin (USDC/USDT), then use P2P or Fiat Off-Ramp.', helpfulPct: 92, helpfulCount: 855, updatedAt: '2026-04-08T00:00:00.000Z' },
    { slug: 'deposit-pending',  category: 'wallet',   title: 'Why is my deposit pending?',                     excerpt: 'Network congestion + confirmation requirements', body: 'Your deposit is held until the network reaches the required confirmations.', helpfulPct: 89, helpfulCount: 612, updatedAt: '2026-04-04T00:00:00.000Z' },
    { slug: 'kyc-required',     category: 'kyc',      title: 'What is KYC and why is it needed?',              excerpt: 'Anti-money-laundering compliance', body: 'Know-Your-Customer (KYC) verification is required by financial regulators to prevent money laundering and fraud.', helpfulPct: 84, helpfulCount: 428, updatedAt: '2026-03-28T00:00:00.000Z' },
    { slug: 'card-apply',       category: 'card',     title: 'How do I get my CrymadX Card?',                  excerpt: 'Apply for the Visa card', body: 'Reach KYC L2, then apply via Card → Apply. Virtual card is instant. Physical card ships within 7 days.', helpfulPct: 91, helpfulCount: 532, updatedAt: '2026-04-25T00:00:00.000Z' },
    { slug: 'trading-fees',     category: 'trading',  title: 'What are the trading fees?',                     excerpt: 'Fee schedule for spot/P2P/convert', body: 'Spot: 0.10% maker/taker. Convert: 0.25% spread. P2P: zero platform fee. Tier-based discounts apply.', helpfulPct: 88, helpfulCount: 378, updatedAt: '2026-03-15T00:00:00.000Z' },
  ],

  // ---- Support tickets ----
  supportTickets: [
    { id: 'TKT-8421', userId: 'usr_001', subject: 'Withdrawal stuck on pending',     category: 'wallet',   status: 'open',     team: 'Wallet team',  updatedAt: '2026-04-28T12:00:00.000Z', unread: true,  meta: { 'Tx ID': '#wd_8x4f9', 'Asset': '0.05 BTC', 'Network': 'Bitcoin', 'Submitted': 'Apr 27, 22:30' } },
    { id: 'TKT-8390', userId: 'usr_001', subject: 'Card declined at Spotify',         category: 'card',     status: 'awaiting', team: 'Card team',    updatedAt: '2026-04-27T14:00:00.000Z', unread: false },
    { id: 'TKT-8201', userId: 'usr_001', subject: 'How do I export tax report?',      category: 'other',    status: 'closed',   team: 'Support',      updatedAt: '2026-04-25T10:00:00.000Z', unread: false },
    { id: 'TKT-8120', userId: 'usr_001', subject: '2FA reset request',                 category: 'security', status: 'closed',   team: 'Security',     updatedAt: '2026-04-21T09:00:00.000Z', unread: false },
    { id: 'TKT-8042', userId: 'usr_001', subject: 'Login issue from new device',      category: 'security', status: 'closed',   team: 'Security',     updatedAt: '2026-04-14T14:00:00.000Z', unread: false },
  ],

  supportTicketMessages: [
    { id: 'tm_001', ticketId: 'TKT-8421', authorRole: 'user',  authorName: 'You',         body: 'Hi! My BTC withdrawal of 0.05 BTC has been pending for 18 hours. Can you check what happened?',                                  createdAt: '2026-04-27T22:00:00.000Z' },
    { id: 'tm_002', ticketId: 'TKT-8421', authorRole: 'agent', authorName: 'Wallet Team', body: 'Hi Joseph, thanks for reaching out. We found your tx — stuck due to network congestion. Rebroadcasting now with a higher fee. ETA: 1-2 hours.', createdAt: '2026-04-28T09:00:00.000Z' },
    { id: 'tm_003', ticketId: 'TKT-8421', authorRole: 'user',  authorName: 'You',         body: 'Thanks. I checked the explorer, still showing 0 confirmations.',                                                                  createdAt: '2026-04-28T11:30:00.000Z' },
    { id: 'tm_004', ticketId: 'TKT-8421', authorRole: 'agent', authorName: 'Wallet Team', body: 'Successfully accelerated the tx. It now shows 1 confirmation. Should complete within 30 min. Hash: a8f3...def8',                  createdAt: '2026-04-28T12:00:00.000Z' },
  ],

  // ---- Announcements ----
  announcements: [
    { id: 'ann_001', emoji: '🤖', title: 'CrymadX AI is here',           body: 'Talk or chat with our AI to trade, swap, set alerts, automate strategies. Voice mode is live in beta.', category: 'product',     createdAt: '2026-04-28T00:00:00.000Z', pinned: true  },
    { id: 'ann_002', emoji: '📈', title: 'New Listings · BONK, JUP, PYTH', body: '3 new pairs added with deep liquidity',                                                                category: 'listings',    createdAt: '2026-04-27T00:00:00.000Z', pinned: false },
    { id: 'ann_003', emoji: '💳', title: 'Crypto Card now in Nigeria',    body: 'Apply for the Visa card · 3% cashback',                                                              category: 'product',     createdAt: '2026-04-25T00:00:00.000Z', pinned: false },
    { id: 'ann_004', emoji: '🔥', title: 'New 12% APY locked savings',     body: '30/60/90 day options for USDT',                                                                       category: 'promo',       createdAt: '2026-04-22T00:00:00.000Z', pinned: false },
    { id: 'ann_005', emoji: '🎁', title: 'Refer & Earn $20 boost',         body: 'Doubled rewards through April',                                                                       category: 'promo',       createdAt: '2026-04-18T00:00:00.000Z', pinned: false },
    { id: 'ann_006', emoji: '⚙️', title: 'Maintenance · Sat Apr 30',       body: '15 min · 02:00 GMT for upgrades',                                                                     category: 'maintenance', createdAt: '2026-04-15T00:00:00.000Z', pinned: false },
    { id: 'ann_007', emoji: '🌐', title: 'We support Português now',        body: 'Brazil & Portugal · App + support',                                                                   category: 'product',     createdAt: '2026-04-10T00:00:00.000Z', pinned: false },
  ],

  // ---- System status ----
  systemIncidents: [
    { id: 'inc_001', service: 'AI Assistant',  status: 'investigating', title: 'AI Assistant slower responses', message: 'Investigating elevated latency on Claude Opus model.', at: '2026-04-28T14:30:00.000Z' },
    { id: 'inc_002', service: 'API',            status: 'resolved',      title: 'API rate limit issue resolved',  message: 'Resolved — limits restored to baseline.',                at: '2026-04-28T12:00:00.000Z' },
    { id: 'inc_003', service: 'Maintenance',    status: 'completed',     title: 'Maintenance window completed',   message: 'Scheduled maintenance complete — all services nominal.', at: '2026-04-27T02:00:00.000Z' },
  ],

  // ---- AI ----
  aiConversations: [
    { id: 'conv_001', userId: 'usr_001', title: 'BTC sell strategy',   preview: 'Set $70k alert and scale out…',     pinned: true,  archived: false, messageCount: 14, createdAt: '2026-04-28T12:00:00.000Z', updatedAt: '2026-04-28T14:38:00.000Z' },
    { id: 'conv_002', userId: 'usr_001', title: 'Convert 0.1 ETH',     preview: 'Quoted 380 USDT',                    pinned: false, archived: false, messageCount: 6,  createdAt: '2026-04-28T11:00:00.000Z', updatedAt: '2026-04-28T13:30:00.000Z' },
    { id: 'conv_003', userId: 'usr_001', title: 'Tax report Q4',       preview: 'Generated CSV with 124 entries…',    pinned: false, archived: false, messageCount: 8,  createdAt: '2026-04-28T08:00:00.000Z', updatedAt: '2026-04-28T10:30:00.000Z' },
    { id: 'conv_004', userId: 'usr_001', title: 'Staking SOL plan',    preview: 'Auto-compound rewards weekly',       pinned: false, archived: false, messageCount: 4,  createdAt: '2026-04-27T10:00:00.000Z', updatedAt: '2026-04-27T14:00:00.000Z' },
    { id: 'conv_005', userId: 'usr_001', title: 'Portfolio rebalance', preview: 'Suggested 60/30/10 split',           pinned: false, archived: false, messageCount: 12, createdAt: '2026-04-27T09:00:00.000Z', updatedAt: '2026-04-27T13:00:00.000Z' },
    { id: 'conv_006', userId: 'usr_001', title: 'Price alerts setup',  preview: '3 alerts created',                   pinned: false, archived: false, messageCount: 5,  createdAt: '2026-04-27T08:00:00.000Z', updatedAt: '2026-04-27T08:30:00.000Z' },
    { id: 'conv_007', userId: 'usr_001', title: 'First trade help',    preview: 'Walked through buy',                 pinned: false, archived: true,  messageCount: 7,  createdAt: '2026-04-25T10:00:00.000Z', updatedAt: '2026-04-25T10:30:00.000Z' },
    { id: 'conv_008', userId: 'usr_001', title: 'DCA setup',           preview: 'Daily $10 BTC',                      pinned: false, archived: false, messageCount: 9,  createdAt: '2026-04-23T08:00:00.000Z', updatedAt: '2026-04-23T08:25:00.000Z' },
  ],

  aiMessages: [
    { id: 'msg_001', conversationId: 'conv_001', role: 'user',      text: 'Should I sell my BTC at 70k?', createdAt: '2026-04-28T12:00:00.000Z' },
    { id: 'msg_002', conversationId: 'conv_001', role: 'assistant', text: 'Looking at your portfolio: you hold 0.187 BTC averaged in at $58k. A 70k sell locks ~$2,243 profit. But TA shows resistance at $73k — you might leave gains on the table. Consider scaling out: 50% at $70k, 25% at $73k, 25% at $77k.', createdAt: '2026-04-28T12:00:30.000Z' },
    { id: 'msg_003', conversationId: 'conv_001', role: 'user',      text: 'Set those orders', createdAt: '2026-04-28T12:01:00.000Z' },
    { id: 'msg_004', conversationId: 'conv_001', role: 'assistant', text: 'Done. 3 limit orders placed:\n• 0.0935 BTC @ $70,000\n• 0.04675 BTC @ $73,000\n• 0.04675 BTC @ $77,000\n\nTotal potential: $13,432', createdAt: '2026-04-28T12:01:30.000Z' },
  ],

  aiMemoryItems: [
    { id: 'mem_001', userId: 'usr_001', icon: 'user',      category: 'trading-style', title: 'Trading style: Swing trader',    detail: 'Holds positions 2-7 days',           source: 'Inferred from trade history', createdAt: '2026-04-23T00:00:00.000Z' },
    { id: 'mem_002', userId: 'usr_001', icon: 'target',    category: 'preference',    title: 'Risk tolerance: Moderate',       detail: '60/30/10 BTC/ETH/Alts',              source: 'User stated',                 createdAt: '2026-04-21T00:00:00.000Z' },
    { id: 'mem_003', userId: 'usr_001', icon: 'dollar',    category: 'preference',    title: 'Default fiat: USD',              detail: 'Show all values in USD',             source: 'Settings',                    createdAt: '2026-04-14T00:00:00.000Z' },
    { id: 'mem_004', userId: 'usr_001', icon: 'flag',      category: 'context',       title: 'Tax jurisdiction: Nigeria',      detail: 'Generate NGN tax reports',           source: 'KYC profile',                 createdAt: '2026-04-07T00:00:00.000Z' },
    { id: 'mem_005', userId: 'usr_001', icon: 'zap',       category: 'preference',    title: 'Auto-stake idle SOL',            detail: 'Stake any > 1 SOL via Marinade',     source: 'User instruction',            createdAt: '2026-04-07T00:00:00.000Z' },
    { id: 'mem_006', userId: 'usr_001', icon: 'bell',      category: 'preference',    title: 'Notify only above 5%',           detail: 'Skip 1-2% movement noise',           source: 'User instruction',            createdAt: '2026-03-28T00:00:00.000Z' },
  ],

  aiScheduledActions: [
    { id: 'act_001', userId: 'usr_001', icon: 'chart',    title: 'Buy ETH if BTC < $65k',  description: '0.05 ETH triggered · Limit order',    status: 'active',  trigger: 'BTC price drops below $65,000', action: 'Market buy 0.05 ETH', source: 'Voice command via AI · Apr 25', cooldown: 'Once per 24h', expiresAt: '2026-05-31T00:00:00.000Z', recurring: false, history: [
        { when: '2026-04-26T14:32:00.000Z', type: 'triggered', detail: 'BTC $64,890 · Bought 0.05 ETH' },
        { when: '2026-04-25T09:15:00.000Z', type: 'created',   detail: 'By AI from voice command' },
      ] },
    { id: 'act_002', userId: 'usr_001', icon: 'refresh',  title: 'DCA: $10 BTC daily',     description: 'Recurring · 6 days remaining',         status: 'active',  trigger: 'Daily at 12:00 UTC',           action: 'Buy $10 BTC',         source: 'Auto-Invest plan',                cooldown: 'None',         expiresAt: null,                              recurring: true,  history: [
        { when: '2026-04-28T12:00:00.000Z', type: 'triggered', detail: '$10 → 0.000148 BTC' },
      ] },
    { id: 'act_003', userId: 'usr_001', icon: 'bell',     title: 'Alert: SOL > $200',      description: 'Watching · Notification only',        status: 'active',  trigger: 'SOL price ≥ $200',             action: 'Send push notification',source: 'AI suggestion',                  cooldown: 'Once',         expiresAt: '2026-06-30T00:00:00.000Z', recurring: false, history: [] },
    { id: 'act_004', userId: 'usr_001', icon: 'zap',      title: 'Auto-compound stSOL',    description: 'Weekly · ~6.8% APY',                  status: 'active',  trigger: 'Every Monday 09:00 UTC',       action: 'Restake earned mSOL',  source: 'User instruction',                cooldown: 'Weekly',       expiresAt: null,                              recurring: true,  history: [] },
  ],

  aiTools: [
    { id: 'tool_balance',     name: 'Get balance',          description: 'Read wallet balance',                  scope: 'read',  pinThresholdUsd: null, enabled: true,  category: 'read'  },
    { id: 'tool_prices',      name: 'Read prices',          description: 'Live market data',                     scope: 'read',  pinThresholdUsd: null, enabled: true,  category: 'read'  },
    { id: 'tool_portfolio',   name: 'Read portfolio',       description: 'Holdings & P&L analytics',             scope: 'read',  pinThresholdUsd: null, enabled: true,  category: 'read'  },
    { id: 'tool_send',        name: 'Execute Send',         description: 'Withdrawals & transfers',              scope: 'write', pinThresholdUsd: 0,    enabled: true,  category: 'write' },
    { id: 'tool_swap',        name: 'Execute Swap',         description: 'Convert between assets',               scope: 'write', pinThresholdUsd: 50,   enabled: true,  category: 'write' },
    { id: 'tool_trade',       name: 'Place Trade',          description: 'Spot orders',                          scope: 'write', pinThresholdUsd: 100,  enabled: true,  category: 'write' },
    { id: 'tool_stake',       name: 'Stake / Unstake',      description: 'Liquid staking actions',               scope: 'write', pinThresholdUsd: 0,    enabled: true,  category: 'write' },
    { id: 'tool_alert',       name: 'Set Alert',            description: 'Price + condition alerts',             scope: 'write', pinThresholdUsd: null, enabled: true,  category: 'write' },
    { id: 'tool_card_topup',  name: 'Card Top-up',          description: 'Move USDC to card',                    scope: 'write', pinThresholdUsd: 0,    enabled: false, category: 'write' },
  ],

  aiShares: [
    { id: 'share_001', conversationId: 'conv_001', isPublic: true, expiresAt: '2026-05-05T00:00:00.000Z', createdAt: '2026-04-28T15:00:00.000Z', showAuthorName: false },
  ],

  aiSettings: {
    'usr_001': {
      userId: 'usr_001',
      model: 'Claude Opus 4.7',
      streaming: true,
      autoExecuteUnderUsd: 50,
      defaultChain: 'BTC',
      pinTokenTtlMin: 15,
      biometricForActions: true,
      pinForEverySend: true,
      pinThresholdSwapUsd: 50,
      showPinOnColdStart: true,
      voice: 'Mira',
      voiceSpeed: 1.0,
      pushToTalk: false,
      wakeWord: true,
      autoLanguage: true,
    },
  },

  // ---- P2P ----
  p2pOffers: [
    { id: 'off_001', side: 'sell', sellerName: 'marcus_p',        sellerInitial: 'M', reputationPct: '99.8', reputationCount: 287,  asset: 'USDT', fiatCurrency: 'NGN', price: '1610.00', available: '12500',  minLimit: '100',  maxLimit: '50000',  paymentMethods: ['Bank Transfer', 'OPay', 'PalmPay'],     avgReleaseMin: 15, online: true,  verified: true  },
    { id: 'off_002', side: 'sell', sellerName: 'cryptotrader_ng', sellerInitial: 'C', reputationPct: '98.2', reputationCount: 156,  asset: 'USDT', fiatCurrency: 'NGN', price: '1609.50', available: '6800',   minLimit: '50',   maxLimit: '20000',  paymentMethods: ['Bank Transfer', 'Wise'],                avgReleaseMin: 30, online: false, verified: false },
    { id: 'off_003', side: 'sell', sellerName: 'fast_seller',     sellerInitial: 'F', reputationPct: '100',  reputationCount: 412,  asset: 'USDT', fiatCurrency: 'NGN', price: '1608.00', available: '90000',  minLimit: '500',  maxLimit: '100000', paymentMethods: ['Bank Transfer', 'MoMo', 'OPay'],        avgReleaseMin: 15, online: true,  verified: true  },
    { id: 'off_004', side: 'sell', sellerName: 'emma_market',     sellerInitial: 'E', reputationPct: '97.5', reputationCount: 89,   asset: 'USDT', fiatCurrency: 'NGN', price: '1607.50', available: '4500',   minLimit: '100',  maxLimit: '5000',   paymentMethods: ['OPay', 'PalmPay'],                      avgReleaseMin: 30, online: true,  verified: false },
    { id: 'off_005', side: 'sell', sellerName: 'btc_master',      sellerInitial: 'B', reputationPct: '99.5', reputationCount: 1200, asset: 'USDT', fiatCurrency: 'NGN', price: '1606.00', available: '28000',  minLimit: '50',   maxLimit: '30000',  paymentMethods: ['Bank Transfer'],                        avgReleaseMin: 20, online: true,  verified: true  },
  ],

  p2pOrders: [
    { id: 'po_001', userId: 'usr_001', offerId: 'off_001', side: 'buy', cryptoAsset: 'USDT', cryptoAmount: '500', fiatAmount: '805000', fiatCurrency: 'NGN', rate: '1610', paymentMethod: 'Bank Transfer', bankName: 'Access Bank', accountNumber: '3038492854', accountName: 'Marcus P. Olamide', reference: '#x8a3f9e2', counterpartyName: 'marcus_p', counterpartyInitial: 'M', status: 'pending-payment', expiresAt: new Date(Date.now() + 12 * 60_000).toISOString(), timeline: [
        { icon: 'check', title: 'Order placed',                  detail: '14:32',          tone: 'g'  },
        { icon: 'clock', title: 'Awaiting your payment',         detail: '14:34 · 12m left', tone: 'gd' },
        { icon: 'msg',   title: 'Mark paid → seller releases',   detail: '—',              tone: 'mute' },
      ], createdAt: '2026-04-28T14:32:00.000Z' },
  ],

  p2pMessages: [
    { id: 'pm_001', orderId: 'po_001', senderId: 'marcus_p', senderName: 'marcus_p', text: 'Hi Joseph! Please send to Access Bank 3038492854. Reference: #x8a3f9e2',         createdAt: '2026-04-28T14:32:00.000Z' },
    { id: 'pm_002', orderId: 'po_001', senderId: 'usr_001',  senderName: 'You',     text: 'Got it. Sending now.',                                                              createdAt: '2026-04-28T14:32:30.000Z' },
    { id: 'pm_003', orderId: 'po_001', senderId: 'marcus_p', senderName: 'marcus_p', text: 'Take your time, please attach payment proof when done 🙏',                          createdAt: '2026-04-28T14:33:00.000Z' },
  ],

  p2pPaymentMethods: [
    { id: 'pp_001', userId: 'usr_001', type: 'bank',         provider: 'Access Bank', label: 'Access Bank · ****2854', accountName: 'Joseph Obasi', accountValue: '****2854',     fiatCurrency: 'NGN', status: 'verified' },
    { id: 'pp_002', userId: 'usr_001', type: 'wise',         provider: 'Wise',        label: 'Wise USD · ****8734',    accountName: 'Joseph Obasi', accountValue: '****8734',     fiatCurrency: 'USD', status: 'verified' },
    { id: 'pp_003', userId: 'usr_001', type: 'mobile-money', provider: 'OPay',        label: 'OPay · 0801****678',     accountName: 'Joseph O.',    accountValue: '0801****678',  fiatCurrency: 'NGN', status: 'verified' },
    { id: 'pp_004', userId: 'usr_001', type: 'mobile-money', provider: 'PalmPay',     label: 'PalmPay · 0810****555',  accountName: 'Joseph O.',    accountValue: '0810****555',  fiatCurrency: 'NGN', status: 'pending'  },
  ],

  // ---- Card ----
  cards: {
    'usr_001': {
      id: 'card_001',
      userId: 'usr_001',
      cardLast4: '4821',
      cardholderName: 'JOSEPH OBASI',
      status: 'active',
      type: 'virtual',
      network: 'visa',
      balance: '248.50',
      balanceCurrency: 'USD',
      dailySpendLimit: '500',
      monthlySpendLimit: '1000',
      spentToday: '184.32',
      spentMonth: '184.32',
      contactlessEnabled: true,
      onlineEnabled: true,
      internationalEnabled: true,
      allowedRegions: ['🇳🇬 Nigeria', '🇬🇧 UK', '🇺🇸 US'],
      cashbackPct: '3',
      cashbackEarned: '5.52',
      txnsThisMonth: 22,
    },
  },

  cardTransactions: [
    { id: 'ct_001', userId: 'usr_001', merchant: 'Starbucks',         category: 'Coffee',       amount: '8.50',   cashback: '+$0.26 cashback',  createdAt: '2026-04-28T09:14:00.000Z', status: 'approved', merchantTint: '185,138,121' },
    { id: 'ct_002', userId: 'usr_001', merchant: 'Amazon',            category: 'Online',       amount: '42.99',  cashback: '+$1.29 cashback',  createdAt: '2026-04-27T18:30:00.000Z', status: 'approved', merchantTint: '255,153,0'   },
    { id: 'ct_003', userId: 'usr_001', merchant: 'Shell',             category: 'Fuel',         amount: '58.00',  cashback: '+$1.74 cashback',  createdAt: '2026-04-26T14:22:00.000Z', status: 'approved', merchantTint: '255,221,0'   },
    { id: 'ct_004', userId: 'usr_001', merchant: 'Spotify',           category: 'Subscription', amount: '9.99',   cashback: '+$0.30 cashback',  createdAt: '2026-04-25T12:00:00.000Z', status: 'approved', merchantTint: '30,215,96'   },
    { id: 'ct_005', userId: 'usr_001', merchant: 'McDonald\'s',       category: 'Fast Food',    amount: '12.45',  cashback: '+$0.37 cashback',  createdAt: '2026-04-25T09:11:00.000Z', status: 'approved', merchantTint: '255,196,17'  },
    { id: 'ct_006', userId: 'usr_001', merchant: 'Uber',              category: 'Transport',    amount: '18.20',  cashback: '+$0.55 cashback',  createdAt: '2026-04-24T22:18:00.000Z', status: 'approved', merchantTint: '35,35,35'    },
    { id: 'ct_007', userId: 'usr_001', merchant: 'Netflix',           category: 'Subscription', amount: '15.49',  cashback: 'Declined · Limit', createdAt: '2026-04-23T03:00:00.000Z', status: 'declined', declineReason: 'Daily limit', merchantTint: '229,9,20' },
    { id: 'ct_008', userId: 'usr_001', merchant: 'Apple Pay Top-Up',  category: 'Top-up',       amount: '100.00', cashback: 'From USDC',        createdAt: '2026-04-22T14:00:00.000Z', status: 'approved', merchantTint: '120,120,120' },
  ],

  // ---- NFT ----
  nfts: [
    { id: 'nft_001', ownerId: 'usr_001', collection: 'Cyber Apes',   collectionVerified: true,  tokenId: '#2840', name: 'Cyber Ape #2840',   chain: 'ETH',    price: '1.59', priceCurrency: 'ETH',    lastSale: '1.42 ETH', lastSaleChange: '+12%', contractAddress: '0x47a...e8a', imageGradient: 'linear-gradient(135deg, #1a3a2e, #2a5a3e)', traits: [
        { key: 'Background', value: 'Forest',      rarity: '12%' },
        { key: 'Body',       value: 'Cyber Green', rarity: '8%'  },
        { key: 'Eyes',       value: 'Laser Red',   rarity: '3% · RARE' },
        { key: 'Hat',        value: 'Crown',       rarity: '5%'  },
        { key: 'Mouth',      value: 'Smile',       rarity: '22%' },
        { key: 'Outfit',     value: 'Spacesuit',   rarity: '7%'  },
      ] },
    { id: 'nft_002', ownerId: 'usr_001', collection: 'Mystic Cats',  collectionVerified: true,  tokenId: '#1492', name: 'Mystic Cat #1492',  chain: 'ETH',    price: '0.85', priceCurrency: 'ETH',    contractAddress: '0xb88...d2e', imageGradient: 'linear-gradient(135deg, #1a2a3e, #2a3a5e)', traits: [] },
    { id: 'nft_003', ownerId: 'usr_001', collection: 'Pixel Punks',  collectionVerified: false, tokenId: '#4500', name: 'Pixel Punk #4500',  chain: 'ETH',    price: '2.10', priceCurrency: 'ETH',    contractAddress: '0xab1...f4c', imageGradient: 'linear-gradient(135deg, #2a1a3e, #4a2a5e)', traits: [] },
    { id: 'nft_004', ownerId: 'usr_001', collection: 'Wave Surfers', collectionVerified: true,  tokenId: '#847',  name: 'Wave Surfer #847',  chain: 'POLYGON', price: '450', priceCurrency: 'MATIC', contractAddress: '0x982...c3f', imageGradient: 'linear-gradient(135deg, #3a2a1a, #5a3a2a)', traits: [] },
    { id: 'nft_005', ownerId: null,      collection: 'Genesis Mint', collectionVerified: true,  tokenId: '#001',  name: 'Genesis #001',      chain: 'ETH',    price: '3.50', priceCurrency: 'ETH',    contractAddress: '0xf3a...2e0', imageGradient: 'linear-gradient(135deg, #0a3a18, #1B8C3E)', traits: [] },
    { id: 'nft_006', ownerId: null,      collection: 'Galaxy Map',   collectionVerified: false, tokenId: '#233',  name: 'Galaxy Map #233',   chain: 'ETH',    price: '1.25', priceCurrency: 'ETH',    contractAddress: '0xc88...b1a', imageGradient: 'linear-gradient(135deg, #3a1a4e, #4a2a6e)', traits: [] },
    { id: 'nft_007', ownerId: null,      collection: 'Cyber Apes',   collectionVerified: true,  tokenId: '#3000', name: 'Cyber Ape #3000',   chain: 'ETH',    price: '1.66', priceCurrency: 'ETH',    contractAddress: '0x47a...e8a', imageGradient: 'linear-gradient(135deg, #1a3a4e, #2a4a6e)', traits: [] },
    { id: 'nft_008', ownerId: null,      collection: 'Mystic Cats',  collectionVerified: true,  tokenId: '#2000', name: 'Mystic Cat #2000',  chain: 'ETH',    price: '0.92', priceCurrency: 'ETH',    contractAddress: '0xb88...d2e', imageGradient: 'linear-gradient(135deg, #3a4e1a, #5e6e2a)', traits: [] },
  ],

  prefs: {
    theme: 'dark',
    language: 'en',
    currency: 'USD',
    notifications: {
      'push': true,
      'email': true,
      'sms': false,
      'order.filled': true,
      'order.cancelled': false,
      'limit.reached': true,
      'deposit.confirmed': true,
      'withdrawal.processed': true,
      'large.transfer': true,
      'listings': true,
      'announcements': false,
      'marketing': false,
    },
  },
}

// ---------- Persistence ----------

const STORAGE_KEY = 'crymadx.mock.db.v4'

let _db: MockDb | null = null

export function loadDb(): MockDb {
  if (_db) return _db
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        _db = JSON.parse(stored) as MockDb
        return _db
      } catch {
        // fall through to seed
      }
    }
  }
  _db = structuredClone(SEED_DB)
  saveDb()
  return _db
}

export function saveDb(): void {
  if (!_db) return
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_db))
  }
}

export function resetDb(): void {
  _db = structuredClone(SEED_DB)
  saveDb()
}

/**
 * Mutate the DB. Pass a function that receives the live DB; mutations
 * inside are persisted. Safer than direct mutation.
 */
export function mutateDb<T>(fn: (db: MockDb) => T): T {
  const db = loadDb()
  const result = fn(db)
  saveDb()
  return result
}
