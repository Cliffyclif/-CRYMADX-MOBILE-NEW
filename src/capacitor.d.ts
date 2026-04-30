/**
 * Ambient declarations for Capacitor plugins we use lazily. The real packages
 * aren't installed (we're staying on localhost for now), but the runtime
 * imports are wrapped in `import().catch(() => null)` so they're harmless.
 *
 * These declarations let TypeScript compile without the modules present.
 * When we eventually `npm install @capacitor/core @capacitor/haptics
 * @aparajita/capacitor-biometric-auth @capacitor-community/barcode-scanner
 * @capacitor/app` for the Android wrap, you can delete this file — the real
 * types will take over.
 */
declare module '@capacitor/core'
declare module '@capacitor/haptics'
declare module '@capacitor/app'
declare module '@aparajita/capacitor-biometric-auth'
declare module '@capacitor-community/barcode-scanner'
