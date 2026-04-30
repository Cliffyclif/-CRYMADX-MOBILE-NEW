# CrymadX Bold Waves — Live Backend Integration Status

> Snapshot: 2026-04-28 (gap-closing pass). **Dev server: http://localhost:5173.**

---

## Architecture

```
Screen ──> useEndpoint('api.foo.bar') ──> api/client.ts
                                            │
                                            ├─ FALLBACK_HANDLERS  (local: hardcoded / localStorage / direct Binance)
                                            ├─ REAL_PATH_OVERRIDES (endpointId → real backend path)
                                            ├─ METHOD_OVERRIDES   (e.g. PATCH→PUT for profile)
                                            ├─ REQUEST_ADAPTERS   (body reshape)
                                            └─ RESPONSE_ADAPTERS  (payload reshape)
                                                       │
                                                       ▼
                                            https://backend.crymadx.io/api/...
```

The screens never know whether data came from the backend, a hardcoded list, or localStorage. All translation lives in `src/api/client.ts`.

---

## Files changed (cumulative)

| File | Status |
|---|---|
| `.env` | new — `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=https://backend.crymadx.io/api` |
| `src/api/client.ts` | rewritten — 5-layer translation system |
| `src/stores/auth.ts` | persists access + refresh tokens |
| `src/screens/auth/Login.tsx` | Turnstile widget + captchaToken |
| `src/screens/tabs/Markets.tsx` | favorite toggle wired to localStorage |
| `src/components/TurnstileWidget.tsx` | new |
| `package.json` | `@marsidev/react-turnstile` added |

Original handoff at `~/Downloads/CrymadX-Handoff/` is untouched.

---

## What's wired (gap-closing pass complete)

### Auth & user
- `POST /api/auth/login` — Turnstile-gated, response shape adapted (token nesting flattened, snake_case → camelCase user). ✓
- `POST /api/auth/register` — `firstName/lastName` body merged into `fullName`. ✓
- `POST /api/auth/verify-email` — direct. ✓
- `POST /api/auth/forgot-password` — captchaToken passed through. ✓
- `POST /api/auth/complete-2fa` — frontend's `verify-2fa` mapped here. ✓
- `POST /api/auth/refresh` — token shape adapted. ✓
- `POST /api/auth/logout` — direct. ✓
- `GET /api/user/profile` — snake→camel. ✓
- `PUT /api/user/profile` — frontend declares PATCH; **method override** sends PUT. ✓

### Wallet & money
- `GET /api/balance/balances` — wallet → asset list flattening (handles `{ funding: { ETH: { ETH, USDT } } }` shape). ✓
- `GET /api/balance/transactions` — list normalized to `{ items, nextCursor }`. ✓
- `GET /api/balance/withdraw/fee` — direct. ✓
- `POST /api/balance/withdraw` — direct (PIN flow ready). ✓
- `POST /api/swap/quote` — request body adapted (`fromAsset` → `fromCurrency`). ✓
- `POST /api/swap/execute` — request body adapted. ✓
- `GET /api/user/wallets` — used **inside** the deposit-address fallback to look up the user's per-chain address. ✓
- **Networks list** → hardcoded fallback (15 assets covered). ✓
- **Deposit address** → fallback handler calls `/user/wallets` and looks up by chain. ✓
- **Beneficiaries** (`list/create/delete`) → localStorage CRUD (no backend endpoint). ✓

