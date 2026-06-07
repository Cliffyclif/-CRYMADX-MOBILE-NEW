import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpoint, useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'
import { haptics } from '../../lib/haptics'

interface AntiPhishingResponse {
  isSet?: boolean
  maskedCode?: string | null
}

/**
 * Anti-phishing code: a personal phrase the backend embeds in every
 * security-sensitive email so the user can spot impostor messages.
 *
 * Backend (user-service):
 *   GET  /user/anti-phishing → { isSet, maskedCode }   // never plain code
 *   POST /user/anti-phishing  body { code }            // 4-20 chars
 */
export function AntiPhishing() {
  const nav = useNavigate()
  const { data, isLoading, refetch } = useEndpoint<AntiPhishingResponse>(
    'api.security.anti-phishing.get',
  )
  const save = useEndpointMutation<{ body: { code: string } }, { message?: string }>(
    'api.security.anti-phishing.set',
  )

  const [editing, setEditing] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // The backend returns `maskedCode` when set but doesn't always send a truthy
  // `isSet` — treat a present masked code as "set" too (matches the Security hub).
  const isSet = !!(data?.isSet || data?.maskedCode)
  const masked = data?.maskedCode ?? null

  // When data first loads and there's no code yet, drop straight into edit mode.
  useEffect(() => {
    if (!isLoading && !isSet && !editing) setEditing(true)
  }, [isLoading, isSet, editing])

  const validate = (v: string): string | null => {
    if (v.length < 4) return 'Code must be at least 4 characters'
    if (v.length > 20) return 'Code must be 20 characters or fewer'
    if (/\s/.test(v)) return 'No spaces — make it one word/phrase'
    return null
  }

  const submit = async () => {
    const trimmed = code.trim()
    const err = validate(trimmed)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    try {
      await save.mutateAsync({ body: { code: trimmed } })
      haptics.success()
      toast.success(isSet ? 'Anti-phishing code updated' : 'Anti-phishing code set')
      setCode('')
      setEditing(false)
      refetch()
    } catch (e: any) {
      haptics.error()
      const msg = e?.message ?? 'Could not save'
      setError(msg)
    }
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title="Anti-Phishing Code" />

      <div className="g" style={{ padding: 14, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="eye" size={20} color="var(--gl)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
              What is this?
            </div>
            <div className="t3" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              A personal phrase we put at the top of every security email we send
              you. If you ever get an email "from CrymadX" without your phrase,
              it's a phishing attempt — delete it.
            </div>
          </div>
        </div>
      </div>

      {/* Current state */}
      {!isLoading && (
        <div
          className="g"
          style={{
            padding: 14,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderLeft: `3px solid ${isSet ? 'var(--gl)' : 'var(--gd)'}`,
            background: isSet ? 'rgba(0,200,83,.05)' : 'rgba(255,193,7,.05)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: isSet ? 'rgba(0,200,83,.14)' : 'rgba(255,193,7,.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={isSet ? 'check' : 'plus'} size={18} color={isSet ? 'var(--gl)' : 'var(--gd)'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)' }}>
              {isSet ? 'Code is active' : 'Not set yet'}
            </div>
            <div
              className="t3"
              style={{ fontSize: 12, marginTop: 2, fontFamily: isSet ? 'monospace' : 'inherit' }}
            >
              {isSet
                ? masked
                  ? `Current: "${masked}"`
                  : 'Active'
                : 'Pick a phrase only you know.'}
            </div>
          </div>
          {isSet && !editing && (
            <button
              onClick={() => {
                setEditing(true)
                setCode('')
                setError(null)
              }}
              style={{
                background: 'rgba(0,200,83,.1)',
                color: 'var(--gl)',
                border: '1px solid rgba(0,200,83,.2)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Outfit',
                flexShrink: 0,
              }}
            >
              Change
            </button>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="g" style={{ padding: 14, marginTop: 8 }}>
          <div className="t3" style={{ fontWeight: 700, marginBottom: 6, fontSize: 12 }}>
            {isSet ? 'New code' : 'Choose a code'}
          </div>
          <div className="inp">
            <Icon name="eye" size={14} />
            <input
              type="text"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder='e.g. "BlueSparrow42"'
              value={code}
              onChange={e => {
                setCode(e.target.value.slice(0, 20))
                setError(null)
              }}
              maxLength={20}
              style={{ flex: 1 }}
            />
            <span
              style={{
                fontSize: 11,
                color: code.length >= 4 ? 'var(--gl)' : 'var(--text-mid)',
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              {code.length}/20
            </span>
          </div>

          <div style={{ marginTop: 10, fontSize: 11 }}>
            {[
              [code.trim().length >= 4 && code.trim().length <= 20, '4–20 characters'],
              [!/\s/.test(code), 'No spaces'],
              [code.length > 0 && !/^password|crymadx|admin|123|test$/i.test(code.trim()), 'Not a common word'],
            ].map(([ok, label]) => (
              <div key={String(label)} style={{ display: 'flex', gap: 6, margin: '3px 0' }}>
                <span style={{ color: ok ? 'var(--gl)' : 'var(--text-mid)' }}>{ok ? '✓' : '○'}</span>
                <span style={{ color: ok ? 'var(--text-strong)' : 'var(--text-mid)' }}>{label}</span>
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{
                padding: 10,
                marginTop: 8,
                borderLeft: '3px solid var(--r)',
                background: 'rgba(255,82,82,.06)',
                fontSize: 12,
                color: 'var(--r)',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {isSet && (
              <button
                className="btn btn-o"
                style={{ flex: 1 }}
                onClick={() => {
                  setEditing(false)
                  setCode('')
                  setError(null)
                }}
              >
                Cancel
              </button>
            )}
            <button
              className="btn btn-g"
              style={{ flex: isSet ? 1 : undefined, width: isSet ? undefined : '100%' }}
              onClick={submit}
              disabled={save.isPending || code.trim().length < 4}
            >
              <Icon name="shield" size={14} color="#fff" />
              {save.isPending ? 'Saving…' : isSet ? 'Update code' : 'Set code'}
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="g" style={{ padding: 12, marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>
          Pick a good code
        </div>
        {[
          'Use something memorable to you — a nickname, a place, a phrase.',
          'Don\'t use your password or any password fragment.',
          'Avoid generic words ("login", "secure", "crymadx").',
          'You\'ll see this in every security email — pick something you\'d notice.',
        ].map(line => (
          <div key={line} style={{ display: 'flex', gap: 8, margin: '4px 0', fontSize: 12 }}>
            <span style={{ color: 'var(--gl)' }}>•</span>
            <span style={{ color: 'var(--text-mid)' }}>{line}</span>
          </div>
        ))}
      </div>

      {!editing && isSet && (
        <button
          className="btn btn-o"
          style={{ marginTop: 10 }}
          onClick={() => nav(ROUTES['route.security.hub'].path, { replace: true })}
        >
          Back to security
        </button>
      )}
    </PhoneShell>
  )
}
