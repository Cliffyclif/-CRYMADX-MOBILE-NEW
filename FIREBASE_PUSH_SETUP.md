# Native OS Push (FCM) — Setup

The code for native Android push notifications is **done** (mobile app + backend).
To make it actually deliver, two Firebase credential files are needed. This is
the only remaining manual step.

## 1. Create the Firebase project (~10 min, free)

1. Go to <https://console.firebase.google.com> → **Add project** → name it `CrymadX`.
2. Inside the project → **Add app** → **Android**.
   - **Android package name:** `com.exchange.crymadx` (must match exactly).
   - Download the generated **`google-services.json`**.
3. Project Settings (gear) → **Service accounts** tab → **Generate new private key**
   → downloads a **service-account JSON**.

Cloud Messaging (FCM) is enabled by default — nothing else to toggle.

## 2. Place the two files

| File | Destination |
|---|---|
| `google-services.json` | `crymadx-bold-waves/android/app/google-services.json` |
| service-account JSON | server: `/opt/crymadx/firebase-service-account.json` |

The mobile `android/app/build.gradle` already auto-applies the google-services
plugin once `google-services.json` is present. The backend notification-service
already looks for the service account at that exact path (override with the
`FIREBASE_SERVICE_ACCOUNT_PATH` env var if you put it elsewhere).

## 3. Build & deploy

**Mobile app:**
```bash
cd crymadx-bold-waves
npm install                 # picks up @capacitor/push-notifications
npx cap sync android        # wires the native plugin + google-services.json
# then rebuild the APK as usual (Android Studio or your CI)
```

**Backend** — once the service account file is on the server:
```bash
pm2 restart notification-service
# boot log should now print: [NOTIFY] FCM configured (firebase-admin ready)
```

## What's already wired

**Mobile (`crymadx-bold-waves`):**
- `src/lib/nativePush.ts` — FCM registration, token → backend, tap → deep link
- `src/lib/push.ts` — facade: native FCM on the app, Web Push in a browser
- `src/App.tsx` — auto-prompts for permission once after login + routes notification taps
- `src/screens/settings/NotificationsSettings.tsx` — the push toggle now drives FCM on native
- `@capacitor/push-notifications` added to `package.json`

**Backend (notification-service — already live):**
- `POST/DELETE /api/notifications/register-device` — stores FCM tokens in the `fcm_tokens` collection
- Broadcast handler now fans out via FCM (alongside Web Push + in-app), pruning dead tokens
- `firebase-admin` installed; FCM stays safely disabled until the service account file exists

## Flow once live

1. User logs into the mobile app → permission prompt → FCM token saved to `fcm_tokens`.
2. Admin sends a broadcast → notification-service resolves the audience →
   fans out to in-app + Web Push + **FCM**.
3. The user's phone shows the notification **even with the app closed**; tapping
   it deep-links into the app.
