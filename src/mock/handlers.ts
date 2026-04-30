/**
 * MOCK HANDLERS
 * -------------
 * Implements every endpoint in src/api/endpoints.ts against the mock DB.
 * Returns the same shapes the real backend will return.
 *
 * NOTE: Phase 1 fills in only the endpoints used by phase 1 screens.
 * Subsequent phases extend this map. The default path returns 501.
 */

import type { EndpointId } from '../api/endpoints'
import { loadDb, mutateDb } from './db'
import type { Balance, Transaction } from '../api/endpoints'
import type { TradingOrder, FiatOrder, AutoInvestPlan, SavingsPosition, StakingPosition, AIMessage, P2POrder, PriceAlert, APIKey } from './db'

type Ctx = {
  pathParams: Record<string, string>
  query: Record<string, string>
  body?: unknown
}

type Handler = (ctx: Ctx) => Promise<unknown>

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

function aiReply(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('balance')) return 'You have 0.187 BTC (≈$12,541). Up +2.89% today. Want me to set a sell alert?'
  if (t.includes('alert')) return 'Got it — I\'ll watch the price and ping you when it crosses your threshold. PIN required if it triggers a trade.'
  if (t.includes('convert') || t.includes('swap')) return 'Quote ready: 0.05 BTC → 3,353.42 USDT. Rate 67,068. Fee 0.0005 BTC. Confirm with PIN to execute.'
  if (t.includes('stake')) return 'Marinade SOL is 6.8% APY, instant unstake. Lido ETH is 4.2% APY with 2-4d unbond. Which one?'
  if (t.includes('p2p') || t.includes('local')) return 'Found 5 sellers offering USDT for NGN. Best rate: ₦1,610 from marcus_p (99.8% rep, 287 trades).'
  if (t.includes('tax')) return 'Q4 tax report ready: 124 transactions, $1,247 realized gains, $84 staking income. Export as CSV/PDF?'
  return 'Got it — I\'m on it. Tell me a price target, an asset, or an action — I\'ll execute (PIN-gated) or watch.'
}

// ---------- Helpers ----------

function requireAuth(): string {
  const db = loadDb()
  if (!db.authUserId) {
    throw new ApiError('UNAUTHENTICATED', 'Sign in required', 401)
  }
  return db.authUserId
}

class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

// ---------- Handlers (phase 1 subset) ----------

