# CrymadX Mobile App

Mobile-first crypto exchange app built with React + Vite. Wraps with Capacitor for native Android (and iOS later) builds.

- **Production:** https://app.crymadx.io
- **Backend API:** https://backend.crymadx.io/api

## Stack
- **React 19** + TypeScript
- **Vite 8** (build / dev server)
- **React Router 7** (routing)
- **TanStack Query** (server state)
- **Zustand** (client state)
- **i18next** (14 languages)
- **Sonner** (toasts)
- **Framer Motion** (animations)
- **@zxing/browser** (QR scanning)
- **Capacitor-aware** native plugins (haptics, biometric, push) — light up after wrap

## Local development

```bash
npm install
cp .env.example .env       # fills with sensible defaults
npm run dev
```

Runs on `http://localhost:5173` (or next free port).

## Production build

```bash
npm run build      # tsc + vite build → ./dist
npm run start      # serves ./dist on $PORT (default 3000)
```

## Deploy (Railway)

1. Connect this repo to a Railway service.
2. Set environment variables in Railway → see `.env.example` for the full list.
3. Railway auto-detects Node + Nixpacks (`nixpacks.toml`) → builds and serves.
4. Add a custom domain (e.g. `app.crymadx.io`) under Settings → Networking.
5. In Cloudflare DNS, add a CNAME pointing the subdomain to Railway's domain.
6. Railway auto-provisions SSL.

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_USE_MOCK` | `true` = offline mocks, `false` = hit real backend |
| `VITE_API_BASE_URL` | Backend gateway URL (no trailing slash) |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key |
| `VITE_WEB_PUSH_PUBLIC_KEY` | VAPID public key for push notifications |
| `PORT` | Server port (Railway sets automatically) |

## Project structure

```
src/
├── api/              # endpoint registry, fetch client, hooks
├── components/       # shared UI primitives
├── config/           # asset / network catalogs
├── hooks/            # useSwipeBack, usePullToRefresh, useBiometricLock, useQRScanner, ...
├── lib/              # haptics, i18n, format, webPush
├── locales/          # 14 language JSON catalogs
├── mock/             # in-process mock backend
├── screens/          # one folder per feature area
├── services/         # backend service clients (kycService, ...)
├── stores/           # Zustand stores
├── styles/           # design system + bold-waves CSS
└── routes.ts         # central route registry
```

## Capacitor (Android wrap, later)

Currently the app runs as a PWA. To package as an Android APK:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "CrymadX" io.crymadx.app
npx cap add android
npx cap copy
npx cap open android      # opens Android Studio
```

The Capacitor plugins (`@capacitor/haptics`, `@capacitor/browser`, `@aparajita/capacitor-biometric-auth`, `@capacitor-community/barcode-scanner`) are loaded lazily at runtime — they activate automatically when the wrapped app runs natively, no code changes needed.

## Backend

Microservices on Hetzner via PM2 — see backend repo. The `api-gateway` proxies all `/api/*` routes to the appropriate service.

## License

Proprietary — CrymadX Inc.
