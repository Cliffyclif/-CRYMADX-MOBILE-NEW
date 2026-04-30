/**
 * ScreenHeader — common back-arrow + title row used at the top of most screens.
 */

import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { type ReactNode } from 'react'

interface Props {
  title?: string
  actions?: ReactNode
  /** Override default back behavior (history.back) */
  onBack?: () => void
  /** Extra icons rendered after the title */
  rightIcons?: IconName[]
}

export function ScreenHeader({ title, actions, onBack, rightIcons }: Props) {
  const nav = useNavigate()
  const handleBack = onBack ?? (() => nav(-1))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <button onClick={handleBack} style={{ background: 'transparent', border: 'none', padding: 0, display: 'flex', cursor: 'pointer' }}>
        <Icon name="arrow-l" size={16} color="var(--text-mid-50)" />
      </button>
      {title && <h2 style={{ flex: 1 }}>{title}</h2>}
      {rightIcons?.map(n => (
        <Icon key={n} name={n} size={16} />
      ))}
      {actions}
    </div>
  )
}
