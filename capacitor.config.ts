import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.crymadx.app',
  appName: 'CrymadX',
  webDir: 'dist',
  // Server URL is intentionally NOT set — the app loads its bundle from
  // the local APK assets so it works fully offline. Live updates can be
  // wired later via @capgo/capacitor-updater without changing this.
  android: {
    backgroundColor: '#060d09',
    // Allow plain http for the local emulator only (production hits HTTPS).
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
