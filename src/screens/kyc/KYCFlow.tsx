import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PhoneShell } from '../../components/PhoneShell'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Icon } from '../../components/Icon'
import { CountryPicker } from '../../components/CountryPicker'
import { COUNTRIES, flagEmoji, type Country } from '../../data/countries'
import { ROUTES } from '../../routes'
import { useAuth } from '../../stores/auth'
import { kycService, type KYCSubmitInput } from '../../services/kycService'
import { haptics } from '../../lib/haptics'

type Step = 'personal' | 'document' | 'selfie' | 'review'
type DocType = KYCSubmitInput['documentType']

const STEPS: Array<{ id: Step; iconName: string; labelKey: string }> = [
  { id: 'personal', iconName: 'user',   labelKey: 'kyc.stepPersonal' },
  { id: 'document', iconName: 'file',   labelKey: 'kyc.stepIdDoc' },
  { id: 'selfie',   iconName: 'camera', labelKey: 'kyc.stepSelfie2' },
  { id: 'review',   iconName: 'check',  labelKey: 'kyc.stepReview2' },
]

export function KYCFlow() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const user = useAuth(s => s.user)
  const [step, setStep] = useState<Step>('personal')
  const [submitting, setSubmitting] = useState(false)

  // Personal info
  const [personal, setPersonal] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName ?? '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })

  // Documents
  const [docType, setDocType] = useState<DocType | ''>('')
  const [docFront, setDocFront] = useState<File | null>(null)
  const [docBack, setDocBack] = useState<File | null>(null)
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)

  // Selfie + liveness
  const [selfie, setSelfie] = useState<Blob | null>(null)
  const [livenessVideo, setLivenessVideo] = useState<Blob | null>(null)

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const next = () => {
    haptics.selection()
    if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].id)
  }
  const prev = () => {
    haptics.selection()
    if (stepIdx > 0) setStep(STEPS[stepIdx - 1].id)
  }

  const personalValid = personal.firstName.trim() && personal.lastName.trim() && personal.dateOfBirth && personal.nationality && personal.address.trim() && personal.city.trim() && personal.country.trim()
  const documentValid = docType && docFront && (docType === 'passport' || docBack)
  const selfieValid = !!selfie

  const submit = async () => {
    if (!docType || !docFront || !selfie) {
      toast.error(t('kyc.missingFields') || 'Missing required files')
      return
    }
    setSubmitting(true)
    try {
      const r = await kycService.submit({
        documentType: docType,
        documentFront: docFront,
        documentBack: docBack ?? undefined,
        selfie,
        livenessVideo: livenessVideo ?? undefined,
        personalInfo: {
          firstName: personal.firstName,
          lastName: personal.lastName,
          dateOfBirth: personal.dateOfBirth,
          nationality: personal.nationality,
          country: personal.country,
          address: personal.address,
          city: personal.city,
          postalCode: personal.postalCode,
        },
      })
      haptics.success()
      toast.success(r.message ?? (t('kyc.submittedSuccess') || 'Submitted for verification'))
      nav(ROUTES['route.kyc.pending'].path, { replace: true })
    } catch (e: any) {
      haptics.error()
      toast.error(e?.message ?? (t('kyc.submissionFailed') || 'Submission failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PhoneShell noTabs>
      <ScreenHeader
        title={t('kyc.verifyIdentity')}
        actions={<span className="badge badge-gd" style={{ fontSize: 10 }}>L3</span>}
        onBack={stepIdx > 0 ? prev : undefined}
      />

      {/* Step pips */}
      <div className="steps" style={{ marginTop: 6 }}>
        {STEPS.map((s, i) => {
          const state = i < stepIdx ? 'd' : i === stepIdx ? 'a' : ''
          return (
            <div key={s.id} className="step">
              <div className={`sn ${state}`}>{state === 'd' ? '✓' : i + 1}</div>
              <div className="st">{t(s.labelKey)}</div>
            </div>
          )
        })}
      </div>

      <div className="g" style={{ padding: 10, marginTop: 8, display: 'flex', gap: 6, borderLeft: '3px solid var(--gl)' }}>
        <span className="grn">🔒</span>
        <div className="t3" style={{ lineHeight: 1.4 }}>
          {t('kyc.bankGradeEncryption') || 'Bank-grade encryption · Your data is secure.'}
        </div>
      </div>

      {step === 'personal' && (
        <PersonalStep value={personal} onChange={setPersonal} onNext={next} valid={!!personalValid} />
      )}
      {step === 'document' && (
        <DocumentStep
          docType={docType}
          setDocType={setDocType}
          docFront={docFront}
          setDocFront={setDocFront}
          docBack={docBack}
          setDocBack={setDocBack}
          frontRef={frontRef}
          backRef={backRef}
          onNext={next}
          valid={!!documentValid}
        />
      )}
      {step === 'selfie' && (
        <SelfieStep
          selfie={selfie}
          setSelfie={setSelfie}
          livenessVideo={livenessVideo}
          setLivenessVideo={setLivenessVideo}
          onNext={next}
          valid={selfieValid}
        />
      )}
      {step === 'review' && (
        <ReviewStep
          personal={personal}
          docType={docType as DocType}
          submit={submit}
          submitting={submitting}
        />
      )}
    </PhoneShell>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Personal
// ─────────────────────────────────────────────────────────────────────────────
type PersonalT = {
  firstName: string; lastName: string; dateOfBirth: string; nationality: string
  address: string; city: string; postalCode: string; country: string
}
function PersonalStep({ value, onChange, onNext, valid }: { value: PersonalT; onChange: (v: PersonalT) => void; onNext: () => void; valid: boolean }) {
  const { t } = useTranslation()
  const set = (k: keyof PersonalT) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value })
  const [pickerOpen, setPickerOpen] = useState<null | 'nationality' | 'country'>(null)
  const nationalityCountry = COUNTRIES.find(c => c.name === value.nationality) || null
  const residenceCountry   = COUNTRIES.find(c => c.name === value.country)     || null

  return (
    <>
      <div className="auth-card" style={{ marginTop: 8, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <IconField label={t('kyc.firstName', { defaultValue: 'First name' })} icon="user">
            <input value={value.firstName} onChange={set('firstName')} placeholder={t('kyc.firstNamePh', { defaultValue: 'As on ID' })} style={fieldInputStyle} />
          </IconField>
          <IconField label={t('kyc.lastName', { defaultValue: 'Last name' })} icon="user">
            <input value={value.lastName} onChange={set('lastName')} placeholder={t('kyc.lastNamePh', { defaultValue: 'As on ID' })} style={fieldInputStyle} />
          </IconField>
        </div>

        <IconField label={t('kyc.dateOfBirth', { defaultValue: 'Date of birth' })} icon="clock">
          <input type="date" value={value.dateOfBirth} onChange={set('dateOfBirth')} style={{ ...fieldInputStyle, colorScheme: 'dark' }} />
        </IconField>

        <PickerField
          label={t('kyc.nationality', { defaultValue: 'Nationality' })}
          icon="user"
          country={nationalityCountry}
          placeholder={t('kyc.nationalityPh', { defaultValue: 'Select nationality' })}
          onClick={() => setPickerOpen('nationality')}
        />

        <IconField label={t('kyc.address', { defaultValue: 'Residential address' })} icon="home">
          <input value={value.address} onChange={set('address')} placeholder={t('kyc.addressPh', { defaultValue: 'Street and number' })} style={fieldInputStyle} />
        </IconField>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
          <IconField label={t('kyc.city', { defaultValue: 'City' })} icon="home">
            <input value={value.city} onChange={set('city')} placeholder={t('kyc.cityPh', { defaultValue: 'e.g. Lagos' })} style={fieldInputStyle} />
          </IconField>
          <IconField label={t('kyc.postalCode', { defaultValue: 'Postal code' })} icon="doc">
            <input value={value.postalCode} onChange={set('postalCode')} placeholder={t('kyc.postalCodePh', { defaultValue: 'Optional' })} style={fieldInputStyle} />
          </IconField>
        </div>

        <PickerField
          label={t('kyc.country', { defaultValue: 'Country of residence' })}
          icon="flag"
          country={residenceCountry}
          placeholder={t('kyc.countryPh', { defaultValue: 'Select country' })}
          onClick={() => setPickerOpen('country')}
        />
      </div>

      <button className="btn btn-g" style={{ marginTop: 12 }} onClick={onNext} disabled={!valid}>
        {t('common.continue', { defaultValue: 'Continue' })}
      </button>

      <CountryPicker
        open={pickerOpen === 'nationality'}
        onClose={() => setPickerOpen(null)}
        onSelect={(c: Country) => onChange({ ...value, nationality: c.name })}
        selectedCode={nationalityCountry?.code}
        variant="name"
      />
      <CountryPicker
        open={pickerOpen === 'country'}
        onClose={() => setPickerOpen(null)}
        onSelect={(c: Country) => onChange({ ...value, country: c.name })}
        selectedCode={residenceCountry?.code}
        variant="name"
      />
    </>
  )
}

const fieldInputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text-strong)',
  fontSize: 15,
  fontFamily: 'inherit',
  padding: 0,
}

function IconField({ label, icon, children }: { label: string; icon: 'user' | 'clock' | 'home' | 'doc' | 'flag' | 'mail'; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="t3" style={{ marginBottom: 6, fontWeight: 600, fontSize: 12, letterSpacing: 0.3, color: 'var(--text-mid-40)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: 12,
      }}>
        <Icon name={icon} size={14} color="var(--text-mid-40)" />
        {children}
      </div>
    </div>
  )
}

function PickerField({ label, icon, country, placeholder, onClick }: { label: string; icon: 'user' | 'flag'; country: Country | null; placeholder: string; onClick: () => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="t3" style={{ marginBottom: 6, fontWeight: 600, fontSize: 12, letterSpacing: 0.3, color: 'var(--text-mid-40)', textTransform: 'uppercase' }}>{label}</div>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
          background: 'rgba(255,255,255,.03)',
          border: '1px solid rgba(255,255,255,.07)',
          borderRadius: 12,
          color: 'var(--text-strong)',
        }}
      >
        {country ? (
          <>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(country.code)}</span>
            <span style={{ flex: 1, fontSize: 15 }}>{country.name}</span>
          </>
        ) : (
          <>
            <Icon name={icon} size={14} color="var(--text-mid-40)" />
            <span style={{ flex: 1, fontSize: 15, color: 'var(--text-mid-40)' }}>{placeholder}</span>
          </>
        )}
        <span style={{ color: 'var(--text-mid-40)', fontSize: 11 }}>▾</span>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Document
// ─────────────────────────────────────────────────────────────────────────────
function DocumentStep({
  docType, setDocType, docFront, setDocFront, docBack, setDocBack, frontRef, backRef, onNext, valid,
}: {
  docType: DocType | ''
  setDocType: (v: DocType) => void
  docFront: File | null
  setDocFront: (f: File | null) => void
  docBack: File | null
  setDocBack: (f: File | null) => void
  frontRef: React.RefObject<HTMLInputElement | null>
  backRef: React.RefObject<HTMLInputElement | null>
  onNext: () => void
  valid: boolean
}) {
  const { t } = useTranslation()
  const types: Array<{ id: DocType; label: string }> = [
    { id: 'passport',        label: t('kyc.passport')        || 'Passport' },
    { id: 'driving_license', label: t('kyc.driversLicense')  || 'Driver’s license' },
    { id: 'national_id',     label: t('kyc.nationalId')      || 'National ID' },
  ]

  return (
    <>
      <div className="g" style={{ padding: 12, marginTop: 8 }}>
        <h3 style={{ margin: '0 0 8px' }}>{t('kyc.selectDocumentType') || 'Select document type'}</h3>
        {types.map(d => (
          <button
            key={d.id}
            className="li"
            onClick={() => { haptics.selection(); setDocType(d.id) }}
            style={{
              width: '100%',
              border: '1px solid',
              borderColor: docType === d.id ? 'var(--gl)' : 'var(--divider-soft)',
              background: docType === d.id ? 'rgba(0,200,83,.06)' : undefined,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div className="li-c"><div className="li-n">{d.label}</div></div>
            <div className="li-r">{docType === d.id && <span className="grn">✓</span>}</div>
          </button>
        ))}
      </div>

      {docType && (
        <div className="g" style={{ padding: 12, marginTop: 8 }}>
          <h3 style={{ margin: '0 0 8px' }}>{t('kyc.uploadDocument') || 'Upload document'}</h3>
          <input ref={frontRef} type="file" accept="image/*" capture="environment" hidden onChange={e => setDocFront(e.target.files?.[0] ?? null)} />
          <UploadTile label={t('kyc.frontOfDocument') || 'Front of document'} done={!!docFront} fileName={docFront?.name} onClick={() => frontRef.current?.click()} />
          {docType !== 'passport' && (
            <>
              <input ref={backRef} type="file" accept="image/*" capture="environment" hidden onChange={e => setDocBack(e.target.files?.[0] ?? null)} />
              <UploadTile label={t('kyc.backOfDocument') || 'Back of document'} done={!!docBack} fileName={docBack?.name} onClick={() => backRef.current?.click()} />
            </>
          )}
        </div>
      )}

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={onNext} disabled={!valid}>
        {t('common.continue') || 'Continue'}
      </button>
    </>
  )
}

function UploadTile({ label, done, fileName, onClick }: { label: string; done: boolean; fileName?: string; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: 18,
        marginTop: 6,
        border: '2px dashed',
        borderColor: done ? 'var(--gl)' : 'var(--divider-soft)',
        borderRadius: 12,
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'center',
        color: 'var(--text-strong)',
      }}
    >
      <div style={{ fontSize: 28 }}>{done ? '✓' : '📎'}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{label}</div>
      <div className="t3" style={{ marginTop: 2 }}>{done ? fileName : (t('kyc.tapToUpload') || 'Tap to upload')}</div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Selfie + liveness
// ─────────────────────────────────────────────────────────────────────────────
function SelfieStep({ selfie, setSelfie, livenessVideo, setLivenessVideo, onNext, valid }: {
  selfie: Blob | null
  setSelfie: (b: Blob | null) => void
  livenessVideo: Blob | null
  setLivenessVideo: (b: Blob | null) => void
  onNext: () => void
  valid: boolean
}) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const [active, setActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setActive(true)
    } catch (e: any) {
      setError(e?.message ?? 'Camera permission denied')
    }
  }

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setActive(false)
    setRecording(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current) return
    const v = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(v, 0, 0)
    canvas.toBlob(blob => {
      if (blob) {
        haptics.success()
        setSelfie(blob)
      }
    }, 'image/jpeg', 0.9)
  }

  const recordLiveness = async () => {
    if (!streamRef.current) return
    if (recording) return
    try {
      const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' })
      const chunks: BlobPart[] = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        setLivenessVideo(blob)
        haptics.success()
      }
      recorderRef.current = mr
      mr.start()
      setRecording(true)
      // 4-second clip
      setTimeout(() => { try { mr.stop() } catch { /* ignore */ } setRecording(false) }, 4000)
    } catch (e: any) {
      setError(e?.message ?? 'Recording failed')
      setRecording(false)
    }
  }

  return (
    <>
      <div className="g" style={{ padding: 14, marginTop: 8, textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 4px' }}>{t('kyc.takeSelfie2') || 'Take a selfie'}</h3>
        <div className="t3" style={{ marginBottom: 10 }}>
          {t('kyc.centerFace') || 'Center your face inside the frame and ensure good lighting.'}
        </div>

        <div
          style={{
            position: 'relative',
            width: 220,
            height: 220,
            margin: '0 auto',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'rgba(0,0,0,.4)',
            border: `3px solid ${selfie ? 'var(--gl)' : 'var(--divider-soft)'}`,
          }}
        >
          {!active && !selfie && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Icon name="user" size={64} />
            </div>
          )}
          {active && (
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {selfie && !active && (
            <img src={URL.createObjectURL(selfie)} alt="Selfie preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {recording && (
            <div style={{ position: 'absolute', top: 8, right: 8, padding: '2px 8px', background: 'var(--r)', color: '#fff', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>● REC</div>
          )}
        </div>

        {error && <div style={{ color: 'var(--r)', marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {!active && !selfie && (
            <>
              <button className="btn btn-g" onClick={start}>
                <Icon name="camera" size={14} color="#fff" /> {t('kyc.openCamera') || 'Open camera'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelfie(f); haptics.success() } }} />
              <button className="btn btn-o" onClick={() => fileInputRef.current?.click()}>
                {t('kyc.uploadInstead') || 'Upload photo'}
              </button>
            </>
          )}
          {active && !selfie && (
            <>
              <button className="btn btn-g" onClick={capturePhoto}>{t('kyc.capture') || 'Capture'}</button>
              <button className="btn btn-o" onClick={recordLiveness} disabled={recording}>
                {recording ? (t('kyc.recording') || 'Recording…') : (t('kyc.recordLiveness') || 'Record liveness')}
              </button>
              <button className="btn" onClick={stop}>{t('common.cancel') || 'Cancel'}</button>
            </>
          )}
          {selfie && (
            <button className="btn btn-o" onClick={() => { setSelfie(null); setLivenessVideo(null); start() }}>
              {t('kyc.retake') || 'Retake'}
            </button>
          )}
        </div>

        {livenessVideo && (
          <div className="t3" style={{ marginTop: 8 }}>
            <span className="grn">✓</span> {t('kyc.livenessRecorded') || 'Liveness clip recorded'}
          </div>
        )}
      </div>

      <div className="g" style={{ padding: 12, marginTop: 8 }}>
        <h3 style={{ margin: '0 0 6px' }}>{t('kyc.selfieTips') || 'Tips for a clean selfie'}</h3>
        {[
          t('kyc.tipFaceCamera') || 'Face the camera directly',
          t('kyc.tipRemoveGlasses') || 'Remove glasses & headwear',
          t('kyc.tipGoodLighting') || 'Use bright, even lighting',
          t('kyc.tipNeutralExpression') || 'Neutral expression — no smiling',
        ].map(tip => (
          <div key={tip} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <span className="grn">✓</span>
            <span className="t3">{tip}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={onNext} disabled={!valid}>
        {t('common.continue') || 'Continue'}
      </button>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4: Review + submit
// ─────────────────────────────────────────────────────────────────────────────
function ReviewStep({ personal, docType, submit, submitting }: {
  personal: PersonalT
  docType: DocType
  submit: () => void
  submitting: boolean
}) {
  const { t } = useTranslation()
  const rows: Array<[string, string]> = [
    [t('kyc.fullName') || 'Full name', `${personal.firstName} ${personal.lastName}`.trim()],
    [t('kyc.dateOfBirth') || 'Date of birth', personal.dateOfBirth],
    [t('kyc.nationality') || 'Nationality', personal.nationality],
    [t('kyc.documentType') || 'Document type', docType === 'driving_license' ? "Driver's license" : docType === 'national_id' ? 'National ID' : 'Passport'],
    [t('kyc.address') || 'Address', `${personal.address}, ${personal.city}${personal.postalCode ? ' ' + personal.postalCode : ''}`],
    [t('kyc.country') || 'Country', personal.country],
  ]
  return (
    <>
      <div className="g" style={{ padding: 14, marginTop: 8 }}>
        <h3 style={{ margin: '0 0 8px' }}>{t('kyc.reviewYourInfo') || 'Review your information'}</h3>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--divider-soft)' }}>
            <span className="t3">{k}</span>
            <span style={{ color: 'var(--text-strong)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{v || '—'}</span>
          </div>
        ))}
      </div>
      <div className="g" style={{ padding: 10, marginTop: 8, background: 'rgba(0,200,83,.04)' }}>
        <div className="t3" style={{ lineHeight: 1.5 }}>
          {t('kyc.submitDisclaimer') || 'By submitting, you confirm the information is accurate. We use OCR + face matching + liveness to verify automatically. Manual review only if needed.'}
        </div>
      </div>
      <button className="btn btn-g" style={{ marginTop: 8 }} onClick={submit} disabled={submitting}>
        {submitting ? (t('kyc.submitting') || 'Submitting…') : (t('kyc.submitForReview') || 'Submit for verification')}
      </button>
    </>
  )
}

