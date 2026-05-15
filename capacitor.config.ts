import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.exchange.crymadx',
  appName: 'CrymadX',
  webDir: 'dist',
  // The app's bundle still loads from local APK assets (offline-capable);
  // `hostname` only changes what window.location reports inside the WebView,
  // so origin-bound services like Cloudflare Turnstile match the same
  // allow-list as the real website (https://mobile.crymadx.io). Without
  // this, Capacitor's default 'localhost' tripped the dev fallback path
  // and showed the orange "For testing only" banner over the captcha.
  server: {
    hostname: 'mobile.crymadx.io',
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#060d09',
    // Allow plain http for the local emulator only (production hits HTTPS).
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // launchShowDuration is only a SAFETY CEILING — the app calls
      // SplashScreen.hide() from JS as soon as React paints (see
      // useCapacitorAppState). On a fast device the splash hides well
      // under a second; the 3s cap just guarantees it never sticks if
      // the JS bundle hangs on a slow device.
      launchShowDuration: 3000,
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
