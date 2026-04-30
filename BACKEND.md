# CrymadX Mobile App — Backend Handoff

> **Audience:** the backend engineer wiring up the real APIs.
>
> **Promise:** if you implement every endpoint in `src/api/endpoints.ts` with the shapes documented here, the mobile app boots green end-to-end with `VITE_USE_MOCK=false`. Mock layer becomes deletable.
>
> Read this top-to-bottom once. Then bookmark §6 (Screen wiring guide) and §7 (Hardcoded data atlas) — those are your daily references.

---

## Table of contents

1. [TL;DR — your job in 5 bullets](#1-tldr)
2. [Quick start: flip from mock to real](#2-quick-start)
3. [Conventions](#3-conventions)
4. [Architecture & where things live](#4-architecture)
5. [Endpoint inventory (130 endpoints)](#5-endpoint-inventory)
6. [Screen-by-screen wiring guide (108 screens)](#6-screen-wiring)
7. [Hardcoded data atlas — what's outside the DB](#7-hardcoded-data)
8. [Routing & navigation map](#8-routing-map)
9. [Open questions / decisions for product](#9-open-questions)
10. [Glossary & references](#10-glossary)

---

## 1. TL;DR

1. **130 endpoints** to implement. All declared in [`src/api/endpoints.ts`](src/api/endpoints.ts) with stable IDs (`api.*`).
2. **Mock layer is the spec.** [`src/mock/handlers.ts`](src/mock/handlers.ts) is a working reference implementation — match the response shapes exactly.
3. **24 entity types** — defined in [`src/mock/db.ts`](src/mock/db.ts) with sample seed data you can use as fixture.
4. **80+ keyed routes** in [`src/routes.ts`](src/routes.ts). The app navigates by ID, not by URL. URLs are an implementation detail your endpoints don't need to know about.
5. **Switch to live backend by setting two env vars** (`VITE_USE_MOCK=false`, `VITE_API_BASE_URL=…`). No code changes in screens.

---

## 2. Quick start

```bash
# 1. Stand up your server at any base URL, e.g.
https://api.crymadx.io/v2

# 2. In the mobile app .env (copy .env.example):
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api.crymadx.io/v2

# 3. Restart npm run dev
# 4. The app now hits your server directly. Mock layer is dead code; delete src/mock/ when comfortable.
```

The single fetcher is [`src/api/client.ts`](src/api/client.ts). It already:

- Adds `Authorization: Bearer <token>` from `localStorage`
- Resolves path params (`:asset` etc.)
- Builds query strings
- Parses JSON responses
- Throws `ApiError { code, message, status }` on non-2xx

You don't need to touch the client. Just match the shapes.

### Auth header convention (recommended, matches existing CrymadX KYC API)

If you want HMAC-signed requests (matches `backend.crymadx.io` style, see `api-reference.md`):

```
X-CRM-APIKEY      crm_pk_live_…
X-CRM-TIMESTAMP   <unix ms, ±5 min>
X-CRM-SIGNATURE   hex(HMAC-SHA256(secret, ts + METHOD + path + rawBody))
Authorization     Bearer <jwt>           # for end-user calls
```

The mobile app doesn't sign — it sends `Authorization: Bearer <token>`. If you want HMAC for server-to-server, the BFF/proxy in front does the signing; the mobile app just gets a JWT. **Don't push HMAC requirements into the mobile client.**

---

## 3. Conventions

### Auth

- After `api.auth.login`, the response includes `accessToken` (JWT). The app stores it in `localStorage` (`crymadx.auth.token`) and sends `Authorization: Bearer <token>` on subsequent requests.
- Token expiry: app calls `api.auth.refresh` when it gets `401`.
- **Logout**: clear server-side session; the app clears local state regardless.

### Money values

- **Always strings**, not floats. E.g. `"amount": "0.18700000"`. Avoids precision loss.
- Use 8 decimal places for crypto, 2 for fiat.
- USD values for crypto balances are also strings: `"usdValue": "12541.32"`.

### Dates

- ISO 8601 UTC with milliseconds. `"createdAt": "2026-04-28T14:22:08.392Z"`.
- The mobile app parses with `new Date(iso)` — must be parseable by JS.

### Pagination

- Cursor-based. Query: `?limit=20&cursor=<opaque>`.
- Response: `{ items: T[], nextCursor: string | null }`.
- Most list endpoints in the mock currently return everything in one shot. Add cursor support when real volumes hit.

### IDs

- Opaque strings: UUID, ULID, or your choice. Mobile app does not parse them.
- Use prefixes for human readability: `usr_001`, `tx_001`, `ord_001`, `ak_001` (API keys), etc.
- **Stability:** once an ID is assigned, it must never change.

### Error shape

All errors follow:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Not enough BTC available"
  }
}
```

Always return appropriate HTTP status: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `429` rate limit, `500` server, `503` upstream.

### Idempotency

For state-changing operations (withdrawals, swaps, orders, fiat purchases, ticket creation), accept `Idempotency-Key` header. Mock layer doesn't implement this yet — your job. Return same response for duplicate keys within 24h.

### Common error codes used by the app

| Code | When | UI behavior |
|---|---|---|
| `UNAUTHENTICATED` | No / expired token | Redirect to `/login` |
| `INVALID_CREDENTIALS` | Wrong email/password | Inline error on Login screen |
| `INVALID_CODE` | Bad 6-digit code | Inline error on 2FA / VerifyEmail |
| `INSUFFICIENT_BALANCE` | Withdraw/swap > balance | Inline error on Withdraw/Convert |
| `NOT_FOUND` | Resource doesn't exist | Empty/error state in screen |
| `CARD_EXISTS` | User already has a card | Card hub redirect |
| `NO_CARD` | User has no card | Auto-redirect to Card Onboarding |
| `INVALID_PIN` | Wrong PIN | Inline error on Confirm screens |
| `INVALID_STATE` | Order not in cancellable state, etc. | Toast/error |
| `WEAK` | Password too weak | Inline error |
| `EXPIRED` | Share link expired | Empty state on shared viewer |

---

## 4. Architecture

### Three keyed registries

| File | Purpose |
|---|---|
| [`src/routes.ts`](src/routes.ts) | Every screen path with stable ID. Use `routeFor('route.wallet.deposit', { asset: 'BTC' })` not raw URLs. |
| [`src/api/endpoints.ts`](src/api/endpoints.ts) | Every API call: ID, method, path, TS types. |
| [`src/mock/db.ts`](src/mock/db.ts) | Mock fake DB. 24 entity types. localStorage-backed. |

### Folders

```
src/
├── api/
│   ├── endpoints.ts       # endpoint registry
│   ├── client.ts          # fetcher (mock/real toggle)
│   └── hooks.ts           # useEndpoint(), useEndpointMutation()
├── mock/
│   ├── db.ts              # types + seed data + load/save/reset
│   └── handlers.ts        # in-memory implementation of every endpoint
├── stores/
│   ├── auth.ts            # zustand: user, token, signIn/signOut
│   └── theme.ts           # zustand: theme dark/light
├── components/            # PhoneShell, BottomNav, Icon, AIVoiceOrb, CardFace
├── screens/
│   ├── auth/              # Splash, Login, Register, etc.
│   ├── tabs/              # Home, Markets, AIChat, Wallet, Profile
│   ├── wallet/            # Deposit, Withdraw, Convert, ...
│   ├── trading/
│   ├── earn/
│   ├── p2p/
│   ├── card/
│   ├── nft/
│   ├── ai/
│   ├── security/
│   ├── kyc/
│   ├── settings/
│   ├── engage/
│   ├── support/
│   ├── legal/
│   ├── misc/
│   └── system/
├── routes.ts              # ROUTES registry
└── styles/bold-waves.css  # global styles
```

### Mock layer is the spec

If you encounter a question of "what should this endpoint return?" — read the corresponding handler in [`src/mock/handlers.ts`](src/mock/handlers.ts). It is the working reference. Match shapes exactly, including:

- Field names (camelCase)
- Field types (string vs number — money is **always** string)
- Optional fields (which fields can be `null` or absent)
- Nested shapes (`{ items: [...], nextCursor }` for paginated)

### State persistence (mock)

Mock DB is persisted to `localStorage` under `crymadx.mock.db.v4`. To wipe and reseed: open `/debug` in the app and tap "Reset Demo Data", or run `localStorage.clear()` in DevTools.

---

## 5. Endpoint inventory

> Each entry below: **ID**, method, path, request shape, response shape, side effects, **screens that consume it**.
>
> Where shape is `User`, `Balance`, `Transaction`, etc. — see types in `src/api/endpoints.ts` and `src/mock/db.ts`.

### 5.1 Auth (10)

#### `api.auth.register` · `POST /auth/register`
**Body:** `{ firstName: string, lastName: string, email: string, password: string, referral?: string }`
**Response:** `{ userId: string, email, firstName, lastName, requiresEmailVerification: true }`
**Side effects:** Creates pending user; sends verification email.
**Used by:** Register screen → on submit, navigates to VerifyEmail with `email` in route state.

#### `api.auth.verify-email` · `POST /auth/verify-email`
**Body:** `{ code: string, email: string }`
**Response:** `{ verified: true }`
**Errors:** `INVALID_CODE` (returns 400; UI shows inline error).
**Used by:** VerifyEmail screen → on success, navigates to CompleteProfile.

#### `api.auth.resend-code` · `POST /auth/resend-code`
**Body:** `{ email: string }`
**Response:** `{ sent: true }`
**Used by:** VerifyEmail screen "Resend" link (rate-limited, 60s cooldown shown in UI).

#### `api.auth.complete-profile` · `POST /auth/complete-profile`
**Body:** `{ firstName, lastName, country, phone, referral? }`
**Response:** `User`
**Used by:** CompleteProfile screen → navigates to Home on success.

#### `api.auth.login` · `POST /auth/login`
**Body:** `{ email: string, password: string }`
**Response:** `{ accessToken, refreshToken, expiresAt, user: User, requires2FA: boolean }`
**Side effects:** Issues JWT. App stores `accessToken` in `localStorage` and `user` in zustand.
**If `requires2FA: true`:** mobile app should redirect to `/login/2fa` with a temporary `loginToken`. Currently mock returns `false` always — wire that branch on real backend.
**Used by:** Login screen.

#### `api.auth.verify-2fa` · `POST /auth/verify-2fa`
**Body:** `{ code: string, loginToken?: string }`
**Response:** `{ verified: true, accessToken, refreshToken, expiresAt, user }` (if `loginToken` was passed)
**Used by:** Login2FA screen.

#### `api.auth.forgot-password` · `POST /auth/forgot-password`
**Body:** `{ email: string }`
**Response:** `{ sent: true }`
**Side effects:** Email reset link with one-time token.
**Used by:** ForgotPassword screen.

#### `api.auth.reset-password` · `POST /auth/reset-password`
**Body:** `{ password: string, resetToken: string }`
**Response:** `{ reset: true }`
**Used by:** ResetPassword screen (linked from email).

#### `api.auth.refresh` · `POST /auth/refresh`
**Body:** `{ refreshToken }`
**Response:** `{ accessToken, refreshToken, expiresAt }`
**Used by:** API client (auto-retries on 401).

#### `api.auth.logout` · `POST /auth/logout`
**Body:** `{}`
**Response:** `{ success: true }`
**Side effects:** Invalidate refresh token server-side.
**Used by:** Profile screen "Sign Out" button.

---

### 5.2 User (4)

#### `api.user.profile.get` · `GET /user/profile`
**Response:** `User`
**Used by:** Home, Profile, Markets (greeting), every screen that needs user info indirectly via auth store.

#### `api.user.profile.update` · `PATCH /user/profile`
**Body:** `Partial<User>` (firstName, lastName, country, phone, avatarUrl)
**Response:** `User`
**Used by:** CompleteProfile (initial setup), Profile screen "Edit" button (TODO — not yet wired in v1).

#### `api.user.kyc.status` · `GET /user/kyc`
**Response:** `KYCSubmission` (level, status, submittedAt, reviewedAt, steps[])
**Used by:** KYCStatus, KYCPending screens.

#### `api.user.kyc.start` · `POST /user/kyc/start`
**Body:** `{ level: 1 | 2 | 3 }`
**Response:** `KYCSubmission` (with status='pending', estimatedCompleteAt)
**Side effects:** Creates a Gokuvision session (or your provider). Returns the verification URL — see §7 KYC for how the embedded webview is supposed to work.
**Used by:** KYCFlow → KYCPending after submission.

---

### 5.3 Wallet (10)

#### `api.wallet.balances.list` · `GET /wallet/balances`
**Response:** `{ total: string, change24h: string, changeAbs: string, items: Balance[] }`
**Side effects:** None.
**Notes:** `total` is computed server-side (sum of `usdValue` across all assets). `change24h` is "+X.XX" string.
**Used by:** Home, Wallet, Convert (for from-asset balance), Withdraw (for available), CardTopUp (for source assets), AssetDetail.

#### `api.wallet.balance.get` · `GET /wallet/balances/:asset`
**Response:** `Balance`
**Used by:** AssetDetail.

#### `api.wallet.networks.list` · `GET /wallet/networks/:asset`
**Response:** `{ networks: Array<{ id, name, description, recommended? }> }`
**Notes:** `id` examples: `TRC20`, `ERC20`, `BEP20`, `Bitcoin`, `Solana`, `Polygon`, `Base`, `Arbitrum`. **The mock has these hardcoded — replace with your supported network list.** Recommended network per asset is hinted via `recommended: true`.
**Used by:** DepositPick / Deposit screens for network switcher.

#### `api.wallet.deposit.address` · `GET /wallet/deposit/:asset/:network`
**Response:** `{ asset, network, address, qrData, minDeposit, confirmations, eta }`
**Notes:** `qrData` is the raw string to encode into the QR. For BTC this is the address; for some chains it might be a URI like `bitcoin:bc1q…?amount=…`. Mobile app renders QR locally (placeholder visual right now — see §7 QR Generation).
**Used by:** Deposit screen.

#### `api.wallet.withdraw.fee` · `GET /wallet/withdraw/fee?asset=BTC`
**Response:** `{ asset, fee: string, feeUsd: string }`
**Used by:** Withdraw screen (live fee display as user changes asset).

#### `api.wallet.withdraw.create` · `POST /wallet/withdraw`
**Body:** `{ asset, network, address, amount, fee, pin: string }`
**Response:** `Transaction` (status='pending')
**Side effects:** Debit balance immediately (incl. fee); enqueue on-chain broadcast; later update tx to `completed` with `txHash`.
**Errors:** `INVALID_PIN`, `INSUFFICIENT_BALANCE`, `INVALID_ADDRESS`.
**Used by:** WithdrawConfirm screen.

#### `api.wallet.convert.quote` · `POST /wallet/convert/quote`
**Body:** `{ fromAsset, toAsset, fromAmount: string }`
**Response:** `{ quoteId, fromAsset, toAsset, fromAmount, toAmount, rate, feeUsdt, slippage, validForSec, expiresAt }`
**Notes:** Quote expires in `validForSec` (e.g. 14). Mobile app shows a countdown and disables Confirm button when expired.
**Used by:** Convert screen (debounced 250ms after input changes).

#### `api.wallet.convert.execute` · `POST /wallet/convert/execute`
**Body:** `{ fromAsset, toAsset, fromAmount, toAmount, quoteId, pin? }`
**Response:** `Transaction`
**Errors:** `QUOTE_EXPIRED`, `INSUFFICIENT_BALANCE`.
**Used by:** ConvertConfirm screen.

---

### 5.4 Transactions (2)

#### `api.tx.list` · `GET /transactions?type=&limit=&cursor=`
**Response:** `{ items: Transaction[], nextCursor: string | null }`
**Filters:** `type` = `deposit` | `withdrawal` | `swap` | `trade` | `reward` | `card-topup`.
**Used by:** TxHistory, Home (recent activity), AssetDetail (filtered to that asset).

#### `api.tx.get` · `GET /transactions/:txId`
**Response:** `Transaction`
**Used by:** TxDetail screen.

---

### 5.5 Beneficiaries (3)

#### `api.beneficiaries.list` · `GET /beneficiaries`
**Response:** `{ items: Beneficiary[] }`
**Used by:** Beneficiaries screen, Withdraw (for "Saved" picker), NFTSend.

#### `api.beneficiaries.create` · `POST /beneficiaries`
**Body:** `{ name, asset, network, address, favorite? }`
**Response:** `Beneficiary`
**Used by:** Beneficiaries screen "Add" form.

#### `api.beneficiaries.delete` · `DELETE /beneficiaries/:id`
**Response:** `{ ok: true }`
**Used by:** Beneficiaries screen trash icon.

---

### 5.6 Markets (4)

#### `api.markets.list` · `GET /markets?tab=`
**Response:** `{ items: MarketPair[] }`
**Filters:** `tab` = `all` | `favorites` | `gainers` | `losers` | `new`.
**Notes:** **`favorites` should be per-user** — mock returns same list. Need server-side favorites table joined.
**Used by:** Markets tab, PairSelector.

#### `api.markets.pair` · `GET /markets/:pair`
**Response:** `MarketPair`
**Notes:** `:pair` is "BTC/USDT" url-encoded as "BTC%2FUSDT", or just "BTC" (mock accepts both — recommend pair format).
**Used by:** SpotTrading, AssetDetail.

#### `api.markets.candles` · `GET /markets/:pair/candles?interval=15m`
**Response:** `{ items: Array<{ t: number, o: number, h: number, l: number, c: number }> }`
**Notes:** `t` is unix ms. Returns last 38 candles in mock; real should respect a `?limit=`.
**Used by:** SpotTrading, AssetDetail.

#### `api.markets.orderbook` · `GET /markets/:pair/orderbook`
**Response:** `{ bids: Array<{ price, amount }>, asks: Array<{ price, amount }>, spread: string }`
**Used by:** SpotTrading. Currently mocked deterministically with random amounts — real should be live order book snapshot.

---

### 5.7 Trading (7)

#### `api.trading.order.create` · `POST /trading/orders`
**Body:** `{ pair, side: 'buy'|'sell', type: 'limit'|'market'|'stop-limit', price, amount, pin }`
**Response:** `TradingOrder`
**Side effects:** Lock balance for the order amount + fee.
**Used by:** OrderConfirm screen.

#### `api.trading.order.cancel` · `DELETE /trading/orders/:orderId`
**Response:** `TradingOrder` (status='cancelled')
**Used by:** Activity screen "Cancel" link.

#### `api.trading.orders.open` · `GET /trading/orders?status=open`
**Response:** `{ items: TradingOrder[] }`
**Used by:** Activity screen "Open Orders" tab.

#### `api.trading.orders.history` · `GET /trading/orders?status=history`
**Response:** `{ items: TradingOrder[] }` (filled + cancelled)
**Used by:** Activity screen "Order History" tab.

#### `api.trading.trades` · `GET /trading/trades`
**Response:** `{ items: Trade[] }`
**Used by:** Activity screen "Trade History" tab.

#### `api.trading.trade` · `GET /trading/trades/:tradeId`
**Response:** `Trade`
**Used by:** TradeDetail screen.

---

### 5.8 Earn (12)

#### `api.earn.savings.products` · `GET /earn/savings/products?asset=&type=`
**Response:** `{ items: SavingsProduct[] }`
**Filters:** `asset` (BTC/ETH/USDT/...), `type` (`flexible` | `locked`).
**Used by:** Savings screen, SavingsDeposit.

#### `api.earn.savings.deposit` · `POST /earn/savings/deposit`
**Body:** `{ productId, amount, pin? }`
**Response:** `SavingsPosition`
**Side effects:** Debit balance; create SavingsPosition with startDate=now, endDate=startDate + termDays.
**Used by:** SavingsDeposit screen.

#### `api.earn.savings.positions` · `GET /earn/savings/positions`
**Response:** `{ items: SavingsPosition[] }` (active only by default)
**Used by:** Savings, EarnHub.

#### `api.earn.staking.products` · `GET /earn/staking/products?protocol=`
**Response:** `{ items: StakingProduct[] }`
**Used by:** Staking screen.

#### `api.earn.staking.stake` · `POST /earn/staking/stake`
**Body:** `{ productId, amount, pin? }`
**Response:** `StakingPosition`
**Used by:** Staking screen "Stake" inline form.

#### `api.earn.staking.unstake` · `POST /earn/staking/unstake`
**Body:** `{ positionId, amount, pin? }`
**Response:** `{ positionId, asset, amountReceived: string, unbondingDays }`
**Used by:** Unstake screen.

#### `api.earn.staking.positions` · `GET /earn/staking/positions`
**Response:** `{ items: StakingPosition[] }`
**Used by:** Staking, Unstake, EarnHub.

#### `api.earn.autoinvest.list` · `GET /earn/auto-invest`
**Response:** `{ items: AutoInvestPlan[] }`
**Used by:** AutoInvest screen.

#### `api.earn.autoinvest.create` · `POST /earn/auto-invest`
**Body:** `{ asset, fundingAsset, amount, cadence: 'daily'|'weekly'|'biweekly'|'monthly', totalCycles? }`
**Response:** `AutoInvestPlan`
**Side effects:** Schedule recurring buy job.
**Used by:** AutoInvest screen "New Plan" form.

#### `api.earn.autoinvest.update` · `PATCH /earn/auto-invest/:id`
**Body:** `Partial<AutoInvestPlan>` (typically `status: 'active' | 'paused' | 'cancelled'`)
**Used by:** AutoInvest screen pause/resume toggle.

#### `api.earn.vault.list` · `GET /earn/vaults`
**Response:** `{ items: VaultProduct[] }`
**Used by:** Vault screen.

---

### 5.9 P2P (10)

#### `api.p2p.offers.list` · `GET /p2p/offers?asset=&fiat=&side=&payment=`
**Response:** `{ items: P2POffer[] }`
**Used by:** Marketplace screen.

#### `api.p2p.offer.get` · `GET /p2p/offers/:offerId`
**Response:** `P2POffer`
**Used by:** OfferDetail screen.

#### `api.p2p.order.create` · `POST /p2p/orders`
**Body:** `{ offerId, fiatAmount }`
**Response:** `P2POrder` (status='pending-payment', expiresAt = now + 15min)
**Side effects:** Lock seller's escrow.
**Used by:** OfferDetail screen "Buy" button.

#### `api.p2p.order.get` · `GET /p2p/orders/:orderId`
**Response:** `P2POrder`
**Used by:** Order screen.

#### `api.p2p.order.markpaid` · `POST /p2p/orders/:orderId/mark-paid`
**Response:** `P2POrder` (status='paid')
**Used by:** Order screen "I've Paid" button.

#### `api.p2p.order.release` · `POST /p2p/orders/:orderId/release`
**Response:** `P2POrder` (status='released')
**Side effects:** Move escrow → buyer's balance, increment seller's reputation.
**Notes:** **Only seller can call this.** Currently the mobile app doesn't expose this button (buyer-only flow); add to seller-side flow when you build it.

#### `api.p2p.order.dispute` · `POST /p2p/orders/:orderId/dispute`
**Body:** `{ reason?: string }`
**Response:** `P2POrder` (status='disputed')
**Side effects:** Open support ticket; freeze escrow.
**Used by:** Order screen "Cancel · Open Dispute" button.

#### `api.p2p.chat.send` · `POST /p2p/orders/:orderId/messages`
**Body:** `{ text: string, attachment?: { name, sizeKb } }`
**Response:** `P2PMessage`
**Used by:** P2PChat screen.

#### `api.p2p.chat.list` · `GET /p2p/orders/:orderId/messages`
**Response:** `{ items: P2PMessage[] }`
**Notes:** Real-time messaging would benefit from WebSocket; mock polls. Recommend `?since=<lastMsgId>` for delta polling.
**Used by:** P2PChat screen.

#### `api.p2p.payments.list` · `GET /p2p/payment-methods`
**Response:** `{ items: P2PPaymentMethod[] }`
**Used by:** PaymentMethods screen.

---

### 5.10 Card (6)

#### `api.card.get` · `GET /card`
**Response:** `CardSettings`
**Errors:** `NO_CARD` (404) — app auto-redirects to CardOnboarding.
**Used by:** CardHub, CardSettings, CardTransactions, CardTopUp.

#### `api.card.apply` · `POST /card/apply`
**Body:** `{}`
**Response:** `CardSettings` (status='awaiting-kyc' or 'active' if KYC L2 done)
**Side effects:** Issue card via your card provider (Marqeta/Stripe Issuing/etc.). Generate `cardLast4`.
**Used by:** CardOnboarding "Apply" button.

#### `api.card.topup` · `POST /card/top-up`
**Body:** `{ amount: string, fromAsset: string, pin? }`
**Response:** `{ card: CardSettings, credit: string }`
**Side effects:** Convert source asset → USD; debit balance; credit card.
**Used by:** CardTopUp screen.

#### `api.card.freeze` · `POST /card/freeze`
**Body:** `{ freeze: boolean }`
**Response:** `CardSettings`
**Used by:** CardHub freeze button, CardSettings freeze toggle.

#### `api.card.settings.update` · `PATCH /card/settings`
**Body:** `Partial<CardSettings>` — typically toggles like `onlineEnabled`, `internationalEnabled`, `contactlessEnabled`, `dailySpendLimit`, `monthlySpendLimit`, `allowedRegions[]`.
**Response:** `CardSettings`
**Used by:** CardSettings screen.

#### `api.card.transactions` · `GET /card/transactions`
**Response:** `{ items: CardTransaction[] }`
**Used by:** CardHub recent spend, CardTransactions full list.

---

### 5.11 NFT (4)

#### `api.nft.gallery` · `GET /nfts/owned`
**Response:** `{ items: NFT[] }` (where `ownerId === current user`)
**Used by:** NFTGallery.

#### `api.nft.market` · `GET /nfts/market`
**Response:** `{ items: NFT[] }` (where `ownerId === null`, listed for sale)
**Used by:** NFTMarketplace.

#### `api.nft.detail` · `GET /nfts/:nftId`
**Response:** `NFT`
**Used by:** NFTDetail.

#### `api.nft.send` · `POST /nfts/:nftId/send`
**Body:** `{ recipient: string, pin? }`
**Response:** `{ ok: true, recipient, nft }`
**Side effects:** Submit ERC-721 transferFrom. Update `nft.ownerId` to null until on-chain confirms.
**Used by:** NFTSend.

---

### 5.12 AI (16)

#### `api.ai.chat.send` · `POST /ai/chat`
**Body:** `{ conversationId?: string, text: string }` (omit `conversationId` to start a new conversation)
**Response:** `{ conversation: AIConversation, userMessage: AIMessage, assistantMessage: AIMessage }`
**Notes:** **Real backend should stream tokens** via SSE or websocket — mobile app currently waits for full response (mock). When you implement SSE, change `client.ts` to handle `text/event-stream`.
**Side effects:** Call Claude (or your model). Honor user's `aiSettings` (model, autoExecuteUnderUsd, etc.). If the AI emits a tool-call (e.g., execute swap), the backend orchestrates the tool call (with PIN check if `aiTools[tool].pinThresholdUsd` requires) and returns the result message.
**Used by:** AI Chat (tab root).

#### `api.ai.chat.history` · `GET /ai/chat/history`
**Response:** `{ items: AIConversation[] }` (most recent first, includes both archived + active)
**Used by:** AIChatHistory screen.

#### `api.ai.chat.conversation` · `GET /ai/chat/:conversationId`
**Response:** `{ conversation, messages: AIMessage[] }`
**Used by:** ConversationDetail.

#### `api.ai.voice.start` · `POST /ai/voice/start`
**Body:** `{}`
**Response:** `{ sessionId, websocketUrl, voice: string }`
**Notes:** Mobile opens WebSocket to push mic audio. Currently mocked / unwired in v1 voice mode (cycles through colors locally). Wire this when you ship voice infrastructure (Vapi/Deepgram/etc.).
**Used by:** VoiceMode screen (currently inert button; backend wiring pending).

#### `api.ai.voice.end` · `POST /ai/voice/end`
**Body:** `{ sessionId }`
**Used by:** VoiceMode "End Call".

#### `api.ai.settings.get` · `GET /ai/settings`
**Response:** `AISettings`
**Used by:** AISettings, AIVoiceSettings, AIPinSettings.

#### `api.ai.settings.update` · `PATCH /ai/settings`
**Body:** `Partial<AISettings>` (e.g., `{ voice: 'Mira' }` or `{ pinTokenTtlMin: 30 }`)
**Response:** `AISettings`
**Used by:** Same screens above.

#### `api.ai.tools.list` · `GET /ai/tools`
**Response:** `{ items: AITool[] }`
**Used by:** AITools screen.

#### `api.ai.tools.update` · `PATCH /ai/tools`
**Body:** `{ id: string, enabled?: boolean, pinThresholdUsd?: number | null }`
**Response:** `AITool`
**Used by:** AITools screen toggle.

#### `api.ai.memory.list` · `GET /ai/memory`
**Response:** `{ items: AIMemoryItem[] }`
**Used by:** AIMemory screen.

#### `api.ai.memory.delete` · `DELETE /ai/memory/:itemId`
**Used by:** AIMemory delete-row button.

#### `api.ai.memory.clear` · `DELETE /ai/memory`
**Used by:** AIMemory "Clear All", AISettings "Reset & Clear All Memory".

#### `api.ai.scheduled.list` · `GET /ai/scheduled`
**Response:** `{ items: AIScheduledAction[] }`
**Used by:** AIScheduled screen.

#### `api.ai.scheduled.detail` · `GET /ai/scheduled/:actionId`
**Response:** `AIScheduledAction` (with `history[]` populated)
**Used by:** AIActionDetail.

#### `api.ai.scheduled.cancel` · `DELETE /ai/scheduled/:actionId`
**Response:** `AIScheduledAction` (status='cancelled')
**Used by:** AIActionDetail "Cancel Action".

#### `api.ai.share.create` · `POST /ai/chat/:conversationId/share`
**Response:** `AIShare` (with `id`, `expiresAt = now + 7d`)
**Used by:** AIShare screen.

#### `api.ai.share.get` · `GET /ai/share/:shareId` **(public, unauthenticated!)**
**Response:** `{ share, conversation, messages }`
**Notes:** This is the only public endpoint. App route is also public (`/share/:shareId`). Add CORS / abuse limiting.
**Used by:** AISharedViewer screen.

#### `api.ai.share.revoke` · `DELETE /ai/chat/:conversationId/share`
**Used by:** AIShare "Revoke Link".

#### `api.ai.notifications` · `GET /ai/notifications`
**Response:** `{ items: Array<{ id, type, tone, title, body, when }> }`
**Used by:** AINotifications screen.

---

### 5.13 Security (8)

#### `api.security.summary` · `GET /security`
**Response:** `SecuritySummary`
**Used by:** SecurityHub, Profile.

#### `api.security.2fa.enable` · `POST /security/2fa/enable`
**Body:** `{ code: string }` (the 6-digit TOTP from authenticator after scanning QR)
**Response:** `SecuritySummary`
**Side effects:** Set `twoFAEnabled: true`. Issue backup codes server-side.
**Used by:** TwoFactorSetup verify step.

#### `api.security.2fa.disable` · `POST /security/2fa/disable`
**Body:** `{ pin? }`
**Used by:** SecurityHub.

#### `api.security.backup-codes` · `POST /security/backup-codes`
**Response:** `{ codes: string[], usedCount: number }`
**Side effects:** Regenerates and **invalidates** all old codes.
**Used by:** BackupCodes screen ("Regen" button + auto-call on first visit).

#### `api.security.password.change` · `POST /security/password`
**Body:** `{ currentPassword, newPassword }`
**Errors:** `WEAK`, `INVALID` (wrong current).
**Used by:** ChangePassword.

#### `api.security.pin.change` · `POST /security/pin`
**Body:** `{ currentPin, newPin }`
**Errors:** `INVALID_PIN`.
**Used by:** ChangePin.

#### `api.security.sessions.list` · `GET /security/sessions`
**Response:** `{ active: Session[], history: LoginEvent[] }`
**Used by:** Sessions screen, SecurityHub (count).

#### `api.security.sessions.revoke` · `DELETE /security/sessions/:sessionId`
**Errors:** `CANNOT_REVOKE_CURRENT`.
**Used by:** Sessions screen "Revoke" button.

---

### 5.14 Settings (10)

#### `api.settings.notifications.get/update` · `GET/PATCH /settings/notifications`
**Body (update):** `Partial<Record<string, boolean>>` — keys like `'push'`, `'email'`, `'sms'`, `'order.filled'`, etc.
**Used by:** NotificationsSettings.

#### `api.settings.alerts.list/create/update/delete` · `GET/POST/PATCH/DELETE /settings/alerts(/:id)`
**`PriceAlert`** with fields: asset, condition, thresholdValue, thresholdAmount, active, oneTime, notifyPush, notifyEmail.
**Used by:** PriceAlerts, PriceAlertEdit screens.
**Side effects:** Server should run a worker that compares prices and fires alerts via push/email.

#### `api.settings.api-keys.list/create/delete` · `GET/POST/DELETE /settings/api-keys(/:id)`
**Body (create):** `{ name, scopes: { read, trade, withdraw, manage } }`
**Response:** `APIKey` — at create time, `secretKeyPreview` is the **full secret** (returned only once). Subsequent reads return preview only.
**Used by:** Developer, ApiKeys, ApiKeyDetail.

---

### 5.15 Fiat (3)

#### `api.fiat.quote` · `POST /fiat/quote`
**Body:** `{ fiatAmount, fiatCurrency: 'USD'|'EUR'|'NGN', cryptoAsset, paymentMethod? }`
**Response:** `{ quoteId, fiatAmount, fiatCurrency, cryptoAmount, cryptoAsset, rate, fee, networkFee, validForSec }`
**Used by:** BuyCrypto screen (debounced).

#### `api.fiat.order.create` · `POST /fiat/orders`
**Body:** `{ fiatAmount, fiatCurrency, cryptoAmount, cryptoAsset, rate, fee, paymentMethod, quoteId }`
**Response:** `FiatOrder` (status='pending')
**Side effects:** Forward to provider (Guardarian). Returns the gateway URL — mobile app currently shows fake checkout, but real implementation should redirect to `gatewayUrl` field.
**Used by:** FiatOrderConfirm.

#### `api.fiat.order.status` · `GET /fiat/orders/:orderId`
**Response:** `FiatOrder`
**Notes:** App polls this every 1.5s. When status flips to `completed`, app credits the wallet client-side. **Real backend should credit the wallet itself** — mock does this in the `status` endpoint as a side effect (search "Auto-progress" in handlers.ts).
**Used by:** FiatOrderStatus.

---

### 5.16 Engagement (8)

#### `api.rewards.summary` · `GET /rewards`
**Response:** `RewardsSummary` (xp, badges, tier, nextTierXp)
**Used by:** Profile, Home, Rewards.

#### `api.rewards.badges` · `GET /rewards/badges`
**Response:** `{ items: Badge[] }`
**Notes:** Includes both earned (where userId === current) AND available (userId === null with `progress` field).
**Used by:** Rewards.

#### `api.rewards.tiers` · `GET /rewards/tiers`
**Response:** `{ items: Array<{ name, emoji, range, perks }> }`
**Notes:** Static data — could be hardcoded server-side. App caches it.
**Used by:** TierDetail.

#### `api.rewards.claim-daily` · `POST /rewards/daily`
**Response:** `{ xp: number, total: number }`
**Used by:** Rewards screen daily quest claim button.

#### `api.referral.summary` · `GET /referral`
**Response:** `{ code, referredCount, earnedUsd, earnedXp, items: Referral[] }`
**Used by:** Referral.

#### `api.notifications.list` · `GET /notifications`
**Response:** `{ items: Notification[] }`
**Used by:** Notifications feed.

#### `api.notifications.read` · `POST /notifications/read`
**Body:** `{ ids?: string[] }` (omit to mark all)
**Used by:** Notifications "Mark all read".

#### `api.announcements.list` · `GET /announcements`
**Response:** `{ items: Announcement[] }`
**Used by:** Announcements.

---

### 5.17 Support (6)

#### `api.support.articles` · `GET /support/articles?category=&q=`
**Response:** `{ items: SupportArticle[] }`
**Used by:** HelpCenter.

#### `api.support.article` · `GET /support/articles/:slug`
**Response:** `SupportArticle`
**Used by:** Article screen.

#### `api.support.tickets.list` · `GET /support/tickets`
**Response:** `{ items: SupportTicket[] }`
**Used by:** Tickets screen.

#### `api.support.tickets.create` · `POST /support/tickets`
**Body:** `{ subject, category, description, priority?, attachments? }`
**Response:** `SupportTicket`
**Side effects:** Notify support team; auto-assign team based on `category`.
**Used by:** Contact screen.

#### `api.support.tickets.detail` · `GET /support/tickets/:ticketId`
**Response:** `{ ticket: SupportTicket, messages: SupportTicketMessage[] }`
**Used by:** TicketDetail.

#### `api.support.tickets.reply` · `POST /support/tickets/:ticketId/messages`
**Body:** `{ body: string, attachment? }`
**Response:** `SupportTicketMessage`
**Used by:** TicketDetail.

---

### 5.18 System (2)

#### `api.system.status` · `GET /system/status` **(public)**
**Response:** `{ overall: string, services: Array<{ id, name, status, uptime }> }`
**Used by:** Status screen.

#### `api.system.version` · `GET /system/version` **(public)**
**Response:** `{ version, build, minSupportedVersion, forceUpdate: boolean }`
**Used by:** App boot — when `forceUpdate: true`, redirect to `/update`.

---

## 6. Screen wiring

> Per screen: **purpose · data sources · buttons · navigates to**.
>
> Total: 108 screens. Skip the ones already obvious (e.g., Splash); focus on flows.

### 6.1 Tab roots (5)

#### Home — `route.tab.home` (`/home`)
- **Purpose:** dashboard with balance, top assets, recent activity, AI banner.
- **Data:** `api.wallet.balances.list`, `api.user.profile.get` (greeting), recent items derived from `api.tx.list` (first 4 items).
- **Buttons:**
  - Bell → `route.engage.notifications`
  - "Talk to CrymadX AI" banner → `route.tab.ai`
  - Send / Receive / Convert / Buy quick actions → `withdraw` / `deposit-pick` / `convert` / `fiat.buy`
  - "Top Assets" rows → `route.wallet.asset` with symbol param
  - "Recent Activity" → `route.wallet.tx-history`

#### Markets — `route.tab.markets` (`/markets`)
- **Data:** `api.markets.list?tab=<tab>`.
- **Tabs:** All / ★ Favorites / Gainers / Losers / New.
- **Buttons:**
  - Pair row "Trade" badge → `route.trading.spot` with pair param.

#### AI Chat — `route.tab.ai` (`/ai`)
- **Data:** N/A (in-memory message list initialized empty).
- **Mutation:** `api.ai.chat.send` per user message — backend should stream the response.
- **Buttons:**
  - Mic icon (top right) → would open VoiceMode (currently inert).
  - Settings icon → `route.ai.settings`.
  - Clock icon → `route.ai.history`.
  - Suggestion chips → autofill input.
  - Send button → `api.ai.chat.send`.

#### Wallet — `route.tab.wallet` (`/wallet`)
- **Data:** `api.wallet.balances.list`.
- **Buttons:** Deposit/Withdraw/Convert/Buy → wallet routes; refresh icon → refetch; asset row → AssetDetail.
- **"Hide 0" toggle** is local-only (not persisted).

#### Profile — `route.tab.profile` (`/profile`)
- **Data:** auth store `user`, `api.rewards.summary`.
- **Buttons:**
  - "Sign Out" → `api.auth.logout` then clear local state, navigate to Login.
  - Each row navigates to its respective screen (KYC, Security, Theme, Language, Currency, Notifications, Rewards, Referral, etc.).

### 6.2 Auth & onboarding (10)

#### Splash — `/`
- Auto-redirects after 1.4s based on auth store: signed in → Home, else → Login.

#### Onboarding — `/onboarding`
- 9-slide intro deck (single screen, state machine).
- Welcome slide uses `crymadx-full.png` logo.
- AI Co-pilot slide uses `crymadx-ai-full.png` logo.
- Final slide → `route.auth.register`.

#### Login — `/login`
- **Mutation:** `api.auth.login`.
- **On success:** stores token + user, navigates to `from` (where they were redirected from) or Home.
- **Demo behavior in mock:** any email/password works, signs in as `usr_001`.
- **Buttons:** Sign In, Forgot Password, Sign Up, Google/Apple/Biometric (currently no-op buttons — backend wiring optional).

#### Register, VerifyEmail, CompleteProfile — sequential.
- Register form → `api.auth.register` → VerifyEmail with email in route state.
- VerifyEmail → 6 separate inputs auto-advance; submit calls `api.auth.verify-email` → CompleteProfile.
- CompleteProfile → `api.auth.complete-profile` → Home.

#### Login2FA — `/login/2fa`
- 6-input code grid + 28s resend timer + "Use Backup Code" button.
- Mutation: `api.auth.verify-2fa`.

#### ForgotPassword, ResetPassword
- Flow: ForgotPassword → email link → ResetPassword → Login.

#### BiometricSetup — `/biometric-setup`
- "Enable" button is currently navigate-only (no native binding). Wire `LocalAuthentication` (Capacitor) when shipping.

### 6.3 Wallet flow (10)

#### DepositPick — `/wallet/deposit`
- Lists balances → tap an asset → `route.wallet.deposit/:asset`.

#### Deposit — `/wallet/deposit/:asset`
- **Data:** `api.wallet.networks.list/:asset` for network switcher, `api.wallet.deposit.address/:asset/:network` for the address + QR.
- **QR generation:** currently a *visual placeholder* — see §7.3 below for real implementation.
- **Buttons:** Network switcher (select), Copy address.

#### Withdraw — `/wallet/withdraw`
- **Data:** balances, `api.wallet.withdraw.fee?asset=<asset>` (live as user changes asset).
- **Inputs:** asset switcher, address, amount, MAX button.
- **Continue** → WithdrawConfirm with state.

#### WithdrawConfirm — `/wallet/withdraw/confirm`
- **PIN keypad** (6 digits). Submit calls `api.wallet.withdraw.create` → TxDetail.

#### Convert, ConvertConfirm
- Convert: live quoting (`api.wallet.convert.quote` debounced 250ms), expiry timer.
- ConvertConfirm: PIN-gated `api.wallet.convert.execute` → TxDetail.

#### AssetDetail, TxHistory, TxDetail, Beneficiaries — list rendering, no special wiring beyond endpoints.

### 6.4 Trading (4)

#### SpotTrading — `/trade/:pair`
- **Data:** `api.markets.pair/:pair`, `api.markets.orderbook/:pair`, `api.markets.candles?interval=15m`.
- **Inputs:** side (buy/sell), order type (limit/market/stop-limit), price, amount, percent buttons (25/50/75/100%).
- **Submit:** navigates to OrderConfirm with state. `api.trading.order.create` is called there.

#### OrderConfirm — `/trade/confirm`
- PIN-gated. Order placed → navigate to TradeDetail.

#### Activity — `/trade/activity`
- Tabs hit different endpoints: open / history / trades.
- "Cancel" → `api.trading.order.cancel`.

### 6.5 Earn (8)

- **EarnHub**: 5 tiles routing to sub-pages. Total earnings derived client-side from positions endpoints.
- **Savings**: products list + active positions, asset/type filters.
- **SavingsDetail**: APY, term, reward calculator (client-side math).
- **SavingsDeposit**: PIN-gated `api.earn.savings.deposit`.
- **Staking**: each product has inline stake form (calls `api.earn.staking.stake`).
- **Unstake**: PIN-gated `api.earn.staking.unstake`.
- **AutoInvest**: list + create + pause/resume.
- **Vault**: read-only list (no positions UI yet — TODO when you build vault subscription).

### 6.6 P2P (5) — full escrow flow

- **Marketplace**: filters by asset/fiat/payment. Side toggle (buy/sell) is local-only (mock returns sell offers regardless).
- **OfferDetail**: amount input → `api.p2p.order.create` → Order screen.
- **Order**: live 15-min countdown. Buttons:
  - "I've Paid" → `api.p2p.order.markpaid`
  - "Chat" → P2PChat
  - "Cancel · Open Dispute" → `api.p2p.order.dispute`
- **P2PChat**: message list + send.
- **PaymentMethods**: read-only list. "Add" grid is currently dead-end UI (TODO: build add-method flow).

### 6.7 Card (5)

- **CardHub**: auto-redirects to Onboarding if no card.
- **CardOnboarding**: "Apply for Card" → `api.card.apply` → Hub.
- **CardTopUp**: amount + source asset → `api.card.topup` → debits source, credits card, creates transaction in `tx.list`.
- **CardSettings**: limits (read-only displayed; updating requires `api.card.settings.update` — partially wired).
- **CardTransactions**: filter by status.

### 6.8 NFT (4)

- **NFTGallery**: 4 owned NFTs (mock); chain filter.
- **NFTMarketplace**: 4 unowned + reuses some.
- **NFTDetail**: shows traits with rarity. Buy button is **currently UI-only** (mock).
- **NFTSend**: PIN-gated transfer.

### 6.9 AI (14)

- **VoiceMode**: orb cycles through listening/thinking/speaking states client-side every 4s. Real backend = WebSocket + audio frames.
- **ChatHistory**: conversation list grouped by today/yesterday/earlier.
- **ConversationDetail**: read-only view of an old conversation. Share button → `route.ai.share` with conversationId.
- **AISettings**: row tapping navigates to subpages (Tools, Memory, PIN, Voice). Toggles call `api.ai.settings.update`.
- **AIVoiceSettings**: voice picker (5 voices), speed slider, push-to-talk + wake-word toggles.
- **AITools**: per-tool toggle + PIN threshold display. Backend should honor `pinThresholdUsd` when the AI emits a tool call from `api.ai.chat.send`.
- **AIMemory**: read + delete + clear-all.
- **AIScheduled, AIActionDetail**: read + cancel.
- **AIShare**: auto-creates a share link on visit; copy/revoke.
- **AISharedViewer** (`/share/:shareId`, **PUBLIC**): no auth gate. Returns 410 if expired.
- **AIPinSettings**: TTL slider (5min - 24h), per-action toggles.
- **AIOnboarding**, **AINotifications**: standard list rendering.

### 6.10 Security (6)

- **SecurityHub**: ring score (0-100), all rows navigate to subpages.
- **TwoFactorSetup**: shows QR (placeholder visual), manual key copy, code verify → `api.security.2fa.enable`.
- **BackupCodes**: auto-calls `api.security.backup-codes` on first visit, can regen. **Important:** backend should invalidate old codes on regen.
- **ChangePassword**: 5-rule strength checklist, dual confirm.
- **ChangePin**: 3-step keypad state machine (current → new → confirm).
- **Sessions**: active / history / devices tabs. Revoke calls `api.security.sessions.revoke`.

### 6.11 KYC (4)

- **KYCStatus**: 3 level cards with progress.
- **KYCFlow**: tips + "Open Camera" → `api.user.kyc.start` → KYCPending. **Real implementation:** open Gokuvision (or your KYC provider) webview here. Mobile app currently fakes the camera step.
- **KYCPending**: polls `api.user.kyc.status` every 5s. Shows ETA countdown.
- **KYCLevelInfo**: static info page.

### 6.12 Settings (10)

- **Notifications**: channels + 3 categories of toggles, all persisted.
- **Theme**: mode picker (dark/light/system) + accent palette. **Currently only dark/light wired**; system mode + accent change are UI stubs.
- **Language, Currency**: currently UI-only — selection is local state. Wire when you ship i18n. Add `api.user.profile.update` calls with `language`/`currency` fields.
- **PriceAlerts, PriceAlertEdit**: full CRUD wired.
- **Developer**: stats + nav to ApiKeys.
- **ApiKeys, ApiKeyDetail**: list + reveal secret + scopes + revoke. **Important:** secret should only be revealable once (at creation). Currently mock returns the preview always — tighten in real backend.
- **Ecosystem**: read-only list of related apps.

### 6.13 Engagement (5)

- **Rewards**: XP gauge, daily quests (claim button → `api.rewards.claim-daily`), badges with rarity.
- **TierDetail**: 5-tier ladder with current marker.
- **Referral**: copy code, list of invitees.
- **Notifications feed**: filter by type, mark all read.
- **Announcements**: pinned + list.

### 6.14 Support (5)

- **HelpCenter**: 8 topic tiles (currently dead-end — extend to category-filtered Article list when ready), popular articles list.
- **Article**: full-page article render.
- **Tickets**: open / closed / all tabs.
- **TicketDetail**: live chat + reply + meta order info.
- **Contact**: full form → creates ticket → navigate to detail.

### 6.15 Legal & Misc (8)

- **Terms, Privacy, About**: static content — will eventually be markdown fetched from a CMS or `/legal/*.md`. For now hardcoded in screen components.
- **Status**: live system status from `api.system.status`.
- **ScanQR**: full-screen camera UI overlay. Currently no actual camera binding — wire `@capacitor-community/barcode-scanner` when you ship.
- **AssetSelector, PairSelector**: sheet-style screens used by trading/withdraw/convert (currently navigated to as full screens, not bottom sheets).
- **Debug**: dev-only menu with a "Reset Demo Data" button that wipes localStorage. Hide in production.

### 6.16 System states (2)

- **Offline**: shown when network errors detected. Currently route is dead-end; intercept globally on fetch failure to redirect.
- **ForceUpdate**: shown when `api.system.version` returns `forceUpdate: true`. Mobile app should check on cold start.

---

## 7. Hardcoded data atlas

> Things currently baked into the mobile app that the backend dev should be aware of. Most are presentation-only and can stay; some need backend hooks.

### 7.1 Asset color palette

**Where:** every screen that renders an asset has a `ASSET_COLORS` map like:
```ts
const ASSET_COLORS: Record<string, string> = {
  BTC: '247,147,26', ETH: '98,126,234', USDT: '38,161,123',
  USDC: '39,117,204', SOL: '147,99,247', MATIC: '130,71,229',
  BNB: '243,186,47', XRP: '35,35,35', DOGE: '186,140,40',
  // ...
}
```
**Backend treatment:** Optionally return `iconColor: "247,147,26"` and `iconUrl` in the `Asset` type. Mobile app currently does not use `iconUrl` anywhere — it renders just the asset symbol's first letter on a tinted circle. **If you want real coin icons (which you should for production):**
1. Add `iconUrl` to the `Asset` and `Balance` response types.
2. In each screen, replace `<div>{asset[0]}</div>` with `<img src={iconUrl} alt={asset} />`.
3. Or host the asset icons on a CDN (e.g., CoinGecko/CMC icon set) and resolve them client-side from a static map.

### 7.2 Coin / asset list (which assets are supported)

**Where:** spread across the codebase:
- `src/screens/wallet/Convert.tsx` → `AssetPicker` accepts options `['USDT', 'USDC', 'BTC', 'ETH', 'SOL', 'BNB']`
- `src/screens/wallet/CardTopUp.tsx` → only stables (`['USDC', 'USDT', 'BTC']`)
- `src/screens/fiat/BuyCrypto.tsx` → `CRYPTO_OPTIONS = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL']`
- `src/screens/misc/AssetSelector.tsx` → 12 assets hardcoded with prices
- `src/screens/misc/PairSelector.tsx` → uses `api.markets.list` (good — already from API)
- `src/screens/wallet/DepositPick.tsx` → derives from balances (good)

**Backend treatment:** Add `api.assets.list` returning all supported assets:
```ts
// Suggested: GET /assets
// Response: { items: Asset[] }
// Asset: { symbol, name, decimals, iconColor, iconUrl, isFiat?, supportedNetworks: string[], minDeposit, ... }
```
Then refactor each screen to fetch from this single source. **Current mobile app duplicates this list in 4-5 places.** The `MarketPair` type partially serves this, but it's pair-centric, not asset-centric.

### 7.3 Network list per asset

**Where:** [`src/mock/handlers.ts`](src/mock/handlers.ts) → `api.wallet.networks.list` handler has a hardcoded `NETWORKS` map.

**Backend treatment:** This needs to come from the real backend. Each asset's supported networks depend on which custody/wallet provider you use (BitGo / Fireblocks / etc.). Add `supportedNetworks` to the `Asset` type or keep it on `api.wallet.networks.list/:asset`.

### 7.4 Deposit address book (BTC / USDT / etc.)

**Where:** [`src/mock/handlers.ts`](src/mock/handlers.ts) → `api.wallet.deposit.address` handler:
```ts
const ADDRESSES: Record<string, string> = {
  'BTC:BTC':       'bc1qey5rqhufuks84s5cssc6uf2zqvdedjgcq3v8pd',
  'USDT:TRC20':    'TR8gBnaEJzKqAycUDVEUpHL7eN3kd2',
  'ETH:ERC20':     '0x47f1a58b89d7895df1f222b6f7c5e8e379272f8a',
  // ...
}
```
**Backend treatment:** Generate per-user deposit addresses on first request and cache them. Each user's BTC address must be unique to identify incoming deposits. Use HD wallet derivation or your custody provider's API. **Don't reuse the same address across users.**

### 7.5 QR generation

**Where:** [`src/screens/wallet/Deposit.tsx`](src/screens/wallet/Deposit.tsx) → `<FakeQR>` component renders a deterministic 11x11 grid of dots based on a hash of the address. **It is not a real QR code.**

**Backend treatment:** Mobile app should generate the real QR client-side. Options:
1. Add a dependency: `qrcode.react` or `react-qr-code`. ~3KB.
2. Replace `<FakeQR seed={data.address} />` with `<QRCodeSVG value={data.qrData ?? data.address} />`.
3. Backend returns `qrData` field with whatever format you want encoded — can be just the address, or a URI like `bitcoin:bc1q…?amount=…&label=Joseph`.

This is the **single biggest UX bug to fix before shipping.** Customers will scan invalid QR codes otherwise.

### 7.6 Payment methods (P2P / Fiat)

**Where:**
- [`src/mock/db.ts`](src/mock/db.ts) → `p2pPaymentMethods` array (4 entries: Access Bank, Wise USD, OPay, PalmPay)
- [`src/screens/p2p/PaymentMethods.tsx`](src/screens/p2p/PaymentMethods.tsx) → "Add Method" grid hardcoded
- [`src/screens/fiat/BuyCrypto.tsx`](src/screens/fiat/BuyCrypto.tsx) → "Visa **** 4821" placeholder

**Backend treatment:** Add full CRUD for payment methods. The mobile app currently can't actually add a payment method (UI stub only). Endpoints to add:
- `POST /p2p/payment-methods` — create
- `POST /p2p/payment-methods/:id/verify` — verify with SMS/email code
- `DELETE /p2p/payment-methods/:id` — delete
- `GET /payment-methods` — list (for fiat, separate from P2P or merge)

### 7.7 PIN / biometric

**Where:** PIN is currently free-form 6 digits with no real check. Any 6 digits is accepted by `api.wallet.withdraw.create`, `api.trading.order.create`, etc.

**Backend treatment:**
- Store PIN as `bcrypt(pin + userId)` server-side (never plaintext).
- All sensitive mutations should accept `pin` (or a short-lived `pinToken`) and validate.
- Throttle: 5 failed attempts → temp lockout.
- Biometric is just a client-side approval. The backend doesn't see fingerprint data — it sees that the user passed local biometric and the app's PIN session token is still valid.

### 7.8 KYC provider integration

**Where:** [`src/screens/kyc/KYCFlow.tsx`](src/screens/kyc/KYCFlow.tsx) shows a "Powered by Gokuvision" banner.

**Backend treatment:** When you implement `api.user.kyc.start`, return `{ verificationUrl, sessionId }`. The mobile app should then open that URL in an in-app webview / Capacitor browser. On webview close, app polls `api.user.kyc.status` to detect completion.

The existing [`api-reference.md`](api-reference.md) (the file you have open) documents the CrymadX KYC API — use that exact contract.

### 7.9 AI model & voices

**Where:**
- Settings UI shows "Claude Opus 4.7" hardcoded
- Voices list `['Mira', 'Nova', 'Kai', 'Atlas', 'Aria']` hardcoded in `src/screens/ai/AIVoiceSettings.tsx`

**Backend treatment:** Return `availableModels` and `availableVoices` from `api.ai.settings.get`. Currently only the active selection is returned.

### 7.10 Tier perks / fee structure

**Where:** [`src/mock/handlers.ts`](src/mock/handlers.ts) → `api.rewards.tiers` returns hardcoded perks.

**Backend treatment:** Source these from your fee schedule config. Returning structured perks (rather than free-form strings) would let the mobile app show them more dynamically:
```ts
// Suggested:
{ name: 'Bronze', xpRange: [0, 500], tradingFeeBps: 10, dailyWithdrawalLimitUsd: 10000, perks: [...] }
```

### 7.11 Referral code

**Where:** Hardcoded `'JOSEPH-2026'` in `api.referral.summary` mock.

**Backend treatment:** Auto-generate a unique code per user on signup, attach to user record. Reward distribution happens server-side when invited user reaches verified KYC.

### 7.12 Tax / jurisdiction

**Where:** AI memory has "Tax jurisdiction: Nigeria" hardcoded.

**Backend treatment:** Source from `User.country` when generating tax reports. AI memory should be populated from real user signals, not pre-seeded.

### 7.13 Brand assets

**Where:** [`public/`](public/) directory has 4 PNG files:
- `crymadx-mark.png` — shield logo only
- `crymadx-full.png` — wordmark lockup
- `crymadx-ai-mark.png` — AI infinity logo
- `crymadx-ai-full.png` — AI wordmark lockup

**Backend treatment:** None — these are app assets. Don't replace from API.

---

## 8. Routing & navigation map

Visual map of how screens connect. Arrows mean "this button navigates here."

```
Splash
  ├── (signed in) → Home
  └── (signed out) → Login

Onboarding ─→ Register ─→ VerifyEmail ─→ CompleteProfile ─→ Home

Login
  ├── Sign In ─→ Home (or → Login2FA if requires2FA)
  ├── Forgot Password ─→ ForgotPassword ─→ ResetPassword ─→ Login
  └── Sign Up ─→ Register

Home (tab)
  ├── 🔔 → Notifications
  ├── 🤖 Talk to AI banner → AI Chat tab
  ├── Quick actions → Withdraw / DepositPick / Convert / BuyCrypto
  ├── Top Asset row → AssetDetail
  └── Recent Activity → TxHistory

Markets (tab)
  └── Pair "Trade" badge → SpotTrading

AI Chat (tab)
  ├── Mic button → VoiceMode (currently inert)
  ├── Clock icon → ChatHistory ─→ ConversationDetail ─→ AIShare ─→ AISharedViewer (public)
  └── Settings → AISettings ─→ AITools / AIMemory / AIPinSettings / AIVoiceSettings

Wallet (tab)
  ├── Deposit → DepositPick ─→ Deposit (per asset)
  ├── Withdraw → Withdraw ─→ WithdrawConfirm (PIN) ─→ TxDetail
  ├── Convert → Convert ─→ ConvertConfirm (PIN) ─→ TxDetail
  ├── Buy → BuyCrypto ─→ FiatOrderConfirm ─→ Guardarian ─→ FiatOrderStatus
  └── Asset row → AssetDetail ─→ TxDetail

Profile (tab)
  ├── KYC → KYCStatus ─→ KYCFlow ─→ KYCPending
  │                  └─→ KYCLevelInfo
  ├── Security → SecurityHub
  │              ├─→ TwoFactorSetup ─→ BackupCodes
  │              ├─→ ChangePassword
  │              ├─→ ChangePin
  │              └─→ Sessions
  ├── API Keys → Developer ─→ ApiKeys ─→ ApiKeyDetail
  ├── Rewards → Rewards ─→ TierDetail
  ├── Referral → Referral
  ├── Theme/Language/Currency/Notifications → settings/* screens
  └── Sign Out → Login (clears auth)

Trading (from Markets or via /trade/:pair)
  ├── Place Order → OrderConfirm (PIN) ─→ TradeDetail
  └── Activity → Activity (open / history / trade tabs)

Earn (via Wallet → Earn tab → not currently linked, accessible via /earn URL)
  ├── EarnHub
  ├── Savings ─→ SavingsDetail ─→ SavingsDeposit
  ├── Staking ─→ Unstake
  ├── AutoInvest
  └── Vault

P2P (accessible via /p2p URL — currently no nav entry from main UI; add to Profile or Wallet)
  ├── Marketplace ─→ OfferDetail ─→ Order ─→ Chat
  └── PaymentMethods

Card (via Profile → Payment Methods → /card)
  ├── CardOnboarding (auto-redirect if no card)
  ├── CardHub
  │   ├─→ CardTopUp
  │   ├─→ CardSettings
  │   └─→ CardTransactions

NFT (accessible via /nft URL)
  ├── NFTGallery ─→ NFTDetail ─→ NFTSend
  └── NFTMarketplace ─→ NFTDetail
```

### Routes that need a nav entry (currently URL-only)

- `/earn` — add a Profile section or Wallet tab card.
- `/p2p` — add to Profile or as a sub-tab.
- `/nft` — add to Profile.
- `/help`, `/about`, `/legal/*`, `/status` — add to Profile bottom section.

---

## 9. Open questions / decisions for product

These need product / design / business answers before backend can finalize:

1. **2FA enforcement**: should existing users be force-prompted to enable 2FA, or opt-in? Mobile app currently treats it as opt-in.
2. **Withdrawal whitelisting**: is there a 24h delay on adding a new withdrawal address? Industry standard. Mobile app doesn't enforce this.
3. **Fiat off-ramp** (sell crypto for fiat): the canvas had a "Sell" tab on BuyCrypto but it's not wired. Build it as `api.fiat.sell.quote/execute`.
4. **AI tool execution audit log**: should every AI-triggered action be logged for the user to review? Mobile shows scheduled actions but not "AI made this trade" history.
5. **Localization**: Language picker has 12 locales but actual translations don't exist. Decide which to launch with.
6. **Card jurisdiction**: which countries can apply? Mobile shows generic "KYC L2 required" — region-gating isn't enforced client-side.
7. **NFT chain coverage**: gallery filters by ETH/POLYGON/BASE/SOL/ARB but the backend only needs to support what custody provider supports.
8. **P2P dispute flow**: mobile has "Open Dispute" button but no dispute resolution UI. Build the support handoff.
9. **AI streaming**: mobile waits for full response. Switch to SSE for better UX.
10. **Push notifications**: app references push delivery for alerts/orders/etc. — wire FCM/APNs.

---

## 10. Glossary & references

### Key files to bookmark

- [`src/api/endpoints.ts`](src/api/endpoints.ts) — endpoint catalog
- [`src/mock/db.ts`](src/mock/db.ts) — entity types + seed data
- [`src/mock/handlers.ts`](src/mock/handlers.ts) — reference implementation
- [`src/api/client.ts`](src/api/client.ts) — fetcher (mock vs real switch)
- [`src/routes.ts`](src/routes.ts) — route catalog
- [`AGENTS.md`](AGENTS.md) — architecture rules
- [`PROGRESS.md`](PROGRESS.md) — what's wired in each phase
- [`api-reference.md`](../api-reference.md) (sibling project) — existing CrymadX KYC API auth scheme reference

### Entity quick reference

| Entity | Where | Purpose |
|---|---|---|
| `User` | `src/api/endpoints.ts` | Profile + KYC level + tier |
| `Balance` | same | Per-asset crypto balance |
| `Transaction` | same | Deposit / withdrawal / swap / trade / reward / card-topup |
| `MarketPair` | same | Trading pair price + 24h stats |
| `Beneficiary` | `src/mock/db.ts` | Saved withdrawal addresses |
| `SavingsProduct/Position`, `StakingProduct/Position`, `AutoInvestPlan`, `VaultProduct` | same | Earn products + user positions |
| `TradingOrder`, `Trade` | same | Spot orders + fills |
| `FiatOrder` | same | Fiat purchase orders |
| `AIConversation`, `AIMessage`, `AIMemoryItem`, `AIScheduledAction`, `AITool`, `AIShare`, `AISettings` | same | AI feature data |
| `P2POffer`, `P2POrder`, `P2PMessage`, `P2PPaymentMethod` | same | P2P escrow flow |
| `CardSettings`, `CardTransaction` | same | Visa card |
| `NFT` | same | Owned + marketplace NFTs |
| `PriceAlert`, `APIKey`, `Session`, `LoginEvent`, `KYCSubmission`, `Badge`, `Referral`, `SupportArticle/Ticket/Message`, `Announcement`, `SystemIncident` | same | Phase 4 entities |

### Sample env

```bash
# .env (mobile)
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://api.crymadx.io/v2

# Optional in dev:
VITE_API_BASE_URL=http://localhost:8787/api/v2
```

### Switching back to mock

Just delete `.env` (or set `VITE_USE_MOCK=true`) and `npm run dev`. No code changes.

### Reset / seed

- Open `/debug` in the mobile app → "Reset Demo Data" wipes localStorage and reseeds mock DB.
- Or `localStorage.clear()` in DevTools.

---

## End

Questions, ambiguities, or shape mismatches → open a GitHub issue against this repo with the endpoint ID and the screen affected. The mock implementation is the canonical reference; if it disagrees with this doc, the **mock wins** (and please send a PR fixing the doc).

Good luck. The mobile app is fully clickable end-to-end against the mock — your job is to make every endpoint behave the same way against real data.

— *Architecture by Joseph Obasi (mobile) + you (backend). Built phase-by-phase, Apr 2026.*
