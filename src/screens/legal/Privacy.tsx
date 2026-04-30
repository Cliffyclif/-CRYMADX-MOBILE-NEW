import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'

export function Privacy() {
  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Privacy Policy" actions={<Icon name="share" size={14} />} />
      <div className="t3">Last updated: April 1, 2026 · v2.8</div>

      <div className="g" style={{ padding: 14, marginTop: 8, lineHeight: 1.6, fontSize: 13, color: 'var(--text-mid-80)' }}>
        <h3 style={{ marginBottom: 6 }}>What we collect</h3>
        <p>To operate CrymadX, we collect:</p>
        <ul style={{ marginLeft: 14, marginTop: 4 }}>
          <li>Identity info (name, DOB, government ID)</li>
          <li>Contact (email, phone)</li>
          <li>Transaction history</li>
          <li>Device & app usage analytics</li>
          <li>IP address & approximate location</li>
        </ul>

        <h3 style={{ margin: '8px 0 4px' }}>How we use it</h3>
        <p>We use your data to provide services, comply with law (KYC/AML), prevent fraud, and improve the product. We do <span className="grn">not</span> sell personal data.</p>

        <h3 style={{ margin: '8px 0 4px' }}>Who we share with</h3>
        <ul style={{ marginLeft: 14, marginTop: 4 }}>
          <li>KYC providers (Gokuvision)</li>
          <li>Payment processors (Guardarian)</li>
          <li>Regulators (when required)</li>
          <li>Cloud infrastructure (AWS, encrypted)</li>
        </ul>

        <h3 style={{ margin: '8px 0 4px' }}>Your rights</h3>
        <p>You can: request a copy of your data, correct it, delete (subject to AML retention), export it, or contact our DPO at <span className="grn">privacy@crymadx.io</span></p>

        <h3 style={{ margin: '8px 0 4px' }}>Data residency</h3>
        <p>EU users: data stored in EU. Other regions: AWS US-East/Singapore. Encryption-at-rest with AES-256.</p>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">🔒</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>Compliant with <span className="grn">GDPR</span>, <span className="grn">CCPA</span>, and Nigerian NDPR.</div>
      </div>
    </PhoneShell>
  )
}
