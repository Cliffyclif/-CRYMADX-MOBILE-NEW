# CrymadX Bold Waves — Integration Audit

> Side-by-side comparison of mobile screens ↔ website services.
> All endpoints below were extracted from `src/services/*.ts` in the production
> website (the source of truth) and aligned in `crymadx-bold-waves/src/api/client.ts`.

## Critical fix shipped this pass: transaction type normalization

**Problem**: Mobile was filtering by `tx.type === 'withdrawal'` and `'swap'`. Production normalizes these to `'withdraw'` and `'convert'`. Result: deposit/withdraw screens showed empty "Recent transactions" sections even when transactions existed.

**Fix**: Mirrored production logic from `src/screens/wallet/HistoryScreen.tsx` verbatim:
```ts
if (ty === 'swap' || ty === 'conversion') ty = 'convert'
if (ty === 'withdrawal') ty = 'withdraw'
if (ty === 'internal_transfer' || ty === 'internal') ty = 'convert'
```

Also extracted `assetTo` / `amountTo` fields for converts (so "BTC → USDT" can be shown), and the screens that filter by type now use `'withdraw'` / `'convert'` to match.

| Screen | Was filtering | Now filtering |
|---|---|---|
| Home.tsx Recent Activity | `'withdrawal'` | `'withdraw'` |
| Home.tsx isSwap | `'swap'` | `'convert'` |
| TxHistory tabs | `'withdrawal'`, `'swap'` | `'withdraw'`, `'convert'` |
| Withdraw.tsx Recent | `'withdrawal'` | `'withdraw'` |
| TxDetail.tsx | `'withdrawal'` | `'withdraw'` |
| AssetDetail.tsx | `'withdrawal'` | `'withdraw'` |
| Mock data | `'withdrawal'` / `'swap'` | `'withdraw'` / `'convert'` |

---

## Other major paths/shapes fixed in this pass

### Swap (Convert)
- Was: `/api/swap/quote` and `/api/swap/execute` — these don't exist
- Now: `/api/swap/estimate` (POST) and `/api/swap/create` (POST), matching `swapService.ts`
- Body shape: `{ fromChain, fromToken, toChain, toToken, amount, destinationAddress?, rateId? }` (NOT `{ fromAsset, toAsset, fromAmount }`)
- `destinationAddress` is REQUIRED for create — converted `api.wallet.convert.execute` to a fallback handler that auto-resolves the user's wallet for the to-chain via `/api/user/wallets` (with EVM-shared-ETH alias logic, just like `depositService.ts`)
- Response adapter maps `estimatedAmount → toAmount`

### P2P (Bybit/Binance terminology vs production terminology)
- Mobile uses "offer" = listing, "order" = trade
- Production uses "order" = listing, "trade" = trade
- Path overrides translate:
  - `api.p2p.offers.list` → `/p2p/orders`
  - `api.p2p.offer.get` → `/p2p/orders/:offerId`
  - `api.p2p.order.create` → `/p2p/trades`
  - `api.p2p.order.markpaid` → `/p2p/trades/:orderId/confirm-payment`
  - `api.p2p.order.release` → `/p2p/trades/:orderId/release`

---

## Endpoint alignment table (post-audit)

