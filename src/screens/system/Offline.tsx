import { PhoneShell } from '../../components/PhoneShell'
import { Icon } from '../../components/Icon'

export function Offline() {
  return (
    <PhoneShell noTabs>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="ic" style={{ width: 80, height: 80 }}><Icon name="cloud-off" size={40} color="var(--text-mid-40)" /></div>
        <h2 style={{ marginTop: 16 }}>No Internet Connection</h2>
        <div className="t2" style={{ textAlign: 'center', marginTop: 8, lineHeight: 1.5, padding: '0 16px' }}>
          Looks like you're offline. Please check your Wi-Fi or mobile data and try again.
        </div>

        <div className="g" style={{ padding: 10, marginTop: 14, width: '100%' }}>
          <div className="t3" style={{ fontWeight: 700, marginBottom: 4 }}>What you can still do</div>
          {['View cached portfolio (last 5 min)', 'See saved beneficiaries', 'Read saved articles', 'Access local PIN settings'].map(t => (
            <div key={t} style={{ display: 'flex', gap: 6, margin: '3px 0', fontSize: 13, color: 'var(--text-mid-60)' }}>
              <span className="grn">✓</span>
              {t}
            </div>
          ))}
        </div>

        <button className="btn btn-g" style={{ width: '100%', marginTop: 14 }} onClick={() => location.reload()}>
          <Icon name="refresh" size={16} color="#fff" /> Try Again
        </button>
        <div className="t3" style={{ textAlign: 'center', marginTop: 8 }}>
          <span className="grn" style={{ cursor: 'pointer' }}>Continue offline</span>
        </div>
      </div>
    </PhoneShell>
  )
}
