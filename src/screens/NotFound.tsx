import { useNavigate } from 'react-router-dom'
import { PhoneShell } from '../components/PhoneShell'
import { Icon } from '../components/Icon'
import { ROUTES } from '../routes'

export function NotFound() {
  const nav = useNavigate()
  return (
    <PhoneShell noTabs>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 24 }}>
        <div className="ic" style={{ width: 80, height: 80 }}>
          <Icon name="cloud-off" size={40} color="var(--text-mid-40)" />
        </div>
        <h2 style={{ marginTop: 16, textAlign: 'center' }}>Coming in a future phase</h2>
        <div className="t2" style={{ textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          This screen exists in the design canvas but isn't wired up yet. Phase 1 covers auth + tab roots + wallet flow. See <code>PROGRESS.md</code> for the rollout schedule.
        </div>
        <button className="btn btn-g" onClick={() => nav(ROUTES['route.tab.home'].path)} style={{ marginTop: 16 }}>
          ← Back to Home
        </button>
      </div>
    </PhoneShell>
  )
}
