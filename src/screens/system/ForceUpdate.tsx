import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'

const WHATS_NEW: Array<[string, string]> = [
  ['🤖', 'CrymadX AI assistant'],
  ['🔒', 'Critical security patches'],
  ['💳', 'Crypto Card now in Nigeria'],
  ['🌐', 'Português & Yorùbá support'],
  ['⚡', '60% faster app launch'],
]

export function ForceUpdate() {
  return (
    <PhoneShell noTabs>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ position: 'relative' }}>
          <div className="ic" style={{ width: 80, height: 80 }}><Icon name="dl" size={40} /></div>
          <div style={{ position: 'absolute', top: -4, right: -4, width: 24, height: 24, borderRadius: 12, background: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg)' }}>
            <Icon name="plus" size={12} color="#fff" />
          </div>
        </div>

        <h2 style={{ marginTop: 16 }}>Update Required</h2>
        <div className="t2" style={{ textAlign: 'center', marginTop: 8, lineHeight: 1.5, padding: '0 16px' }}>
          A new version of CrymadX is available with critical security fixes.
        </div>

        <div className="g" style={{ padding: 12, marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', width: '100%' }}>
          <span className="t3" style={{ textDecoration: 'line-through' }}>v2.0.0</span>
          <Icon name="arrow" size={14} color="var(--gl)" />
          <span className="grn" style={{ fontWeight: 800, fontSize: 18 }}>v2.1.0</span>
        </div>

        <div className="g" style={{ padding: 12, marginTop: 8, width: '100%' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>What's New</div>
          {WHATS_NEW.map(([e, t]) => (
            <div key={t} style={{ display: 'flex', gap: 6, margin: '3px 0', fontSize: 13 }}>
              <span style={{ fontSize: 15 }}>{e}</span>
              <span style={{ color: 'var(--text-mid-80)' }}>{t}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-g" style={{ width: '100%', marginTop: 14 }}>
          <Icon name="dl" size={16} color="#fff" /> Update Now (24 MB)
        </button>
        <div className="t3" style={{ textAlign: 'center', marginTop: 8, color: 'var(--r)' }}>This update is required to continue</div>
      </div>
    </PhoneShell>
  )
}
