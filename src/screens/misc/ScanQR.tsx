import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'

export function ScanQR() {
  const nav = useNavigate()
  return (
    <div className="app-root">
      <div className="app-shell" style={{ background: '#000' }}>
        <div style={{ position: 'absolute', top: 30, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '0 14px', zIndex: 30 }}>
          <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', display: 'flex', cursor: 'pointer' }}>
            <Icon name="x" size={20} color="#fff" />
          </button>
          <div style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>Scan QR</div>
          <Icon name="zap" size={18} color="#fff" />
        </div>

        <div style={{ position: 'absolute', inset: '90px 30px 130px', border: '2px solid var(--gl)', borderRadius: 20, boxShadow: '0 0 0 9999px rgba(0,0,0,.6), 0 0 0 1px var(--gl)' }}>
          <div style={{ position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTop: '4px solid var(--gl)', borderLeft: '4px solid var(--gl)', borderRadius: '20px 0 0 0' }} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTop: '4px solid var(--gl)', borderRight: '4px solid var(--gl)', borderRadius: '0 20px 0 0' }} />
          <div style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottom: '4px solid var(--gl)', borderLeft: '4px solid var(--gl)', borderRadius: '0 0 0 20px' }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottom: '4px solid var(--gl)', borderRight: '4px solid var(--gl)', borderRadius: '0 0 20px 0' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--gl), transparent)', boxShadow: '0 0 12px var(--gl)' }} />
        </div>

        <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 15, zIndex: 30 }}>
          Position the QR code in the frame
        </div>

        <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 30 }}>
          <button style={{ background: 'none', border: 'none', textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: 13, cursor: 'pointer' }}>
            <div className="ic" style={{ width: 36, height: 36, background: 'rgba(255,255,255,.1)', margin: '0 auto' }}><Icon name="zap" size={18} color="#fff" /></div>
            <div style={{ marginTop: 4 }}>Flash</div>
          </button>
          <button style={{ background: 'none', border: 'none', textAlign: 'center', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
            <div className="ic" style={{ width: 54, height: 54, background: 'rgba(27,140,62,.3)', boxShadow: '0 0 30px rgba(27,140,62,.4)', margin: '0 auto' }}><Icon name="camera" size={26} color="#fff" /></div>
            <div style={{ marginTop: 4, fontWeight: 700 }}>Scan</div>
          </button>
          <button style={{ background: 'none', border: 'none', textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: 13, cursor: 'pointer' }}>
            <div className="ic" style={{ width: 36, height: 36, background: 'rgba(255,255,255,.1)', margin: '0 auto' }}><Icon name="edit" size={16} color="#fff" /></div>
            <div style={{ marginTop: 4 }}>Manual</div>
          </button>
        </div>
      </div>
    </div>
  )
}
