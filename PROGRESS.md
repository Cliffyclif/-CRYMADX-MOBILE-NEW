# PROGRESS.md

> Phase log + per-screen checklist. Update as you build. **One source of truth for what's wired and what isn't.**

## Phase 1 — Architecture + core flows (DONE · commit 0c671df)

**Goal**: Scaffolding, registries, mock layer, ~15 screens. Boss reviews architecture before phase 2.

### Architecture
- [x] Vite + React 19 + TS scaffold
- [x] Deps installed: react-router-dom, @tanstack/react-query, zustand
- [x] AGENTS.md (durable architecture doc)
- [x] PROGRESS.md (this file)
- [x] BACKEND.md (auto-derivable from registries)
- [x] Bold Waves global CSS (`src/styles/bold-waves.css`) lifted from canvas
- [x] Routes registry (`src/routes.ts`)
- [x] Endpoints registry (`src/api/endpoints.ts`)
- [x] Mock DB + seed (`src/mock/db.ts`)
- [x] Mock handlers (`src/mock/handlers.ts`)
- [x] API client with mock/real toggle (`src/api/client.ts`)
- [x] React Query hooks (`src/api/hooks.ts`)
- [x] Auth store (`src/stores/auth.ts`)
- [x] Theme store (`src/stores/theme.ts`)
- [x] PhoneShell + BottomNav components
- [x] ProtectedRoute with `?nav=all` bypass
- [x] Smoke check script (`npm run check`)

### Phase 1 screens (15 / 15)
- [x] Splash
- [x] Login
- [x] Register
- [x] Verify Email
- [x] Home (tab root)
- [x] Markets (tab root)
- [x] AI Chat (tab root, basic — full AI features in phase 3)
- [x] Wallet (tab root)
- [x] Profile (tab root)
- [x] Deposit Chain Picker
- [x] Deposit (QR view)
- [x] Withdraw
- [x] Withdraw Confirm
- [x] Tx History
- [x] Tx Detail

### Verification
- [x] `npm run check` (typecheck) passes
- [x] `npm run build` produces clean dist
- [x] `npm run dev` boots, all routes 200
- [x] Logos serve from public/

---

## Phase 2 — Wallet + Trading + Earn + Fiat (DONE)

### Screens (20 / 20)
- [x] Convert
- [x] Convert Confirm
- [x] Asset Detail
- [x] Beneficiaries
- [x] Spot Trading
- [x] Order Confirm
- [x] Activity (open orders + history + trade history tabs)
- [x] Trade Detail
- [x] Earn Hub
- [x] Savings
- [x] Savings Detail (with reward calculator)
- [x] Savings Deposit
- [x] Staking (with stake form + positions)
- [x] Unstake
- [x] Auto-Invest (with new plan form)
- [x] Vault
- [x] Buy Crypto (Fiat)
- [x] Order Confirm (Fiat)
- [x] Guardarian webview (mock — auto-progresses to status after 3.5s)
- [x] Order Status (Fiat) — auto-completes via polling

### DB additions (phase 2)
- savingsProducts (10 entries)
- savingsPositions (3 active)
- stakingProducts (6 protocols)
- stakingPositions (1 active)
- autoInvestPlans (2 active)
- vaultProducts (5 strategies)
- tradingOrders (5 — mix of open/filled/cancelled)
- trades (3 fills)
- fiatOrders (1 historical)

### Mock handler additions
- api.wallet.convert.{quote, execute}
- api.markets.{pair, candles, orderbook}
- api.beneficiaries.{list, create, delete}
- api.trading.{order.create, order.cancel, orders.open, orders.history, trades, trade}
- api.earn.savings.{products, positions, deposit}
- api.earn.staking.{products, positions, stake, unstake}
- api.earn.autoinvest.{list, create, update}
- api.earn.vault.list
- api.fiat.{quote, order.create, order.status}

Storage key bumped to `crymadx.mock.db.v2` so existing localStorage gets reseeded with the new entities.

---

## Phase 3 — AI suite + P2P + Card + NFT (DONE)

### Screens (28 / 28)
- [x] AI Voice Mode (multi-layer orb cycling listening/thinking/speaking states)
- [x] AI Chat History (grouped by today/yesterday/earlier, pinned/archived tabs)
- [x] AI Conversation Detail (read-only with continue + share)
- [x] AI Settings (model, streaming toggle, autonomy threshold, sub-page nav)
- [x] AI Voice Settings (voice picker, speed slider, push-to-talk, wake word)
- [x] AI Tools Permissions (read/write split, per-tool toggle + PIN threshold badges)
- [x] AI Memory (categorized items with delete + clear all)
- [x] AI Scheduled Actions (active/paused/cancelled/completed tabs)
- [x] AI Action Detail (conditions + execution history)
- [x] AI Share (auto-creates share link with copy + revoke)
- [x] AI Shared Viewer (PUBLIC route — no auth gate, conversation read-only)
- [x] AI PIN Settings (TTL slider 5min-24h, per-action toggles)
- [x] AI Onboarding (full-bleed AI logo intro)
- [x] AI Notifications (triggered/failed/reminders tabs)
- [x] P2P Marketplace (offers list with seller cards, asset/payment filters)
- [x] P2P Offer Detail (rep + payment methods + amount picker)
- [x] P2P Order (live countdown timer, payment instructions, mark-paid + dispute)
- [x] P2P Chat (in-order chat with own/other bubbles)
- [x] P2P Payment Methods (verified/pending lists + add grid)
- [x] Card Hub (CardFace component, balance, recent spend, quick actions)
- [x] Card Top-Up (amount + source asset picker + summary)
- [x] Card Settings (limits with bars, security toggles, region locks)
- [x] Card Transactions (filter by status)
- [x] Card Onboarding (apply CTA — auto-redirects to Hub on Card existing)
- [x] NFT Gallery (grid, chain filter, total floor)
- [x] NFT Marketplace (trending list + featured drops grid)
- [x] NFT Detail (image, traits with rarity, contract details, buy/send buttons)
- [x] NFT Send (recipient form, gas estimate, irreversible warning, PIN button)