| Mobile id | Production path | Service file |
|---|---|---|
| `api.auth.login` | `POST /api/auth/login` | authService.ts |
| `api.auth.register` | `POST /api/auth/register` | authService.ts |
| `api.auth.verify-email` | `POST /api/auth/verify-email` | authService.ts |
| `api.auth.complete-profile` | `POST /api/auth/complete-profile` | authService.ts |
| `api.auth.verify-2fa` | `POST /api/auth/complete-2fa` | authService.ts |
| `api.auth.forgot-password` | `POST /api/auth/forgot-password` | authService.ts |
| `api.auth.refresh` | `POST /api/auth/refresh` | api.ts |
| `api.auth.logout` | `POST /api/auth/logout` | authService.ts |
| `api.user.profile.get` | `GET /api/user/profile` | userService.ts |
| `api.user.profile.update` | **PUT** `/api/user/profile` | userService.ts |
| `api.user.kyc.status` | `GET /api/kyc/status` | kycService.ts |
| `api.user.kyc.start` | `POST /api/kyc/initiate` | kycService.ts |
| `api.wallet.balances.list` | `GET /api/balance/balances` (composite + /api/prices) | balanceService.ts |
| `api.wallet.balance.get` | `GET /api/balance/balances/:asset` | balanceService.ts |
| `api.wallet.networks.list` | hardcoded (no backend equivalent) | — |
| `api.wallet.deposit.address` | `GET /api/user/wallets` (lookup by chain w/ EVM aliases) | walletService.ts, depositService.ts |
| `api.wallet.withdraw.fee` | `GET /api/balance/withdraw/fee?chain=&amount=&token=` | withdrawalService.ts |
| `api.wallet.withdraw.create` | `POST /api/balance/withdraw` | withdrawalService.ts |
| `api.wallet.convert.quote` | `POST /api/swap/estimate` | swapService.ts |
| `api.wallet.convert.execute` | `POST /api/swap/create` (fallback resolves destinationAddress) | swapService.ts |
| `api.tx.list` | `GET /api/balance/transactions` (response: `{transactions, total}`) | balanceService.ts |
| `api.tx.get` | `GET /api/balance/transactions/:txId` | balanceService.ts |
| `api.markets.list` | `GET /api/binance/ticker/24hr` | api-gateway proxy |
| `api.markets.candles` | direct `https://api.binance.com/api/v3/klines` | (browser-direct) |
| `api.markets.orderbook` | `GET /api/binance/depth` | api-gateway proxy |
| `api.fiat.quote` | `POST /api/fiat/buy/estimate` (snake_case body) | fiatService.ts |
| `api.fiat.order.create` | `POST /api/fiat/buy/create` (snake_case body) | fiatService.ts |
| `api.fiat.order.status` | `GET /api/fiat/order/:orderId` | fiatService.ts |
| `api.earn.staking.products` | `GET /api/staking/options` (response: `{options}`) | stakingService.ts |
| `api.earn.staking.positions` | `GET /api/staking/positions` | stakingService.ts |
| `api.earn.staking.stake` | `POST /api/staking/stake` | stakingService.ts |
| `api.earn.staking.unstake` | `POST /api/staking/unstake` | stakingService.ts |
| `api.earn.savings.deposit` | `POST /api/vault/create` | savingsService.ts (vault-only) |
| `api.earn.savings.positions` | `GET /api/vault/positions` | savingsService.ts |
| `api.earn.vault.list` | `GET /api/vault/positions` | vaultService.ts |
| `api.earn.autoinvest.list` | `GET /api/autoinvest/plans` (response: `{plans}`) | autoInvestService.ts |
| `api.earn.autoinvest.create` | `POST /api/autoinvest/plans` | autoInvestService.ts |
| `api.earn.autoinvest.update` | `PATCH /api/autoinvest/plans/:id` | autoInvestService.ts |
| `api.p2p.offers.list` | `GET /api/p2p/orders` | p2pService.ts |
| `api.p2p.offer.get` | `GET /api/p2p/orders/:offerId` | p2pService.ts |
| `api.p2p.order.create` | `POST /api/p2p/trades` | p2pService.ts |
| `api.p2p.order.get` | `GET /api/p2p/trades/:orderId` | p2pService.ts |
| `api.p2p.order.markpaid` | `POST /api/p2p/trades/:orderId/confirm-payment` | p2pService.ts |
| `api.p2p.order.release` | `POST /api/p2p/trades/:orderId/release` | p2pService.ts |
| `api.card.get` | `GET /api/card/info` | cardService.ts |
| `api.card.apply` | `POST /api/card/create` | cardService.ts |
| `api.card.topup` | `POST /api/card/fund` | cardService.ts |
| `api.card.freeze` | `POST /api/card/freeze` | cardService.ts |
| `api.card.transactions` | `GET /api/card/transactions?page=&limit=` | cardService.ts |
| `api.nft.gallery` | `GET /api/nft/owned?chain=` | nftService.ts |
| `api.nft.market` | `GET /api/nft/marketplace` | nftService.ts |
| `api.nft.detail` | `GET /api/nft/details/:contract/:tokenId` (fallback parses `nftId`) | nftService.ts |
| `api.nft.send` | not exposed on backend | — |
| `api.ai.chat.send` | `POST /api/ai/web/conversations/:id/messages` (SSE) | aiChatService.ts |
| `api.ai.chat.history` | `GET /api/ai/web/conversations?archived=false&true` (parallel) | aiChatService.ts |
| `api.ai.chat.conversation` | `GET /api/ai/web/conversations/:id` | aiChatService.ts |
| `api.ai.share.create` | `POST /api/ai/web/conversations/:id/share` | aiChatService.ts |
| `api.ai.share.get` | `GET /api/ai/web-public/shares/:shareId` (public) | aiChatService.ts |
| `api.security.password.change` | `POST /api/auth/change-password` | authService.ts |
| `api.security.sessions.list` | `GET /api/user/sessions` | userService.ts |
| `api.security.sessions.revoke` | `DELETE /api/user/sessions/:id` | userService.ts |
| `api.security.2fa.enable/disable` | `POST /api/2fa/enable` / `disable` | (2fa-service) |
| `api.settings.api-keys.list` | `GET /api/user/api-keys` | apiKeyService.ts |
| `api.settings.api-keys.create` | `POST /api/user/api-keys` | apiKeyService.ts |
| `api.settings.api-keys.delete` | `DELETE /api/user/api-keys/:keyId` | apiKeyService.ts |
| `api.notifications.list` | `GET /api/notifications` | notificationService.ts |
| `api.notifications.read` | **PATCH** `/api/notifications/read-all` | notificationService.ts |
| `api.rewards.summary` | `GET /api/rewards/summary` | rewardsService.ts |
| `api.rewards.tiers` | `GET /api/rewards/tiers` | rewardsService.ts |
| `api.referral.summary` | `GET /api/referral/info` (public) | referralService.ts |
| `api.support.tickets.list` | `GET /api/support/tickets` | supportService.ts |
| `api.support.tickets.create` | `POST /api/support/tickets` | supportService.ts |
| `api.support.tickets.detail` | `GET /api/support/tickets/:id` | supportService.ts |
| `api.support.tickets.reply` | `POST /api/support/tickets/:id/reply` (NOT `/messages`) | supportService.ts |
| `api.prices.list` | `GET /api/prices?vs=USD` | priceService.ts |

