/**
 * QR scanner hook.
 *
 *   • On native (Capacitor + @capacitor-community/barcode-scanner installed)
 *     it uses the native scanner (transparent webview, hardware-decoded).
 *   • On web it uses @zxing/browser to read a frame stream from the device
 *     camera. The scanner UI is provided by the QRScanModal component below.
 *
 * Returns: { scan } where scan() is a one-shot promise that resolves with the
 * decoded text or null if the user cancelled / no code found.
 */
import { useCallback, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

let cachedNative: any | null | undefined

// Dynamic import that hides the path from Vite's analyzer.
const dynImport: (path: string) => Promise<any> =
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('p', 'return import(p)') as any

async function loadNative(): Promise<any | null> {
  if (cachedNative !== undefined) return cachedNative
  try {
    const [coreMod, scanMod] = await Promise.all([
      dynImport('@capacitor/core').catch(() => null),
      dynImport('@capacitor-community/barcode-scanner').catch(() => null),
    ])
    if (coreMod?.Capacitor?.isNativePlatform?.() && scanMod?.BarcodeScanner) {
      cachedNative = scanMod.BarcodeScanner
    } else {
      cachedNative = null
    }
  } catch { cachedNative = null }
  return cachedNative
}

async function nativeScan(): Promise<string | null> {
  const Scanner = await loadNative()
  if (!Scanner) return null
  try {
    const status = await Scanner.checkPermission({ force: true })
    if (!status.granted) return null
    await Scanner.prepare()
    document.body.classList.add('qr-scanner-active')
    const result = await Scanner.startScan()
    document.body.classList.remove('qr-scanner-active')
    return result?.hasContent ? result.content : null
  } finally {
    try { await (await loadNative())?.stopScan?.() } catch { /* ignore */ }
    document.body.classList.remove('qr-scanner-active')
  }
}

/** Decode a single QR from a live camera stream rendered into the given <video>. */
export async function scanFromVideo(video: HTMLVideoElement): Promise<string | null> {
  const reader = new BrowserMultiFormatReader()
  try {
    const result = await reader.decodeOnceFromVideoElement(video)
    return result?.getText() ?? null
  } catch {
    return null
  }
}

export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false)

  /** Try native first; if native unavailable, returns 'web' so caller mounts the modal. */
  const scan = useCallback(async (): Promise<{ kind: 'value'; value: string } | { kind: 'web' } | { kind: 'none' }> => {
    setIsScanning(true)
    try {
      const Scanner = await loadNative()
      if (Scanner) {
        const v = await nativeScan()
        return v ? { kind: 'value', value: v } : { kind: 'none' }
      }
      return { kind: 'web' }
    } finally {
      setIsScanning(false)
    }
  }, [])

  return { scan, isScanning }
}
