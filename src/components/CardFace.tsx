/**
 * CardFace — visual representation of the user's CrymadX Visa card.
 */

interface Props {
  last4: string
  cardholderName: string
  size?: 'small' | 'medium' | 'large'
}

export function CardFace({ last4, cardholderName, size = 'medium' }: Props) {
  const w = size === 'large' ? 240 : size === 'small' ? 200 : 220
  const h = size === 'large' ? 148 : size === 'small' ? 126 : 138

  return (
    <div style={{
      width: w, height: h,
      background: 'linear-gradient(135deg, #0a3a18, #0f5824 60%, #1B8C3E)',
      padding: 14, borderRadius: 14,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxShadow: '0 8px 32px rgba(27,140,62,.4)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <img src="/crymadx-mark.png" alt="" style={{ width: 30, height: 30 }} />
        <div style={{ width: 26, height: 18, borderRadius: 3, background: 'linear-gradient(135deg, #d4a04a, #f5c860)' }} />
      </div>
      <div style={{ fontSize: 14, color: '#fff', letterSpacing: 3, fontFamily: 'monospace', fontWeight: 600 }}>
        •••• •••• •••• {last4}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: 1 }}>CARDHOLDER</div>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 2 }}>{cardholderName}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontStyle: 'italic' }}>VISA</div>
      </div>
    </div>
  )
}
