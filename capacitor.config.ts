import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.crymadx.app',
  appName: 'CrymadX',
  webDir: 'dist',
  // Server URL is intentionally NOT set — the app loads its bundle from
  // the local APK assets so it works fully offline. Live updates can be
  // wired later via @capgo/capacitor-updater without changing this.
  // Make the WebView report mobile.crymadx.io as its origin instead of
  // the default https://localhost. Cloudflare Turnstile (and any other
  // origin-locked service) then sees the same hostname as the website,
  // which is already on the Turnstile allow-list. No "localhost" entries
  // needed in any dashboard. Files are still loaded from the APK locally
  // — the hostname is purely how the WebView labels its document origin.
  server: {
    hostname: 'mobile.crymadx.io',
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#060d09',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#060d09',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#060d09',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
}

export default config
