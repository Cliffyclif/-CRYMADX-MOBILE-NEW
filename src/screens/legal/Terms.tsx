import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'

const SECTIONS: Array<[string, string]> = [
  ['1. Acceptance of Terms', 'By creating a CrymadX account and using our services, you accept these Terms of Service in full. If you disagree, please do not use our platform.'],
  ['2. Eligibility', 'You must be at least 18 years old and reside in a supported jurisdiction. We do not currently serve users from sanctioned countries or US states where crypto trading is restricted.'],
  ['3. Account Verification (KYC)', 'To comply with anti-money laundering (AML) regulations, we require identity verification. You agree to provide accurate information and updates as required.'],
  ['4. Fees', 'Trading, deposit, and withdrawal fees are listed at crymadx.io/fees. We may update fees with 30 days notice.'],
  ['5. Risk Disclosure', 'Cryptocurrency trading involves significant risk. Prices can be highly volatile. Past performance does not guarantee future results. You may lose all invested funds.'],
  ['6. Custody & Security', 'While we maintain bank-grade security, we recommend self-custody for large balances. You are responsible for safeguarding your account credentials, 2FA, and PIN.'],
  ['7. Prohibited Use', 'You agree not to use CrymadX for money laundering, terrorist financing, fraud, or any illegal activity.'],
]

export function Terms() {
  return (
    <PhoneShell noTabs>
      <ScreenHeader title="Terms of Service" actions={<Icon name="share" size={14} />} />
      <div className="t3">Last updated: April 1, 2026 · v3.2</div>

      <div className="g" style={{ padding: 14, marginTop: 8, lineHeight: 1.6, fontSize: 13, color: 'var(--text-mid-80)' }}>
        {SECTIONS.map(([title, body]) => (
          <div key={title}>
            <h3 style={{ marginBottom: 6, marginTop: 8 }}>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>

      <div className="t3" style={{ textAlign: 'center', marginTop: 8 }}>Continue scrolling for full terms...</div>
      <button className="btn btn-g" style={{ marginTop: 8 }}><Icon name="check" size={12} color="#fff" /> I Agree</button>
    </PhoneShell>
  )
}
