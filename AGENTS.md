# AGENTS.md — CrymadX Mobile App

> **Read this first.** It is the durable contract for how this app is built. Any future agent (Claude or human) picks up here. Update this file when architecture changes.

## What this is

The CrymadX mobile app, brought to life from the Bold Waves design canvas at `../crymadx-bold-waves.html` (also live at `https://myfxpaddy.github.io/crymadx-bold-waves/`). 118 screens, dark + light, Outfit font, organic wave decorations, gradient CTAs.

This is a **standalone mobile-first PWA** running React + TS + Vite. Eventually wraps with Capacitor for iOS / Android. For now: web only.

## Goals

1. **Visual fidelity** — pixel-match the Bold Waves canvas. Same colors, gradients, spacing, animations.
2. **Backend-swap-friendly** — every API call and every placeholder data point has a stable ID. The backend dev replaces the mock layer in one step (`VITE_USE_MOCK=false`) without touching screen code.
3. **Navigable demo** — boss/stakeholders can run `npm run dev`, hit the URL, and click through every flow. State persists across reloads.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Bundler | Vite 8 |
| Routing | React Router v7 (MemoryRouter — Capacitor-safe) |
| Server state | TanStack Query (React Query v5) |
| Client state | Zustand |
| Styling | Global CSS (Bold Waves stylesheet, lifted verbatim from canvas) + inline `style=` for one-offs |
| Persistence | localStorage (mock DB, auth, theme) |
| Mock layer | Custom in-process handlers (no MSW — simpler) |

## File layout

```
src/
├── main.tsx                  Bootstrap
├── App.tsx                   Router + providers
├── routes.ts                 ROUTE REGISTRY — every screen path lives here, keyed
├── api/
│   ├── endpoints.ts          ENDPOINT REGISTRY — every API call defined once, keyed
│   ├── client.ts             Single fetcher: mock or real, env-flagged
│   └── hooks.ts              useEndpoint() React Query hook
├── mock/
│   ├── db.ts                 The fake DB — single source of truth for placeholder data
│   ├── handlers.ts           Implements every endpoint against db.ts
│   └── seed.ts               Initial seed values
├── stores/
│   ├── auth.ts               Zustand: user, session, logout
│   └── theme.ts              Zustand: theme, language, currency
├── components/
│   ├── PhoneShell.tsx        Centered phone-like container on desktop, full-bleed on mobile
│   ├── BottomNav.tsx         Tab bar with raised AI center button
│   ├── ScreenHeader.tsx      Common back-arrow + title header
│   └── ...                   Shared primitives
├── screens/
│   ├── auth/
│   ├── tabs/                 Tab root screens
│   ├── wallet/
│   ├── ai/
│   └── ...                   One folder per section from the canvas
└── styles/
    ├── bold-waves.css        Lifted verbatim from canvas
    └── reset.css

public/
├── crymadx-mark.png          Shield-only logo
├── crymadx-full.png          Wordmark lockup
├── crymadx-ai-mark.png       AI mark
└── crymadx-ai-full.png       AI wordmark
```

## The three registries — DO NOT bypass them

### 1. `src/routes.ts` — Route Registry

Every screen path is declared once with a stable ID:

```ts
export const ROUTES = {
  'route.splash':           { path: '/' },
  'route.auth.login':       { path: '/login' },
  'route.tab.home':         { path: '/home' },
  'route.wallet.deposit':   { path: '/wallet/deposit/:asset' },
  // ...
} as const

export type RouteId = keyof typeof ROUTES
```

**Rule:** Never hardcode a path string in screen code. Always `routeFor('route.tab.home')`.

### 2. `src/api/endpoints.ts` — Endpoint Registry

Every API call is declared once with a stable ID, method, path, and TS types:

```ts
export const ENDPOINTS = {
  'api.user.profile.get':       { method: 'GET',  path: '/user/profile' },
  'api.wallet.balances.list':   { method: 'GET',  path: '/wallet/balances' },
  'api.wallet.withdraw.create': { method: 'POST', path: '/wallet/withdraw' },
  // ...
} as const
```

**Rule:** Screens call `useEndpoint('api.wallet.balances.list')` — they never know if data came from mock or real backend.

### 3. `src/mock/db.ts` — Mock DB

The fake database. Hierarchical. Every entity has a stable `id` field. Persisted to localStorage so toggles, deposits, etc. survive reloads.

```ts
export const SEED_DB = {
  users: {
    'usr_001': { id: 'usr_001', firstName: 'Joseph', lastName: 'Obasi', kycLevel: 2, ... },
  },
  balances: [
    { id: 'bal_001', userId: 'usr_001', asset: 'BTC', amount: 0.187 },
    { id: 'bal_002', userId: 'usr_001', asset: 'ETH', amount: 0.052 },
  ],
  // ...
}
```

**Rule:** Screens never import from `mock/db.ts`. They only call API hooks. The mock layer reads/writes the DB internally.

## Backend swap-out

To go live:

1. Backend dev implements the endpoints listed in `BACKEND.md` against the same paths as `endpoints.ts`.
2. Set `VITE_USE_MOCK=false` in `.env`.
3. `src/api/client.ts` automatically switches from `mock/handlers.ts` to real `fetch()`.
4. `src/mock/` can be deleted.

That's the entire migration.

## Phase plan

See `PROGRESS.md` for the up-to-date list. High level:

- **Phase 1**: Architecture + scaffolding + ~15 core screens (auth + tab roots + wallet flow). Boss reviews architecture.
- **Phase 2**: Wallet remainder + Trading + Earn + Fiat (~30 more screens).
- **Phase 3**: AI suite + P2P + Card + NFT (~28 more screens).
- **Phase 4**: Security + KYC + Settings + Engagement + Support + Legal & Misc (~45 more screens).

## Conventions

- **Inline styles for layout-specific one-offs**, global classes (`.g`, `.btn-g`, `.li`, etc.) for shared components — same as the Bold Waves canvas. Lift the look, don't refactor.
- **Outfit font** is loaded once in `index.html`, applied via global CSS.
- **Theme**: dark default. Light mode via `<body class="light">`. Toggleable from Profile → Theme.
- **Auth**: `?nav=all` in the URL bypasses the protected-route gate so anyone can navigate without logging in.
- **Reset Demo Data**: button on the Debug screen wipes localStorage and reseeds.
- **No emojis in source code** (only in user-facing copy where explicitly used, like `🥉 Bronze`).
- **No comments in code** unless explaining a non-obvious WHY.

## Resume pointer

When resuming work, do this in order:

1. Read this file (`AGENTS.md`).
2. Read `PROGRESS.md` to see what's done and what's next.
3. Skim `src/routes.ts`, `src/api/endpoints.ts`, `src/mock/db.ts` to see the current registries.
4. Run `npm run dev` to confirm the app still boots.
5. Run `npm run check` for typecheck + build smoke test.
6. Pick up from the first `[pending]` item in `PROGRESS.md`.

## Memory

A high-level project memory entry exists at `~/.claude/projects/.../memory/project_crymadx_mobile_app.md` — but **this file is the source of truth**. If memory and AGENTS.md disagree, AGENTS.md wins.
