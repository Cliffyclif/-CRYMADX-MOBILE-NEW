import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { useEndpointMutation } from '../../api/hooks'
import { ROUTES } from '../../routes'

export function BackupCodes() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const loc = useLocation()
  // Real backup codes handed over from the 2FA enable response. We do NOT
  // auto-regenerate on mount — that would invalidate the codes the user is
  // saving. Regeneration is an explicit action via the button below.
  const initial = (loc.state as { backupCodes?: string[] } | null)?.backupCodes ?? []
  const [codes, setCodes] = useState<string[]>(initial)
  const [used] = useState(0)
  const regen = useEndpointMutation<unknown, { codes: string[]; usedCount: number }>('api.security.backup-codes')

  const onRegen = async () => {
    const d = await regen.mutateAsync({})
    setCodes(d.codes ?? [])
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(codes.join('\n'))
  }

  return (
    <PhoneShell noTabs balanced>
      <ScreenHeader title={t('security.backupCodes')} />

      <div className="g" style={{ padding: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gd)' }}>
        <span className="gld">⚠</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          <span className="gld">{t('security.saveTheseNow')}</span> {t('security.backupOneTimeCodes')}
        </div>
      </div>

      <div className="g" style={{ padding: 14, marginTop: 6 }}>
        {codes.length === 0 ? (
          <div className="t3" style={{ textAlign: 'center', padding: '8px 0', lineHeight: 1.5 }}>
            {t('security.regenToView', { defaultValue: 'Tap “Regenerate” to create a fresh set of backup codes.' })}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontFamily: 'monospace' }}>
              {codes.map((c, i) => (
                <div key={i} className="g" style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <div className="t3" style={{ fontSize: 9 }}>{i + 1}.</div>
                  <div style={{ fontSize: 14, color: i < used ? 'var(--text-mid-30)' : 'var(--text-strong)', fontWeight: 700, textDecoration: i < used ? 'line-through' : 'none' }}>{c}</div>
                </div>
              ))}
            </div>
            <div className="t3" style={{ marginTop: 8, textAlign: 'center' }}>{t('security.usedOfTotal', { used, total: codes.length, remaining: codes.length - used })}</div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }} onClick={copyAll}><Icon name="copy" size={12} color="var(--gl)" /> {t('security.copyAll')}</button>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }}><Icon name="dl" size={12} color="var(--gl)" /> {t('security.download')}</button>
        <button className="btn btn-o" style={{ flex: 1, padding: 10, margin: 0, fontSize: 13 }} onClick={onRegen} disabled={regen.isPending}><Icon name="refresh" size={12} color="var(--gl)" /> {t('security.regen')}</button>
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 4 }}>{t('security.important')}</div>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          • {t('security.backupRule1')}<br />
          • {t('security.backupRule2')}<br />
          • {t('security.backupRule3')}<br />
          • {t('security.backupRule4')}
        </div>
      </div>

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={() => nav(ROUTES['route.security.hub'].path, { replace: true })}>{t('security.iSavedThem')}</button>
    </PhoneShell>
  )
}