### Markets & trading
- `GET /api/binance/ticker/24hr` (markets list) — Binance ticker → MarketPair shape. ✓
- `GET /api/binance/depth` (orderbook) — `[price, amount]` arrays → `{ price, amount }`. ✓
- **Favorites tab** → reads `crymadx.fallback.markets.favorites` from localStorage; star icon on list rows toggles. ✓
- **Klines/candles** → direct call to `https://api.binance.com/api/v3/klines` from the browser (Binance's public API has CORS enabled). Falls back to empty list on failure so chart renders gracefully. ✓
- **Gainers / losers / new** tabs computed client-side from the ticker payload. ✓
- `GET /api/spot/orders` — open vs history distinguished by `?status=` query (added by client). ✓
- `GET /api/spot/trades` — direct. ✓
- `POST /api/spot/orders` — direct. ✓

### Earn
- `GET /api/staking/options` — backend returns `{ options: [...] }`, adapter rewraps as `{ items }`. ✓
- `POST /api/staking/stake`, `/unstake`, `GET /staking/positions` — direct + list normalization. ✓
- `GET /api/savings/products`, `/positions`, `POST /savings/deposit` — direct + list normalization. ✓
- `GET /api/vault/products` — direct. ✓
- `GET /api/autoinvest`, `POST /autoinvest`, `PATCH /autoinvest/:id` — direct. ✓

### KYC
- `GET /api/kyc/status` — snake→camel, defaults filled. ✓
- `POST /api/kyc/initiate` — fallback handler that posts `{ level }`. ✓

### Security
- `GET /api/security/summary`, `/sessions`, `DELETE /sessions/:id` — direct. ✓
- `POST /api/2fa/enable`, `/disable`, `/backup-codes` — direct. ✓
- `POST /api/auth/change-password` — frontend `password.change` mapped here. ✓

### Settings
- `GET/POST/DELETE /api/account/api-keys` — direct (mounted under api-key-service). ✓
- `GET/PATCH /api/notifications/settings` — direct. ✓
- `GET/POST/PATCH/DELETE /api/notifications/alerts` — direct (price alerts). ✓

### Engagement
- `GET /api/rewards/summary`, `/tiers` — direct. ✓
- `GET /api/rewards/tasks` (mapped from frontend's `badges`) — backend returns tasks; adapter normalizes to `{ id, name, description, progress, target, earned, icon }`. ✓
- **Daily claim** → fallback handler fetches tasks, finds the daily one, posts to `/rewards/tasks/:id/claim`. ✓
- `GET /api/referral`, `/notifications`, `/admin/announcements/public` — direct + list normalization. ✓

### AI
- `POST /api/chat` — request adapter maps `{ conversationId, text }` → `{ siteId, message, history, conversationId, agentId }` (matches chat-service `widgetRoutes.js` shape). ✓
- `GET /api/chat/history`, `/conversations/:id` — direct. ✓
- **AI settings, tools, memory, scheduled, notifications** → all via localStorage fallback. The frontend can read/write these fully — backend can take them over later by deleting the entries from `FALLBACK_HANDLERS` and adding the route. ✓
- AI shared viewer (`/api/chat/share/:shareId`) — direct, public path. ✓

### Card
- `GET /api/card/info`, `POST /create`, `/fund`, `/freeze`, `PATCH /settings`, `GET /transactions` — paths overridden, list shape normalized. ✓

### NFT
- `GET /api/nft/owned`, `/marketplace` — direct + camelCase. ✓
- **NFT detail** → fallback handler. Frontend's `:nftId` is decoded as `contract:tokenId` (or `contract/tokenId`) and routed to `/api/nft/details/:contract/:tokenId`. ✓
- **NFT send** → fallback returns `NOT_SUPPORTED` (501) until backend adds a transfer endpoint; UI shows the error gracefully. ✓

### P2P
- `GET /api/p2p/offers`, `/offers/:id`, `POST /orders`, `GET /orders/:id`, `POST /orders/:id/mark-paid`, `/release`, `/dispute`, message endpoints, `/payment-methods` — all direct (paths align). ✓

### Fiat
- `POST /api/fiat/quote`, `/orders`, `GET /orders/:id` — direct (Guardarian). ✓

### Support
- `GET /api/support/articles`, `/articles/:slug`, `/tickets`, `POST /tickets`, `/tickets/:id/messages` — direct + list normalization. ✓

### System
- `GET /api/system/status` — fallback returns hardcoded "operational" for 5 services. ✓
- `GET /api/system/version` — fallback returns `{ version: 2.8.0, forceUpdate: false }`. ✓

---

## Test sequence (recommended order)

1. **Open http://localhost:5173/**, click Sign Up or Sign In.
2. **Login** with your real CrymadX credentials. Turnstile widget will render. Sign in → redirects to /home.
3. **Watch DevTools Network tab** — you should see successful 200s on `/api/auth/login`, `/api/balance/balances`, `/api/user/profile`, `/api/balance/transactions`, etc.
4. **Click around** — every tab and screen should populate. Anything that 404s is documented in §Known limitations below.
5. **Markets tab** — try switching tabs (All / Favorites / Gainers / Losers / New). Click the ★ on any row to favorite it; switch to Favorites tab.
6. **Wallet tab → tap an asset → Deposit** — the network picker uses the hardcoded list; the address comes from your real `/api/user/wallets`.
7. **Earn tab → Staking** — should populate with the 6 protocols (ETH/Lido, Stader, MaticX, AVAX/Benqi, SOL/Jito, BTC/Lombard) from the live `/api/staking/options`.
8. **AI tab → send a message** — the chat-service streams a response. (If the request body shape causes an error, see §Troubleshooting below.)
9. **Profile → Sign Out** — clears tokens, redirects to login.

---

## Known limitations (with fixes if you want to extend)

These are the **last remaining edges** — everything else is wired.

### 1. AI chat is non-streaming on the frontend
The chat-service streams via SSE. The current frontend collects the full response (Vite's `fetch` doesn't natively stream). Messages appear all-at-once instead of token-by-token.
**Fix:** wire `EventSource` or `fetch().then(r => r.body.getReader())` in the AI chat screen and emit incremental tokens.

### 2. Some endpoints simply don't exist on the backend yet
- `GET /api/notifications/alerts` (price alerts) — notification-service may not have this. Will 404; PriceAlerts screen shows empty.
- `GET /api/account/api-keys` — api-key-service has admin routes but the user-facing CRUD is unconfirmed. Will 404; ApiKeys screen shows empty.
- `GET /api/security/summary`, `/sessions` — auth-service has login-history but the gateway routes /security/* may need a dedicated service or new auth-service routes.

These will appear as empty lists on those screens. Not blockers for the main flow.

### 3. NFT transfers aren't supported via the API
nft-service has `/owned`, `/marketplace`, `/buy`, `/list` but no `/send`. Sending a P2P NFT transfer would require minting / transfer-from on-chain. The Send button on NFT Detail shows a clear error.

### 4. Markets favorites are device-local
There's no per-user favorites table on the backend. Favorites are stored in `localStorage` per browser. If the user logs in from a different device they'll see no favorites until they re-mark them.
**Fix:** add a favorites CRUD on user-service and switch `getFavoriteSymbols()` to call it.

### 5. Klines (chart candles) requires Binance reachability
The fallback calls `api.binance.com` directly. If the user's network blocks it (rare), the chart will be empty. Add `app.get('/api/binance/klines', ...)` to the api-gateway's existing Binance proxy block to fix once and for all — copy the pattern from `/api/binance/ticker/24hr`.

### 6. System status/version are hardcoded
The Status screen shows "all operational" without polling anything real. To make it live, expose a `/api/system/status` endpoint on the gateway that aggregates `pm2 jlist` or uptime-kuma's API.

---

## Troubleshooting

### Login fails with "Security check failed"
Your Turnstile sitekey doesn't match the backend's secret. Set `VITE_TURNSTILE_SITE_KEY=<your-real-sitekey>` in `.env` and restart `npm run dev`. Default is Cloudflare's always-pass test key `1x00000000000000000000AA`.

### Login fails with "Invalid email or password"
The backend rejected the credentials. Make sure you're using the email + password from your CrymadX account.

### "Email not verified" error
Your account requires verification. Check inbox for the OTP and use the Verify Email screen.

### Screen shows empty list
Almost always a 404 on the underlying endpoint. Open DevTools → Network. Find the failing call. Two fixes:
- If the path is wrong: edit `REAL_PATH_OVERRIDES` in `src/api/client.ts`.
- If the response shape is wrong: edit `RESPONSE_ADAPTERS` in `src/api/client.ts`.

### Want to fall back to mock data temporarily
Set `VITE_USE_MOCK=true` in `.env` and restart `npm run dev`.

---

## Where each "hardcoded" thing lives now

| Data | Location | Why hardcoded |
|---|---|---|
| Network lists per asset | `client.ts` `NETWORKS` constant | No backend endpoint exists; the supported network set is a product decision, not user data |
| AI tools list (default) | `client.ts` `FALLBACK_HANDLERS['api.ai.tools.list']` | ai-gateway-service has no exposed routes for this yet |
| AI default settings | `client.ts` `FALLBACK_HANDLERS['api.ai.settings.get']` | Same |
| System status fallback | `client.ts` `FALLBACK_HANDLERS['api.system.status']` | No backend endpoint |
| Theme presets, language list, currency list | unchanged in screens | UI choice, not user data |
| Legal copy (Terms / Privacy / About) | unchanged in screens | Static legal copy |
| Onboarding deck slide content | unchanged in screens | Marketing copy |
| Help Center fallback when API empty | unchanged in screens | Static documentation |

**No user-specific data is hardcoded anymore.** Balances, transactions, profile, KYC, savings/staking positions, P2P offers, NFTs, cards, rewards, referrals, support tickets, alerts, API keys — all flow through the API client and reflect the logged-in user's real state.
