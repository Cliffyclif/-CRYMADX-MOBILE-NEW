/**
 * VersionGate — the admin-controlled update gate.
 *
 * Renders nothing on the web build or when no update is required. Otherwise:
 *  · HARD — a full-screen, non-dismissible overlay. The user cannot proceed
 *           until they update. Used for critical/security releases.
 *  · SOFT — a dismissible bottom sheet nudging the user to update.
 *
 * The Update button opens the store listing the admin configured.
 */
import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { useVersionGate } from '../hooks/useVersionGate'
import type { PlatformVersionConfig } from '../lib/appVersion'

const Z = 2147483600 // above toasts, sheets, everything

function openStore(url: string) {
  if (!url) return
  try { window.open(url, '_blank') } catch { window.location.href = url }
}

/** Optional bullet list of release highlights. */
function WhatsNew({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, width: '100%' }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0', fontSize: 13 }}>
          <span aria-hidden style={{ color: 'var(--gl, #3ddc84)', fontWeight: 800 }}>•</span>
          <span style={{ color: 'var(--text-mid-80, rgba(255,255,255,.8))' }}>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function HardGate({ cfg, installedVersion }: { cfg: PlatformVersionConfig; installedVersion: string }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { btnRef.current?.focus() }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-gate-title"
      style={{
        position: 'fixed', inset: 0, zIndex: Z,
        background: 'var(--bg, #060d09)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', overflowY: 'auto', textAlign: 'center',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 76, height: 76, borderRadius: 22,
          background: 'rgba(61,220,132,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        }}
      >
        <Icon name="dl" size={36} color="var(--gl, #3ddc84)" />
      </div>

      <h2 id="version-gate-title" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-strong, #fff)' }}>
        {cfg.title || 'Update Required'}
      </h2>
      <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, color: 'var(--text-mid-80, rgba(255,255,255,.8))', maxWidth: 360 }}>
        {cfg.message || 'A new version of CrymadX is required to continue.'}
      </p>

      {(installedVersion || cfg.latestVersionName) && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 16,
            padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,.05)',
          }}
        >
          {installedVersion && (
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', textDecoration: 'line-through' }}>
              v{installedVersion}
            </span>
          )}
          <Icon name="arrow" size={13} color="var(--gl, #3ddc84)" />
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--gl, #3ddc84)' }}>
            v{cfg.latestVersionName || 'latest'}
          </span>
        </div>
      )}

      <div style={{ maxWidth: 360, width: '100%' }}>
        <WhatsNew items={cfg.whatsNew} />
      </div>

      <button
        ref={btnRef}
        type="button"
        onClick={() => openStore(cfg.storeUrl)}
        style={{
          marginTop: 24, width: '100%', maxWidth: 360, minHeight: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'var(--gl, #3ddc84)', color: '#04140b',
          fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 14, cursor: 'pointer',
        }}
      >
        <Icon name="dl" size={17} color="#04140b" /> Update Now
      </button>
      <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--r, #ff5d5d)' }}>
        This update is required to continue using CrymadX.
      </p>
    </div>
  )
}

function SoftGate({
  cfg, installedVersion, onDismiss,
}: { cfg: PlatformVersionConfig; installedVersion: string; onDismiss: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    btnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: Z, display: 'flex', alignItems: 'flex-end' }}
    >
      {/* Scrim — tapping it dismisses, same as "Later". */}
      <div
        aria-hidden
        onClick={onDismiss}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-soft-title"
        style={{
          position: 'relative', width: '100%',
          background: 'var(--card, #0f1a13)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: '22px 22px calc(22px + env(safe-area-inset-bottom))',
          boxShadow: '0 -12px 40px rgba(0,0,0,.5)',
        }}
      >
        <div
          aria-hidden
          style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.18)', margin: '0 auto 16px' }}
        />
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div
            aria-hidden
            style={{
              width: 46, height: 46, flexShrink: 0, borderRadius: 14,
              background: 'rgba(61,220,132,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="dl" size={22} color="var(--gl, #3ddc84)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 id="version-soft-title" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-strong, #fff)' }}>
              {cfg.title || 'Update Available'}
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--text-mid-80, rgba(255,255,255,.78))' }}>
              {cfg.message || 'A new version of CrymadX is available.'}
              {cfg.latestVersionName ? ` (v${cfg.latestVersionName})` : ''}
            </p>
          </div>
        </div>

        <WhatsNew items={cfg.whatsNew} />

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              flex: 1, minHeight: 46, borderRadius: 13, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(255,255,255,.14)',
              color: 'var(--text-mid-80, rgba(255,255,255,.8))', fontWeight: 700, fontSize: 14,
            }}
          >
            Later
          </button>
          <button
            ref={btnRef}
            type="button"
            onClick={() => openStore(cfg.storeUrl)}
            style={{
              flex: 1.4, minHeight: 46, borderRadius: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: 'var(--gl, #3ddc84)', color: '#04140b',
              border: 'none', fontWeight: 800, fontSize: 14,
            }}
          >
            <Icon name="dl" size={15} color="#04140b" /> Update
          </button>
        </div>
        {installedVersion && (
          <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,.4)' }}>
            You're on v{installedVersion}
          </p>
        )}
      </div>
    </div>
  )
}

/** Mount once near the app root — overlays every route when an update is due. */
export function VersionGate() {
  const { state, dismissSoft } = useVersionGate()
  if (state.kind === 'hard') {
    return <HardGate cfg={state.cfg} installedVersion={state.installedVersion} />
  }
  if (state.kind === 'soft') {
    return <SoftGate cfg={state.cfg} installedVersion={state.installedVersion} onDismiss={dismissSoft} />
  }
  return null
}