const handlers: Partial<Record<EndpointId, Handler>> = {
  // Auth
  'api.auth.login': async ({ body }) => {
    await wait(400)
    const { email, password } = body as { email: string; password: string }
    if (!email || !password) {
      throw new ApiError('INVALID_CREDENTIALS', 'Email and password are required', 400)
    }
    return mutateDb(db => {
      // Demo: any email/password works, signs in as usr_001
      db.authUserId = 'usr_001'
      const user = db.users['usr_001']
      return {
        accessToken: 'mock_token_' + Date.now(),
        refreshToken: 'mock_refresh_' + Date.now(),
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        user,
        requires2FA: false,
      }
    })
  },

  'api.auth.register': async ({ body }) => {
    await wait(500)
    const { firstName, lastName, email } = body as { firstName?: string; lastName?: string; email: string; password: string }
    if (!email) throw new ApiError('INVALID', 'Email required')
    return {
      userId: 'pending_' + Date.now(),
      email,
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      requiresEmailVerification: true,
    }
  },

  'api.auth.verify-email': async ({ body }) => {
    await wait(300)
    const { code } = body as { code: string }
    if (!code || code.length !== 6) {
      throw new ApiError('INVALID_CODE', 'Enter the 6-digit code')
    }
    return { verified: true }
  },

  'api.auth.logout': async () => {
    await wait(200)
    mutateDb(db => { db.authUserId = null })
    return { success: true }
  },

  // User
  'api.user.profile.get': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return db.users[userId]
  },

  // Wallet
  'api.wallet.balances.list': async () => {
    const userId = requireAuth()
    await wait(150)
    const db = loadDb()
    const balances: Balance[] = db.balances.filter(b => b.userId === userId)
    const total = balances.reduce((s, b) => s + parseFloat(b.usdValue), 0)
    return {
      total: total.toFixed(2),
      change24h: '+2.26',
      changeAbs: '+284.18',
      items: balances,
    }
  },

  'api.wallet.balance.get': async ({ pathParams }) => {
    const userId = requireAuth()
    const db = loadDb()
    const b = db.balances.find(b => b.userId === userId && b.asset === pathParams.asset)
    if (!b) throw new ApiError('NOT_FOUND', `No balance for ${pathParams.asset}`, 404)
    return b
  },

  'api.wallet.networks.list': async ({ pathParams }) => {
    await wait(100)
    const NETWORKS: Record<string, Array<{ id: string; name: string; description: string; recommended?: boolean }>> = {
      USDT: [
        { id: 'TRC20',     name: 'TRON',         description: 'Fast · Low fee',     recommended: true },
        { id: 'ERC20',     name: 'Ethereum',     description: 'Slow · High fee' },
        { id: 'BEP20',     name: 'BNB Chain',    description: 'Fast · Low fee' },
        { id: 'POLYGON',   name: 'Polygon',      description: 'Fast · Very low' },
        { id: 'SOLANA',    name: 'Solana (SPL)', description: 'Instant' },
        { id: 'ARBITRUM',  name: 'Arbitrum One', description: 'Fast · Low' },
      ],
      BTC: [{ id: 'BTC', name: 'Bitcoin', description: 'Native', recommended: true }],
      ETH: [{ id: 'ERC20', name: 'Ethereum', description: 'Native', recommended: true }],
      USDC: [
        { id: 'ERC20',   name: 'Ethereum',     description: 'Standard',         recommended: true },
        { id: 'POLYGON', name: 'Polygon',      description: 'Fast · Very low' },
        { id: 'BASE',    name: 'Base',         description: 'Fast · Low' },
        { id: 'SOLANA',  name: 'Solana (SPL)', description: 'Instant' },
      ],
      SOL: [{ id: 'SOLANA', name: 'Solana', description: 'Native', recommended: true }],
    }
    const list = NETWORKS[pathParams.asset] ?? []
    if (!list.length) throw new ApiError('NOT_FOUND', `No networks for ${pathParams.asset}`, 404)
    return { networks: list }
  },

  'api.wallet.deposit.address': async ({ pathParams }) => {
    await wait(150)
    requireAuth()
    const ADDRESSES: Record<string, string> = {
      'BTC:BTC':       'bc1qey5rqhufuks84s5cssc6uf2zqvdedjgcq3v8pd',
      'USDT:TRC20':    'TR8gBnaEJzKqAycUDVEUpHL7eN3kd2',
      'USDT:ERC20':    '0x47f1a58b89d7895df1f222b6f7c5e8e379272f8a',
      'ETH:ERC20':     '0x47f1a58b89d7895df1f222b6f7c5e8e379272f8a',
      'USDC:ERC20':    '0x47f1a58b89d7895df1f222b6f7c5e8e379272f8a',
      'USDC:BASE':     '0xb88e4d2e9c4d567890123abc4567def8a8f3b92e',
      'SOL:SOLANA':    '5Hp9YqZ4xQ1mD3jKNvSt8vR2eY',
    }
    const key = `${pathParams.asset}:${pathParams.network}`
    const address = ADDRESSES[key]
    if (!address) throw new ApiError('NOT_FOUND', `No address for ${key}`, 404)
    return {
      asset: pathParams.asset,
      network: pathParams.network,
      address,
      qrData: address,
      minDeposit: '0.0001',
      confirmations: pathParams.network === 'BTC' ? 3 : 12,
      eta: pathParams.network === 'BTC' ? '~10 min' : '~3 min',
    }
  },

  'api.wallet.withdraw.fee': async ({ query }) => {
    await wait(100)
    const asset = query.asset || 'BTC'
    const FEES: Record<string, string> = {
      BTC: '0.00025', ETH: '0.0012', USDT: '1.0', USDC: '1.0', SOL: '0.0005', MATIC: '0.05',
    }
    return { asset, fee: FEES[asset] ?? '0', feeUsd: '16.81' }
  },

  'api.wallet.withdraw.create': async ({ body }) => {
    await wait(800)
    const userId = requireAuth()
    const { asset, network, address, amount, fee } = body as { asset: string; network: string; address: string; amount: string; fee: string }
    if (!asset || !address || !amount) throw new ApiError('INVALID', 'Missing fields')
    return mutateDb(db => {
      const tx: Transaction = {
        id: 'tx_' + Date.now(),
        userId,
        type: 'withdraw',
        asset,
        amount,
        status: 'pending',
        network,
        toAddress: address,
        fee,
        feeAsset: asset,
        createdAt: new Date().toISOString(),
      }
      db.transactions.unshift(tx)
      // debit balance
      const bal = db.balances.find(b => b.userId === userId && b.asset === asset)
      if (bal) {
        const newAmt = (parseFloat(bal.amount) - parseFloat(amount) - parseFloat(fee)).toFixed(8)
        bal.amount = newAmt
      }
      return tx
    })
  },

  // Transactions
  'api.tx.list': async ({ query }) => {
    const userId = requireAuth()
    await wait(120)
    const db = loadDb()
    let items = db.transactions.filter(t => t.userId === userId)
    if (query.type) items = items.filter(t => t.type === query.type)
    return { items, nextCursor: null }
  },

  'api.tx.get': async ({ pathParams }) => {
    const userId = requireAuth()
    const db = loadDb()
    const tx = db.transactions.find(t => t.id === pathParams.txId && t.userId === userId)
    if (!tx) throw new ApiError('NOT_FOUND', `No transaction ${pathParams.txId}`, 404)
    return tx
  },

  // Markets
  'api.markets.list': async ({ query }) => {
    await wait(100)
    const db = loadDb()
    let pairs = db.marketPairs
    if (query.tab === 'gainers') pairs = pairs.filter(p => parseFloat(p.change24h) > 0)
    if (query.tab === 'losers') pairs = pairs.filter(p => parseFloat(p.change24h) < 0)
    return { items: pairs }
  },

  // ---- Convert ----
  'api.wallet.convert.quote': async ({ body }) => {
    await wait(250)
    requireAuth()
    const { fromAsset, toAsset, fromAmount } = body as { fromAsset: string; toAsset: string; fromAmount: string }
    if (!fromAsset || !toAsset || !fromAmount) throw new ApiError('INVALID', 'Missing fields')
    const db = loadDb()
    const fromPair = db.marketPairs.find(p => p.base === fromAsset && p.quote === 'USDT')
    const toPair = db.marketPairs.find(p => p.base === toAsset && p.quote === 'USDT')
    const fromUsd = fromAsset === 'USDT' || fromAsset === 'USDC' ? 1 : parseFloat(fromPair?.price ?? '0')
    const toUsd = toAsset === 'USDT' || toAsset === 'USDC' ? 1 : parseFloat(toPair?.price ?? '0')
    if (!fromUsd || !toUsd) throw new ApiError('UNSUPPORTED_PAIR', 'Pair not supported', 404)
    const fromQty = parseFloat(fromAmount)
    const grossUsd = fromQty * fromUsd
    const feeUsd = grossUsd * 0.0025
    const netUsd = grossUsd - feeUsd
    const toQty = netUsd / toUsd
    const rate = (toQty / fromQty).toFixed(8)
    return {
      quoteId: 'q_' + Date.now(),
      fromAsset, toAsset,
      fromAmount: fromQty.toFixed(8),
      toAmount: toQty.toFixed(8),
      rate,
      feeUsdt: feeUsd.toFixed(2),
      slippage: '0.10',
      validForSec: 14,
      expiresAt: new Date(Date.now() + 14_000).toISOString(),
    }
  },

  'api.wallet.convert.execute': async ({ body }) => {
    await wait(700)
    const userId = requireAuth()
    const { fromAsset, toAsset, fromAmount, toAmount } = body as { fromAsset: string; toAsset: string; fromAmount: string; toAmount: string }
    return mutateDb(db => {
      const fromBal = db.balances.find(b => b.userId === userId && b.asset === fromAsset)
      const toBal = db.balances.find(b => b.userId === userId && b.asset === toAsset)
      if (!fromBal || parseFloat(fromBal.amount) < parseFloat(fromAmount)) {
        throw new ApiError('INSUFFICIENT_BALANCE', `Not enough ${fromAsset}`, 400)
      }
      fromBal.amount = (parseFloat(fromBal.amount) - parseFloat(fromAmount)).toFixed(8)
      if (toBal) {
        toBal.amount = (parseFloat(toBal.amount) + parseFloat(toAmount)).toFixed(8)
      } else {
        db.balances.push({ id: 'bal_' + Date.now(), userId, asset: toAsset, amount: toAmount, usdValue: '0' })
      }
      const tx: Transaction = {
        id: 'tx_' + Date.now(),
        userId,
        type: 'convert',
        asset: `${fromAsset}→${toAsset}`,
        amount: toAmount,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }
      db.transactions.unshift(tx)
      return tx
    })
  },

  // ---- Asset detail / market ----
  'api.markets.pair': async ({ pathParams }) => {
    await wait(80)
    const db = loadDb()
    const p = db.marketPairs.find(m => m.symbol === pathParams.pair || m.base === pathParams.pair)
    if (!p) throw new ApiError('NOT_FOUND', `No pair ${pathParams.pair}`, 404)
    return p
  },

  'api.markets.candles': async ({ query }) => {
    await wait(60)
    const interval = query.interval ?? '15m'
    const seed = String(interval)
    const candles = Array.from({ length: 38 }, (_, i) => {
      const open = 60 + ((seed.charCodeAt(0) + i * 7) % 30)
      const close = open + ((i % 3) - 1) * 4
      const high = Math.max(open, close) + 2
      const low = Math.min(open, close) - 2
      return { t: Date.now() - (38 - i) * 60_000, o: open, h: high, l: low, c: close }
    })
    return { items: candles }
  },

  'api.markets.orderbook': async ({ pathParams }) => {
    await wait(60)
    const db = loadDb()
    const p = db.marketPairs.find(m => m.symbol === pathParams.pair)
    const mid = p ? parseFloat(p.price) : 67000
    const bids = Array.from({ length: 6 }, (_, i) => ({ price: (mid - (i + 1) * 5).toFixed(2), amount: ((Math.random() + 0.1) * 1).toFixed(3) }))
    const asks = Array.from({ length: 6 }, (_, i) => ({ price: (mid + (i + 1) * 5).toFixed(2), amount: ((Math.random() + 0.1) * 1).toFixed(3) }))
    return { bids, asks, spread: '0.01%' }
  },

  // ---- Beneficiaries ----
  'api.beneficiaries.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.beneficiaries.filter(b => b.userId === userId) }
  },

  'api.beneficiaries.create': async ({ body }) => {
    await wait(200)
    const userId = requireAuth()
    const b = body as { name: string; asset: string; network: string; address: string }
    return mutateDb(db => {
      const ben = { id: 'ben_' + Date.now(), userId, ...b, favorite: false }
      db.beneficiaries.push(ben)
      return ben
    })
  },

  'api.beneficiaries.delete': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const i = db.beneficiaries.findIndex(b => b.id === pathParams.id)
      if (i < 0) throw new ApiError('NOT_FOUND', `No beneficiary ${pathParams.id}`, 404)
      db.beneficiaries.splice(i, 1)
      return { ok: true }
    })
  },

  // ---- Trading ----
  'api.trading.order.create': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { pair, side, type, price, amount } = body as { pair: string; side: 'buy' | 'sell'; type: 'limit' | 'market' | 'stop-limit'; price: string; amount: string }
    return mutateDb(db => {
      const total = (parseFloat(price) * parseFloat(amount)).toFixed(2)
      const order: TradingOrder = {
        id: 'ord_' + Date.now(),
        userId,
        pair, side, type, price, amount,
        filled: '0',
        total,
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      db.tradingOrders.unshift(order)
      return order
    })
  },

  'api.trading.order.cancel': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const o = db.tradingOrders.find(o => o.id === pathParams.orderId)
      if (!o) throw new ApiError('NOT_FOUND', `No order ${pathParams.orderId}`, 404)
      if (o.status !== 'open' && o.status !== 'partial') throw new ApiError('INVALID_STATE', 'Order not cancellable')
      o.status = 'cancelled'
      return o
    })
  },

  'api.trading.orders.open': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.tradingOrders.filter(o => o.userId === userId && (o.status === 'open' || o.status === 'partial')) }
  },

  'api.trading.orders.history': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.tradingOrders.filter(o => o.userId === userId && (o.status === 'filled' || o.status === 'cancelled')) }
  },

  'api.trading.trades': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.trades.filter(t => t.userId === userId) }
  },

  'api.trading.trade': async ({ pathParams }) => {
    const userId = requireAuth()
    const db = loadDb()
    const t = db.trades.find(t => t.id === pathParams.tradeId && t.userId === userId)
    if (!t) throw new ApiError('NOT_FOUND', `No trade ${pathParams.tradeId}`, 404)
    return t
  },

  // ---- Earn · Savings ----
  'api.earn.savings.products': async ({ query }) => {
    const db = loadDb()
    let items = db.savingsProducts
    if (query.asset) items = items.filter(p => p.asset === query.asset)
    if (query.type) items = items.filter(p => p.type === query.type)
    return { items }
  },

  'api.earn.savings.positions': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.savingsPositions.filter(p => p.userId === userId && p.status === 'active') }
  },

  'api.earn.savings.deposit': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { productId, amount } = body as { productId: string; amount: string }
    return mutateDb(db => {
      const product = db.savingsProducts.find(p => p.id === productId)
      if (!product) throw new ApiError('NOT_FOUND', `Product ${productId}`, 404)
      const bal = db.balances.find(b => b.userId === userId && b.asset === product.asset)
      if (!bal || parseFloat(bal.amount) < parseFloat(amount)) throw new ApiError('INSUFFICIENT_BALANCE', 'Not enough balance')
      bal.amount = (parseFloat(bal.amount) - parseFloat(amount)).toFixed(8)
      const start = new Date().toISOString()
      const end = product.termDays > 0 ? new Date(Date.now() + product.termDays * 86400_000).toISOString() : null
      const pos: SavingsPosition = {
        id: 'svps_' + Date.now(),
        userId,
        productId,
        asset: product.asset,
        amount,
        earned: '0',
        apy: product.apy,
        startDate: start,
        endDate: end,
        status: 'active',
      }
      db.savingsPositions.push(pos)
      return pos
    })
  },

  // ---- Earn · Staking ----
  'api.earn.staking.products': async ({ query }) => {
    const db = loadDb()
    let items = db.stakingProducts
    if (query.protocol) items = items.filter(p => p.protocol === query.protocol)
    return { items }
  },

  'api.earn.staking.positions': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.stakingPositions.filter(p => p.userId === userId) }
  },

  'api.earn.staking.stake': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { productId, amount } = body as { productId: string; amount: string }
    return mutateDb(db => {
      const product = db.stakingProducts.find(p => p.id === productId)
      if (!product) throw new ApiError('NOT_FOUND', 'Product not found', 404)
      const bal = db.balances.find(b => b.userId === userId && b.asset === product.asset)
      if (!bal || parseFloat(bal.amount) < parseFloat(amount)) throw new ApiError('INSUFFICIENT_BALANCE', 'Not enough balance')
      bal.amount = (parseFloat(bal.amount) - parseFloat(amount)).toFixed(8)
      const pos: StakingPosition = {
        id: 'stps_' + Date.now(),
        userId,
        productId,
        asset: product.asset,
        amount,
        earned: '0',
        liquidAmount: amount,
        startDate: new Date().toISOString(),
      }
      db.stakingPositions.push(pos)
      return pos
    })
  },

  'api.earn.staking.unstake': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { positionId, amount } = body as { positionId: string; amount: string }
    return mutateDb(db => {
      const pos = db.stakingPositions.find(p => p.id === positionId && p.userId === userId)
      if (!pos) throw new ApiError('NOT_FOUND', 'Position not found', 404)
      const liquid = parseFloat(pos.liquidAmount)
      const unstake = parseFloat(amount)
      if (unstake > liquid) throw new ApiError('INVALID', 'Amount exceeds position')
      pos.liquidAmount = (liquid - unstake).toFixed(8)
      pos.amount = (parseFloat(pos.amount) - unstake).toFixed(8)
      const bal = db.balances.find(b => b.userId === userId && b.asset === pos.asset)
      const product = db.stakingProducts.find(p => p.id === pos.productId)
      const ratio = 1.0024 // mock liquid token redemption ratio
      const credited = unstake * ratio
      if (bal) bal.amount = (parseFloat(bal.amount) + credited).toFixed(8)
      return { positionId, asset: pos.asset, amountReceived: credited.toFixed(8), unbondingDays: product?.unbondingDays ?? 0 }
    })
  },

  // ---- Earn · Auto-Invest ----
  'api.earn.autoinvest.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.autoInvestPlans.filter(p => p.userId === userId) }
  },

  'api.earn.autoinvest.create': async ({ body }) => {
    await wait(300)
    const userId = requireAuth()
    const b = body as Omit<AutoInvestPlan, 'id' | 'userId' | 'totalInvested' | 'pnlPct' | 'cyclesCompleted' | 'cyclesTotal' | 'status' | 'nextRunAt'> & { totalCycles?: number }
    return mutateDb(db => {
      const plan: AutoInvestPlan = {
        id: 'aip_' + Date.now(),
        userId,
        ...b,
        nextRunAt: new Date(Date.now() + 86400_000).toISOString(),
        totalInvested: '0',
        pnlPct: '0',
        status: 'active',
        cyclesCompleted: 0,
        cyclesTotal: b.totalCycles ?? 12,
      }
      db.autoInvestPlans.push(plan)
      return plan
    })
  },

  'api.earn.autoinvest.update': async ({ pathParams, body }) => {
    requireAuth()
    return mutateDb(db => {
      const p = db.autoInvestPlans.find(x => x.id === pathParams.id)
      if (!p) throw new ApiError('NOT_FOUND', 'Plan not found', 404)
      Object.assign(p, body)
      return p
    })
  },

  // ---- Earn · Vault ----
  'api.earn.vault.list': async () => {
    const db = loadDb()
    return { items: db.vaultProducts }
  },

  // ---- Fiat ----
  'api.fiat.quote': async ({ body }) => {
    await wait(300)
    const { fiatAmount, fiatCurrency, cryptoAsset } = body as { fiatAmount: string; fiatCurrency: string; cryptoAsset: string }
    if (!fiatAmount || !cryptoAsset) throw new ApiError('INVALID', 'Missing fields')
    const db = loadDb()
    const pair = db.marketPairs.find(p => p.base === cryptoAsset)
    if (!pair) throw new ApiError('UNSUPPORTED_ASSET', `${cryptoAsset} not supported`, 400)
    const usdAmount = parseFloat(fiatAmount)
    const fee = (usdAmount * 0.005).toFixed(2)
    const netUsd = usdAmount - parseFloat(fee)
    const cryptoAmount = (netUsd / parseFloat(pair.price)).toFixed(8)
    return {
      quoteId: 'fq_' + Date.now(),
      fiatAmount,
      fiatCurrency,
      cryptoAmount,
      cryptoAsset,
      rate: pair.price,
      fee,
      networkFee: '2.00',
      validForSec: 30,
    }
  },

  'api.fiat.order.create': async ({ body }) => {
    await wait(700)
    const userId = requireAuth()
    const b = body as { fiatAmount: string; fiatCurrency: string; cryptoAmount: string; cryptoAsset: string; rate: string; fee: string; paymentMethod: string }
    return mutateDb(db => {
      const order: FiatOrder = {
        id: 'fo_' + Date.now(),
        userId,
        ...b,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      db.fiatOrders.unshift(order)
      return order
    })
  },

  'api.fiat.order.status': async ({ pathParams }) => {
    const userId = requireAuth()
    const db = loadDb()
    const order = db.fiatOrders.find(o => o.id === pathParams.orderId && o.userId === userId)
    if (!order) throw new ApiError('NOT_FOUND', `No order ${pathParams.orderId}`, 404)
    // Auto-progress mock orders to completed after a few seconds.
    if (order.status === 'pending' && (Date.now() - new Date(order.createdAt).getTime()) > 3000) {
      return mutateDb(db => {
        const o = db.fiatOrders.find(x => x.id === order.id)!
        o.status = 'completed'
        o.completedAt = new Date().toISOString()
        // credit balance
        const bal = db.balances.find(x => x.userId === userId && x.asset === o.cryptoAsset)
        if (bal) {
          bal.amount = (parseFloat(bal.amount) + parseFloat(o.cryptoAmount)).toFixed(8)
        } else {
          db.balances.push({ id: 'bal_' + Date.now(), userId, asset: o.cryptoAsset, amount: o.cryptoAmount, usdValue: o.fiatAmount })
        }
        const tx: Transaction = {
          id: 'tx_' + Date.now(),
          userId,
          type: 'deposit',
          asset: o.cryptoAsset,
          amount: o.cryptoAmount,
          status: 'completed',
          createdAt: new Date().toISOString(),
        }
        db.transactions.unshift(tx)
        return o
      })
    }
    return order
  },

  // ---- AI · Chat & history ----
  'api.ai.chat.history': async () => {
    const userId = requireAuth()
    const db = loadDb()
    const items = db.aiConversations.filter(c => c.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return { items }
  },

  'api.ai.chat.conversation': async ({ pathParams }) => {
    requireAuth()
    const db = loadDb()
    const conversation = db.aiConversations.find(c => c.id === pathParams.conversationId)
    if (!conversation) throw new ApiError('NOT_FOUND', 'Conversation not found', 404)
    const messages = db.aiMessages.filter(m => m.conversationId === pathParams.conversationId)
    return { conversation, messages }
  },

  'api.ai.chat.send': async ({ body }) => {
    await wait(800)
    const userId = requireAuth()
    const { conversationId, text } = body as { conversationId?: string; text: string }
    return mutateDb(db => {
      let convo = conversationId ? db.aiConversations.find(c => c.id === conversationId) : null
      if (!convo) {
        convo = {
          id: 'conv_' + Date.now(),
          userId,
          title: text.slice(0, 30),
          preview: text,
          pinned: false,
          archived: false,
          messageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        db.aiConversations.unshift(convo)
      }
      const userMsg: AIMessage = { id: 'msg_' + Date.now(), conversationId: convo.id, role: 'user', text, createdAt: new Date().toISOString() }
      db.aiMessages.push(userMsg)
      const reply = aiReply(text)
      const aiMsg: AIMessage = { id: 'msg_' + (Date.now() + 1), conversationId: convo.id, role: 'assistant', text: reply, createdAt: new Date().toISOString() }
      db.aiMessages.push(aiMsg)
      convo.messageCount += 2
      convo.preview = reply
      convo.updatedAt = new Date().toISOString()
      return { conversation: convo, userMessage: userMsg, assistantMessage: aiMsg }
    })
  },

  // ---- AI · Settings ----
  'api.ai.settings.get': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return db.aiSettings[userId]
  },

  'api.ai.settings.update': async ({ body }) => {
    const userId = requireAuth()
    return mutateDb(db => {
      Object.assign(db.aiSettings[userId], body as Record<string, unknown>)
      return db.aiSettings[userId]
    })
  },

  // ---- AI · Tools ----
  'api.ai.tools.list': async () => {
    requireAuth()
    const db = loadDb()
    return { items: db.aiTools }
  },

  'api.ai.tools.update': async ({ body }) => {
    requireAuth()
    const update = body as { id: string; enabled?: boolean; pinThresholdUsd?: number | null }
    return mutateDb(db => {
      const t = db.aiTools.find(x => x.id === update.id)
      if (!t) throw new ApiError('NOT_FOUND', `Tool ${update.id} not found`, 404)
      if (update.enabled !== undefined) t.enabled = update.enabled
      if (update.pinThresholdUsd !== undefined) t.pinThresholdUsd = update.pinThresholdUsd
      return t
    })
  },

  // ---- AI · Memory ----
  'api.ai.memory.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.aiMemoryItems.filter(m => m.userId === userId) }
  },

  'api.ai.memory.delete': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const i = db.aiMemoryItems.findIndex(m => m.id === pathParams.itemId)
      if (i < 0) throw new ApiError('NOT_FOUND', 'Memory item not found', 404)
      db.aiMemoryItems.splice(i, 1)
      return { ok: true }
    })
  },

  'api.ai.memory.clear': async () => {
    const userId = requireAuth()
    return mutateDb(db => {
      db.aiMemoryItems = db.aiMemoryItems.filter(m => m.userId !== userId)
      return { ok: true }
    })
  },

  // ---- AI · Scheduled actions ----
  'api.ai.scheduled.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.aiScheduledActions.filter(a => a.userId === userId) }
  },

  'api.ai.scheduled.detail': async ({ pathParams }) => {
    const userId = requireAuth()
    const db = loadDb()
    const action = db.aiScheduledActions.find(a => a.id === pathParams.actionId && a.userId === userId)
    if (!action) throw new ApiError('NOT_FOUND', 'Action not found', 404)
    return action
  },

  'api.ai.scheduled.cancel': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const a = db.aiScheduledActions.find(x => x.id === pathParams.actionId)
      if (!a) throw new ApiError('NOT_FOUND', 'Action not found', 404)
      a.status = 'cancelled'
      return a
    })
  },

  // ---- AI · Share ----
  'api.ai.share.create': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const existing = db.aiShares.find(s => s.conversationId === pathParams.conversationId)
      if (existing) return existing
      const share = {
        id: 'share_' + Date.now(),
        conversationId: pathParams.conversationId,
        isPublic: true,
        expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
        createdAt: new Date().toISOString(),
        showAuthorName: false,
      }
      db.aiShares.push(share)
      return share
    })
  },

  'api.ai.share.get': async ({ pathParams }) => {
    const db = loadDb()
    const share = db.aiShares.find(s => s.id === pathParams.shareId)
    if (!share) throw new ApiError('NOT_FOUND', 'Share not found', 404)
    if (share.expiresAt && new Date(share.expiresAt).getTime() < Date.now()) throw new ApiError('EXPIRED', 'Share link expired', 410)
    const conversation = db.aiConversations.find(c => c.id === share.conversationId)
    if (!conversation) throw new ApiError('NOT_FOUND', 'Conversation not found', 404)
    const messages = db.aiMessages.filter(m => m.conversationId === conversation.id)
    return { share, conversation, messages }
  },

  'api.ai.share.revoke': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const i = db.aiShares.findIndex(s => s.conversationId === pathParams.conversationId)
      if (i < 0) throw new ApiError('NOT_FOUND', 'Share not found', 404)
      db.aiShares.splice(i, 1)
      return { ok: true }
    })
  },

  // ---- AI · Notifications ----
  'api.ai.notifications': async () => {
    requireAuth()
    return { items: [
      { id: 'an_001', type: 'check', tone: 'g',  title: 'Order filled',         body: 'Bought 0.05 ETH @ $3,801 (BTC dipped to $64,890)', when: '2m ago' },
      { id: 'an_002', type: 'bell',  tone: 'gd', title: 'Price alert',          body: 'SOL crossed $200 — your alert',                    when: '15m ago' },
      { id: 'an_003', type: 'zap',   tone: 'g',  title: 'Stake auto-compound',  body: '+0.012 stSOL added to position',                   when: '1h ago' },
      { id: 'an_004', type: 'x',     tone: 'r',  title: 'Action failed',         body: 'BTC limit at $70k cancelled — insufficient margin',when: '3h ago' },
      { id: 'an_005', type: 'trend-up', tone: 'g', title: 'DCA executed',       body: '$10 BTC bought at $67,121',                        when: '12h ago' },
      { id: 'an_006', type: 'msg',   tone: 'gd', title: 'Memory updated',       body: 'Your new tax jurisdiction was saved',              when: '1d ago' },
      { id: 'an_007', type: 'handshake', tone: 'g', title: 'P2P offer accepted', body: 'Order with @marcus_p — release escrow',            when: '1d ago' },
    ] }
  },

  // ---- P2P ----
  'api.p2p.offers.list': async ({ query }) => {
    const db = loadDb()
    let items = db.p2pOffers
    if (query.asset) items = items.filter(o => o.asset === query.asset)
    if (query.fiat) items = items.filter(o => o.fiatCurrency === query.fiat)
    return { items }
  },

  'api.p2p.offer.get': async ({ pathParams }) => {
    const db = loadDb()
    const offer = db.p2pOffers.find(o => o.id === pathParams.offerId)
    if (!offer) throw new ApiError('NOT_FOUND', 'Offer not found', 404)
    return offer
  },

  'api.p2p.order.create': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { offerId, fiatAmount } = body as { offerId: string; fiatAmount: string }
    return mutateDb(db => {
      const offer = db.p2pOffers.find(o => o.id === offerId)
      if (!offer) throw new ApiError('NOT_FOUND', 'Offer not found', 404)
      const cryptoAmount = (parseFloat(fiatAmount) / parseFloat(offer.price)).toFixed(2)
      const order: P2POrder = {
        id: 'po_' + Date.now(),
        userId,
        offerId,
        side: 'buy',
        cryptoAsset: offer.asset,
        cryptoAmount,
        fiatAmount,
        fiatCurrency: offer.fiatCurrency,
        rate: offer.price,
        paymentMethod: offer.paymentMethods[0],
        bankName: offer.paymentMethods[0] === 'Bank Transfer' ? 'Access Bank' : undefined,
        accountNumber: offer.paymentMethods[0] === 'Bank Transfer' ? '3038492854' : undefined,
        accountName: offer.paymentMethods[0] === 'Bank Transfer' ? `${offer.sellerName} (real)` : undefined,
        reference: '#x' + Math.random().toString(36).slice(2, 10),
        counterpartyName: offer.sellerName,
        counterpartyInitial: offer.sellerInitial,
        status: 'pending-payment',
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        timeline: [{ icon: 'check', title: 'Order placed', detail: new Date().toLocaleTimeString().slice(0, 5), tone: 'g' }],
        createdAt: new Date().toISOString(),
      }
      db.p2pOrders.unshift(order)
      return order
    })
  },

  'api.p2p.order.get': async ({ pathParams }) => {
    const userId = requireAuth()
    const db = loadDb()
    const order = db.p2pOrders.find(o => o.id === pathParams.orderId && o.userId === userId)
    if (!order) throw new ApiError('NOT_FOUND', 'Order not found', 404)
    return order
  },

  'api.p2p.order.markpaid': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const o = db.p2pOrders.find(x => x.id === pathParams.orderId)
      if (!o) throw new ApiError('NOT_FOUND', 'Order not found', 404)
      if (o.status !== 'pending-payment') throw new ApiError('INVALID_STATE', 'Cannot mark paid in current state')
      o.status = 'paid'
      o.timeline.push({ icon: 'check', title: 'Marked paid', detail: new Date().toLocaleTimeString().slice(0, 5), tone: 'gd' })
      return o
    })
  },

  'api.p2p.order.dispute': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const o = db.p2pOrders.find(x => x.id === pathParams.orderId)
      if (!o) throw new ApiError('NOT_FOUND', 'Order not found', 404)
      o.status = 'disputed'
      return o
    })
  },

  'api.p2p.chat.send': async ({ pathParams, body }) => {
    const userId = requireAuth()
    const { text } = body as { text: string }
    return mutateDb(db => {
      const msg = { id: 'pm_' + Date.now(), orderId: pathParams.orderId, senderId: userId, senderName: 'You', text, createdAt: new Date().toISOString() }
      db.p2pMessages.push(msg)
      return msg
    })
  },

  'api.p2p.chat.list': async ({ pathParams }) => {
    requireAuth()
    const db = loadDb()
    return { items: db.p2pMessages.filter(m => m.orderId === pathParams.orderId) }
  },

  'api.p2p.payments.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.p2pPaymentMethods.filter(m => m.userId === userId) }
  },

  // ---- Card ----
  'api.card.get': async () => {
    const userId = requireAuth()
    const db = loadDb()
    const card = db.cards[userId]
    if (!card) throw new ApiError('NO_CARD', 'No card on this account', 404)
    return card
  },

  'api.card.apply': async () => {
    await wait(500)
    const userId = requireAuth()
    return mutateDb(db => {
      if (db.cards[userId]) throw new ApiError('CARD_EXISTS', 'You already have a card', 400)
      const card = {
        id: 'card_' + Date.now(),
        userId,
        cardLast4: String(Math.floor(1000 + Math.random() * 9000)),
        cardholderName: 'JOSEPH OBASI',
        status: 'awaiting-kyc' as const,
        type: 'virtual' as const,
        network: 'visa' as const,
        balance: '0',
        balanceCurrency: 'USD',
        dailySpendLimit: '500',
        monthlySpendLimit: '1000',
        spentToday: '0',
        spentMonth: '0',
        contactlessEnabled: true,
        onlineEnabled: true,
        internationalEnabled: false,
        allowedRegions: ['🇳🇬 Nigeria'],
        cashbackPct: '3',
        cashbackEarned: '0',
        txnsThisMonth: 0,
      }
      db.cards[userId] = card
      return card
    })
  },

  'api.card.topup': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { amount, fromAsset } = body as { amount: string; fromAsset: string }
    return mutateDb(db => {
      const card = db.cards[userId]
      if (!card) throw new ApiError('NO_CARD', 'No card', 404)
      const bal = db.balances.find(b => b.userId === userId && b.asset === fromAsset)
      if (!bal || parseFloat(bal.amount) < parseFloat(amount)) throw new ApiError('INSUFFICIENT_BALANCE', 'Not enough balance')
      bal.amount = (parseFloat(bal.amount) - parseFloat(amount)).toFixed(8)
      const credit = parseFloat(amount) - 0.5  // 0.5 USDC fee
      card.balance = (parseFloat(card.balance) + credit).toFixed(2)
      const tx = {
        id: 'tx_' + Date.now(),
        userId,
        type: 'card-topup' as const,
        asset: fromAsset,
        amount,
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
      }
      db.transactions.unshift(tx)
      return { card, credit: credit.toFixed(2) }
    })
  },

  'api.card.freeze': async ({ body }) => {
    requireAuth()
    const userId = (loadDb()).authUserId!
    const { freeze } = body as { freeze: boolean }
    return mutateDb(db => {
      const c = db.cards[userId]
      if (!c) throw new ApiError('NO_CARD', 'No card', 404)
      c.status = freeze ? 'frozen' : 'active'
      return c
    })
  },

  'api.card.settings.update': async ({ body }) => {
    const userId = requireAuth()
    return mutateDb(db => {
      const c = db.cards[userId]
      if (!c) throw new ApiError('NO_CARD', 'No card', 404)
      Object.assign(c, body as Record<string, unknown>)
      return c
    })
  },

  'api.card.transactions': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.cardTransactions.filter(t => t.userId === userId) }
  },

  // ---- NFT ----
  'api.nft.gallery': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.nfts.filter(n => n.ownerId === userId) }
  },

  'api.nft.market': async () => {
    const db = loadDb()
    return { items: db.nfts.filter(n => n.ownerId === null) }
  },

  'api.nft.detail': async ({ pathParams }) => {
    const db = loadDb()
    const nft = db.nfts.find(n => n.id === pathParams.nftId)
    if (!nft) throw new ApiError('NOT_FOUND', 'NFT not found', 404)
    return nft
  },

  'api.nft.send': async ({ pathParams, body }) => {
    await wait(400)
    requireAuth()
    const { recipient } = body as { recipient: string }
    return mutateDb(db => {
      const nft = db.nfts.find(n => n.id === pathParams.nftId)
      if (!nft) throw new ApiError('NOT_FOUND', 'NFT not found', 404)
      nft.ownerId = null
      return { ok: true, recipient, nft }
    })
  },

  // ---- Auth (phase 4 fillers) ----
  'api.auth.complete-profile': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    return mutateDb(db => {
      const u = db.users[userId]
      if (!u) throw new ApiError('NOT_FOUND', 'User not found', 404)
      Object.assign(u, body as Record<string, unknown>)
      return u
    })
  },

  'api.auth.verify-2fa': async ({ body }) => {
    await wait(400)
    const { code } = body as { code: string }
    if (!code || code.length !== 6) throw new ApiError('INVALID_CODE', 'Enter the 6-digit code')
    return { verified: true }
  },

  'api.auth.forgot-password': async ({ body }) => {
    await wait(400)
    const { email } = body as { email: string }
    if (!email) throw new ApiError('INVALID', 'Email required')
    return { sent: true, email }
  },

  'api.auth.reset-password': async ({ body }) => {
    await wait(400)
    const { password } = body as { password: string }
    if (!password || password.length < 8) throw new ApiError('INVALID', 'Password too short')
    return { reset: true }
  },

  // ---- KYC ----
  'api.user.kyc.status': async () => {
    const userId = requireAuth()
    const db = loadDb()
    const sub = db.kycSubmissions[userId]
    if (!sub) throw new ApiError('NOT_FOUND', 'No KYC submission', 404)
    return sub
  },

  'api.user.kyc.start': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { level } = body as { level: number }
    return mutateDb(db => {
      const cur = db.kycSubmissions[userId]
      const sub = {
        userId,
        level: (level ?? 1) as 1 | 2 | 3,
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        estimatedCompleteAt: new Date(Date.now() + 12 * 60_000).toISOString(),
        steps: cur?.steps ?? [
          { key: 'personal', label: 'Personal info',     done: true },
          { key: 'id',       label: 'Government ID',     done: true },
          { key: 'selfie',   label: 'Selfie · Liveness', done: true },
          { key: 'address',  label: 'Address proof',     done: false },
        ],
      }
      db.kycSubmissions[userId] = sub
      return sub
    })
  },

  // ---- User profile update ----
  'api.user.profile.update': async ({ body }) => {
    const userId = requireAuth()
    return mutateDb(db => {
      Object.assign(db.users[userId], body as Record<string, unknown>)
      return db.users[userId]
    })
  },

  // ---- Security ----
  'api.security.summary': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return db.security[userId]
  },

  'api.security.2fa.enable': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { code } = body as { code: string }
    if (!code || code.length !== 6) throw new ApiError('INVALID_CODE', 'Enter the 6-digit code')
    return mutateDb(db => {
      const s = db.security[userId]
      s.twoFAEnabled = true
      return s
    })
  },

  'api.security.2fa.disable': async () => {
    const userId = requireAuth()
    return mutateDb(db => {
      const s = db.security[userId]
      s.twoFAEnabled = false
      return s
    })
  },

  'api.security.backup-codes': async () => {
    await wait(300)
    const userId = requireAuth()
    return mutateDb(db => {
      const s = db.security[userId]
      s.backupCodesGenerated = 10
      s.backupCodesUnused = 10
      // Return mock codes
      return {
        codes: ['8x4f-29ab', '3jkc-99pl', 'm2n8-gv7e', '7q4z-2ta5', 'b9k1-44rd', 'xy77-en90', 'wp3l-6q12', '5uat-h33b', 'c9x8-bbr1', '4def-z881'],
        usedCount: 0,
      }
    })
  },

  'api.security.password.change': async ({ body }) => {
    await wait(400)
    requireAuth()
    const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string }
    if (!currentPassword) throw new ApiError('INVALID', 'Current password required')
    if (!newPassword || newPassword.length < 12) throw new ApiError('WEAK', 'New password must be 12+ chars')
    return { changed: true }
  },

  'api.security.pin.change': async ({ body }) => {
    await wait(400)
    requireAuth()
    const { currentPin, newPin } = body as { currentPin: string; newPin: string }
    if (!currentPin || currentPin.length !== 6) throw new ApiError('INVALID_PIN', 'Wrong PIN')
    if (!newPin || newPin.length !== 6) throw new ApiError('INVALID_PIN', 'New PIN must be 6 digits')
    return { changed: true }
  },

  'api.security.sessions.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return {
      active: db.sessions.filter(s => s.userId === userId),
      history: db.loginHistory.filter(s => s.userId === userId),
    }
  },

  'api.security.sessions.revoke': async ({ pathParams }) => {
    const userId = requireAuth()
    return mutateDb(db => {
      const s = db.sessions.find(x => x.id === pathParams.sessionId && x.userId === userId)
      if (!s) throw new ApiError('NOT_FOUND', 'Session not found', 404)
      if (s.isCurrent) throw new ApiError('CANNOT_REVOKE_CURRENT', 'Cannot revoke current session')
      db.sessions = db.sessions.filter(x => x.id !== s.id)
      return { ok: true }
    })
  },

  // ---- Settings · Notifications ----
  'api.settings.notifications.get': async () => {
    requireAuth()
    return loadDb().prefs.notifications
  },

  'api.settings.notifications.update': async ({ body }) => {
    requireAuth()
    return mutateDb(db => {
      Object.assign(db.prefs.notifications, body as Record<string, boolean>)
      return db.prefs.notifications
    })
  },

  // ---- Settings · Price alerts ----
  'api.settings.alerts.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.priceAlerts.filter(a => a.userId === userId) }
  },

  'api.settings.alerts.create': async ({ body }) => {
    await wait(200)
    const userId = requireAuth()
    return mutateDb(db => {
      const alert = { id: 'al_' + Date.now(), userId, ...(body as Omit<PriceAlert, 'id' | 'userId' | 'createdAt'>), createdAt: new Date().toISOString() }
      db.priceAlerts.push(alert)
      return alert
    })
  },

  'api.settings.alerts.update': async ({ pathParams, body }) => {
    requireAuth()
    return mutateDb(db => {
      const a = db.priceAlerts.find(x => x.id === pathParams.alertId)
      if (!a) throw new ApiError('NOT_FOUND', 'Alert not found', 404)
      Object.assign(a, body as Record<string, unknown>)
      return a
    })
  },

  'api.settings.alerts.delete': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const i = db.priceAlerts.findIndex(x => x.id === pathParams.alertId)
      if (i < 0) throw new ApiError('NOT_FOUND', 'Alert not found', 404)
      db.priceAlerts.splice(i, 1)
      return { ok: true }
    })
  },

  // ---- Settings · API keys ----
  'api.settings.api-keys.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.apiKeys.filter(k => k.userId === userId) }
  },

  'api.settings.api-keys.create': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const { name, scopes } = body as { name: string; scopes: APIKey['scopes'] }
    return mutateDb(db => {
      const id = 'ak_' + Date.now()
      const key = {
        id,
        userId,
        name,
        publicKey: 'pk_test_' + Math.random().toString(36).slice(2, 22),
        secretKeyPreview: 'sk_test_' + Math.random().toString(36).slice(2, 8) + '...' + Math.random().toString(36).slice(2, 5),
        scopes,
        ipAllowlist: [],
        callsLast30d: 0,
        callsQuotaMonthly: 1_000_000,
        expiresAt: null,
        status: 'test' as const,
        createdAt: new Date().toISOString(),
      }
      db.apiKeys.push(key)
      return key
    })
  },

  'api.settings.api-keys.delete': async ({ pathParams }) => {
    requireAuth()
    return mutateDb(db => {
      const i = db.apiKeys.findIndex(k => k.id === pathParams.keyId)
      if (i < 0) throw new ApiError('NOT_FOUND', 'API key not found', 404)
      db.apiKeys.splice(i, 1)
      return { ok: true }
    })
  },

  // ---- Engagement ----
  'api.rewards.summary': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return db.rewards[userId]
  },

  'api.rewards.badges': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.badges.filter(b => b.userId === userId || b.userId === null) }
  },

  'api.rewards.tiers': async () => ({
    items: [
      { name: 'Bronze',   emoji: '🥉', range: '0-500 XP',        perks: '0.10% trading fee · Standard withdrawals' },
      { name: 'Silver',   emoji: '🥈', range: '500-2,500 XP',    perks: '0.08% fee · Priority support · 1.5% card cashback' },
      { name: 'Gold',     emoji: '🥇', range: '2,500-10K XP',     perks: '0.06% fee · No deposit fees · 2% cashback' },
      { name: 'Platinum', emoji: '💎', range: '10K-50K XP',       perks: '0.04% fee · OTC desk access · 2.5% cashback' },
      { name: 'Diamond',  emoji: '👑', range: '50K+ XP',          perks: '0.02% fee · Concierge · 3% cashback · NFT airdrops' },
    ],
  }),

  'api.rewards.claim-daily': async () => {
    requireAuth()
    return mutateDb(db => {
      const u = Object.keys(db.rewards)[0]
      db.rewards[u].xp += 5
      return { xp: 5, total: db.rewards[u].xp }
    })
  },

  'api.referral.summary': async () => {
    const userId = requireAuth()
    const db = loadDb()
    const items = db.referrals.filter(r => r.inviter === userId)
    const earned = items.filter(r => r.status === 'verified').length * 20
    return {
      code: 'JOSEPH-2026',
      referredCount: items.filter(r => r.status === 'verified').length,
      earnedUsd: earned,
      earnedXp: items.filter(r => r.status === 'verified').length * 100,
      items,
    }
  },

  'api.notifications.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.notifications.filter(n => n.userId === userId) }
  },

  'api.notifications.read': async () => {
    const userId = requireAuth()
    return mutateDb(db => {
      db.notifications.forEach(n => { if (n.userId === userId) n.read = true })
      return { ok: true }
    })
  },

  'api.announcements.list': async () => {
    const db = loadDb()
    return { items: db.announcements }
  },

  // ---- Support ----
  'api.support.articles': async ({ query }) => {
    const db = loadDb()
    let items = db.supportArticles
    if (query.category) items = items.filter(a => a.category === query.category)
    if (query.q) items = items.filter(a => a.title.toLowerCase().includes(String(query.q).toLowerCase()))
    return { items }
  },

  'api.support.article': async ({ pathParams }) => {
    const db = loadDb()
    const a = db.supportArticles.find(x => x.slug === pathParams.slug)
    if (!a) throw new ApiError('NOT_FOUND', 'Article not found', 404)
    return a
  },

  'api.support.tickets.list': async () => {
    const userId = requireAuth()
    const db = loadDb()
    return { items: db.supportTickets.filter(t => t.userId === userId) }
  },

  'api.support.tickets.create': async ({ body }) => {
    await wait(400)
    const userId = requireAuth()
    const b = body as { subject: string; category: string; description: string; priority?: string }
    return mutateDb(db => {
      const ticket = {
        id: 'TKT-' + Math.floor(Math.random() * 9000 + 1000),
        userId,
        subject: b.subject,
        category: b.category,
        status: 'open' as const,
        team: 'Support',
        updatedAt: new Date().toISOString(),
        unread: false,
      }
      db.supportTickets.unshift(ticket)
      db.supportTicketMessages.push({ id: 'tm_' + Date.now(), ticketId: ticket.id, authorRole: 'user', authorName: 'You', body: b.description, createdAt: new Date().toISOString() })
      return ticket
    })
  },

  'api.support.tickets.detail': async ({ pathParams }) => {
    const userId = requireAuth()
    const db = loadDb()
    const ticket = db.supportTickets.find(t => t.id === pathParams.ticketId && t.userId === userId)
    if (!ticket) throw new ApiError('NOT_FOUND', 'Ticket not found', 404)
    const messages = db.supportTicketMessages.filter(m => m.ticketId === ticket.id)
    return { ticket, messages }
  },

  'api.support.tickets.reply': async ({ pathParams, body }) => {
    requireAuth()
    const { body: text } = body as { body: string }
    return mutateDb(db => {
      const msg = { id: 'tm_' + Date.now(), ticketId: pathParams.ticketId, authorRole: 'user' as const, authorName: 'You', body: text, createdAt: new Date().toISOString() }
      db.supportTicketMessages.push(msg)
      const t = db.supportTickets.find(x => x.id === pathParams.ticketId)
      if (t) t.updatedAt = new Date().toISOString()
      return msg
    })
  },

  // ---- Notifications ----

  // System
  'api.system.status': async () => ({
    overall: 'operational',
    services: [
      { id: 'api',     name: 'Trading API',          status: 'operational', uptime: '100%' },
      { id: 'wallet',  name: 'Wallet · Deposits',    status: 'operational', uptime: '99.98%' },
      { id: 'wd',      name: 'Wallet · Withdrawals', status: 'operational', uptime: '99.96%' },
      { id: 'p2p',     name: 'P2P',                  status: 'operational', uptime: '100%' },
      { id: 'ai',      name: 'AI Assistant',         status: 'degraded',    uptime: '98.20%' },
    ],
  }),

  'api.system.version': async () => ({
    version: '2.1.0',
    build: '4821',
    minSupportedVersion: '2.0.0',
    forceUpdate: false,
  }),
}

// ---------- Public dispatch ----------

export async function dispatchMock(
  endpointId: EndpointId,
  ctx: Ctx,
): Promise<unknown> {
  const handler = handlers[endpointId]
  if (!handler) {
    throw new ApiError('NOT_IMPLEMENTED', `Mock handler for ${endpointId} is pending. Add it in src/mock/handlers.ts.`, 501)
  }
  return handler(ctx)
}

export { ApiError }