---

## Mobile screen → website screen map

| Mobile screen | Website equivalent | Wired? |
|---|---|---|
| tabs/Home | dashboard/DashboardScreen, home/HomeScreen | ✅ |
| tabs/Markets | markets/MarketsScreen | ✅ |
| tabs/AIChat | ai-chat/AIChatScreen + components/* (SSE + tool widgets) | ✅ |
| tabs/Wallet | wallet/WalletScreen | ✅ |
| tabs/Profile | profile/ProfileScreen | ✅ |
| auth/* | auth/LoginScreen + RegisterScreen + ForgotPasswordScreen + ResetPasswordScreen + VerifyEmailScreen + CompleteProfileScreen | ✅ |
| wallet/Deposit, DepositPick | wallet/DepositScreen | ✅ |
| wallet/Withdraw, WithdrawConfirm | wallet/WithdrawScreen | ✅ (PIN→OTP UX upgrade pending) |
| wallet/Convert, ConvertConfirm | wallet/ConvertScreen | ✅ destinationAddress auto-resolved |
| wallet/AssetDetail, TxHistory, TxDetail | wallet/HistoryScreen | ✅ tx normalization fixed |
| trading/SpotTrading, OrderConfirm, Activity, TradeDetail | trading/TradingScreen | ⚠️ partial |
| earn/EarnHub, Savings, SavingsDetail, SavingsDeposit, Vault | earn/SavingsVaultScreen, VaultScreen | ✅ via /api/vault/* |
| earn/Staking, Unstake | earn/StakingScreen | ✅ |
| earn/AutoInvest | earn/AutoInvestScreen | ✅ |
| fiat/* | fiat/FiatScreen | ✅ snake_case body |
| ai/* | ai-chat/AIChatScreen + components/* | ✅ history + tool widgets ported |
| p2p/* | p2p/P2PScreen, PaymentMethodsScreen | ✅ orders↔trades terminology aligned |
| card/* | card/CardScreen, CardSettingsScreen, CardTransactionsScreen | ✅ |
| nft/* | nft/NFTScreen, NFTMarketplaceScreen | ✅ detail uses :contract/:tokenId |
| security/*, kyc/* | security/TwoFactorScreen, KYCScreen | ✅ |
| settings/ApiKeys/ApiKeyDetail | dashboard/ApiKeysScreen | ✅ /user/api-keys |
| engage/Rewards, TierDetail, Referral, Notifications, Announcements | rewards/RewardsScreen, referral/ReferralScreen | ✅ |
| support/* | public/HelpCenterScreen, tickets/TicketsScreen | ✅ /reply endpoint aligned |
| legal/* | legal/* + public/StatusPage | ✅ static |
| misc/* | (mobile-only sheets + new Services launcher) | ✅ |

---

## Things that intentionally differ (mobile-specific UX)

- **AssetPicker** — bottom-sheet picker with search + balance-priority sorting
- **Services launcher** — mobile-only "All Services" page (Bybit-style)
- **5-tile quick-access row** on Home
- **Recent activity sections** on Deposit/Withdraw (the website has a separate History tab)
- **MarkdownBlock + ToolResultWidgets** — ported verbatim from website chat components but restyled for the dark mobile theme
- **PriceWidget chart** — uses production `/api/ai/web/chart/:symbol?days=N` endpoint and renders inline SVG sparkline with 7d/30d/90d range tabs
- **PortfolioWidget** — adds stacked allocation bar + per-asset USD bars (more compact than the website table)

---

## Known gaps (production endpoints don't exist or differ)

| Mobile feature | Status | Why |
|---|---|---|
| `/wallet/networks/:asset` | hardcoded fallback | No backend networks-per-asset endpoint exists |
| `/markets/candles` | direct `api.binance.com/v3/klines` | api-gateway proxies ticker/depth but not klines |
| `/system/status`, `/version` | hardcoded | No backend equivalent |
| `/beneficiaries` | localStorage CRUD | No backend equivalent |
| `/ai/settings`, `/ai/tools`, `/ai/memory`, `/ai/scheduled`, `/ai/notifications` | localStorage fallback | These map to `/ai/web/prefs` and `/ai/web/memory` only — others have no production routes |
| Markets favorites | localStorage | No per-user favorites table |
| Withdraw OTP flow | PIN field maps to verificationToken | Mobile UI doesn't yet collect email OTP separately |
| `/nft/:id/send` | NOT_SUPPORTED | nft-service has no transfer endpoint |
| `/admin/announcements/public` | direct call | mounted on admin-service |

---

## Files changed in this audit pass

- `src/api/client.ts` — endpoint paths, method/request/response adapters, fallback handlers
- `src/api/endpoints.ts` — `Transaction.type` union: `deposit | withdraw | convert | stake | unstake | reward | trade | card-topup`. Added `assetTo`, `amountTo` for converts.
- `src/screens/tabs/Home.tsx` — uses `'withdraw'` / `'convert'`
- `src/screens/wallet/{Withdraw, TxHistory, TxDetail, AssetDetail}.tsx` — type filters use `'withdraw'`
- `src/screens/tabs/AIChat.tsx` — SSE event handlers, MarkdownBlock + ToolResultWidget, parallel history fetch
- `src/components/MarkdownBlock.tsx` — ported from website
- `src/components/ToolResultWidgets.tsx` — ported (DepositAddress with QR, Balance, Portfolio with allocation bars, Price with sparkline + range tabs)
- `src/components/AssetPicker.tsx` — mobile bottom-sheet picker
- `src/components/ServicesGrid.tsx` — 5-tile launcher
- `src/screens/misc/Services.tsx` — full Services launcher
- `src/mock/{db,handlers}.ts` — `'withdrawal'` → `'withdraw'`, `'swap'` → `'convert'`