### DB additions (phase 3)
- aiConversations (8) + aiMessages (4 seed for one chat)
- aiMemoryItems (6 categorized), aiScheduledActions (4 active), aiTools (9), aiShares (1), aiSettings (1 record)
- p2pOffers (5 sellers), p2pOrders (1 active), p2pMessages (3 seed), p2pPaymentMethods (4: 3 verified + 1 pending)
- cards (1 active card with limits, regions, cashback) + cardTransactions (8 — mix approved/declined/topup)
- nfts (8: 4 owned, 4 marketplace) with traits

### Mock handler additions (29)
AI: chat.history, chat.conversation, chat.send, settings.get/update, tools.list/update, memory.list/delete/clear, scheduled.list/detail/cancel, share.create/get/revoke, notifications
P2P: offers.list, offer.get, order.create/get/markpaid/dispute, chat.send/list, payments.list
Card: card.get/apply/topup/freeze/settings.update/transactions
NFT: nft.gallery/market/detail/send

Storage key bumped to `crymadx.mock.db.v3` for clean reseed.

---

## Phase 4 — Security + KYC + Settings + Engagement + Support + Legal (DONE)

### Screens (45 / 45) — full canvas now wired
- [x] Onboarding deck (single screen, 9-step state machine)
- [x] Complete Profile
- [x] Login 2FA
- [x] Forgot Password
- [x] Reset Password
- [x] Biometric Setup
- [x] Security Hub
- [x] 2FA Setup (QR + verify)
- [x] Backup Codes (auto-generates fresh codes)
- [x] Change Password
- [x] Change PIN (3-step keypad flow)
- [x] Sessions (active / history / devices tabs)
- [x] KYC Status (level cards + benefits)
- [x] KYC Flow (Gokuvision-themed selfie step)
- [x] KYC Pending (live polling, eta countdown)
- [x] KYC Level Info
- [x] Notifications settings (channels + categories)
- [x] Theme (mode + accent color picker)
- [x] Language (12 languages)
- [x] Currency (popular + all)
- [x] Price Alerts (active / paused with toggle)
- [x] Price Alert Edit (form with persisted submit)
- [x] Developer
- [x] API Keys (list with usage + status badges)
- [x] API Key Detail (reveal secret, scopes, IP allowlist, revoke)
- [x] Ecosystem
- [x] Rewards Hub (XP, badges, daily quests)
- [x] Tier Detail
- [x] Referral (code + verified/pending invitees)
- [x] Notifications feed (channel filters, mark all read)
- [x] Announcements (pinned + list)
- [x] Help Center (search + 8 topic tiles + popular articles)
- [x] Article (markdown-rendered body, helpful CTA)
- [x] Tickets (open / closed / all tabs)
- [x] Ticket Detail (chat + reply + meta order info)
- [x] Contact (new ticket form, attachments, priority)
- [x] Terms (full legal sections)
- [x] Privacy (full sections)
- [x] About (logo, version, social, legal links)
- [x] Status (live system status with services + incidents)
- [x] Scan QR (camera UI overlay with corner brackets)
- [x] Asset Selector (sheet)
- [x] Pair Selector (sheet)
- [x] Debug Menu (env, tools, Reset Demo Data button)
- [x] Offline state
- [x] Force Update state

### DB additions (phase 4)
- priceAlerts (8 alerts)
- apiKeys (3 keys: Production live, Sandbox test, Tax Bot expiring)
- sessions (3 active) + loginHistory (4 events)
- kycSubmissions (verified L2 with steps)
- badges (4 earned + 3 available with progress)
- referrals (3 verified + 2 pending)
- supportArticles (6 covering security/wallet/kyc/card/trading)
- supportTickets (5 with one open thread)
- supportTicketMessages (4-message thread on TKT-8421)
- announcements (7 with one pinned)
- systemIncidents (3)

### Mock handler additions (35+)
- auth.complete-profile, verify-2fa, forgot-password, reset-password
- user.kyc.status/start, profile.update
- security.summary, 2fa.enable/disable, backup-codes, password.change, pin.change, sessions.list/revoke
- settings.notifications.get/update, alerts.list/create/update/delete, api-keys.list/create/delete
- rewards.summary, badges, tiers, claim-daily; referral.summary; notifications.list/read; announcements.list
- support.articles, article, tickets.list/create/detail/reply

Storage key bumped to `crymadx.mock.db.v4` for clean reseed.

---

## Notes

- Total target: 118 screens (matches the canvas).
- "Onboarding 1-9" maps to the 9 expanded slides on the canvas.
- Sheets (Asset Selector, Pair Selector) are bottom-sheet overlays, not full routes.
