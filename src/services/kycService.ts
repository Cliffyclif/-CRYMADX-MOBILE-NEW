/**
 * KYC service — talks directly to the in-house automatic KYC backend.
 *
 * Backend handles: OCR, face matching, liveness check, automatic decisioning.
 * Score 60-84% → manual review queue, 85+ → auto-approve, <60 → auto-reject.
 *
 * Endpoints (kyc-service via gateway):
 *   POST /api/kyc/submit   (multipart)
 *   GET  /api/kyc/status
 *   POST /api/kyc/retry
 */
import { getToken } from '../api/client'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'https://backend.crymadx.io/api').replace(/\/$/, '')

export type KYCStatus =
  | 'none'
  | 'pending'
  | 'processing'
  | 'manual_review'
  | 'approved'
  | 'rejected'

export interface KYCStatusResponse {
  status: KYCStatus
  documentType?: string
  extractedData?: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    idNumber?: string
    expiryDate?: string
    nationality?: string
  }
  faceMatchScore?: number
  rejectionReason?: string
  submittedAt?: string
  processedAt?: string
}

export interface KYCSubmissionResponse {
  success: boolean
  submissionId: string
  status: KYCStatus
  message?: string
}

export interface KYCSubmitInput {
  documentType: 'passport' | 'driving_license' | 'national_id'
  documentFront: File | Blob
  documentBack?: File | Blob
  selfie: File | Blob
  livenessVideo?: Blob
  personalInfo?: {
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    nationality?: string
    country?: string
    address?: string
    city?: string
    postalCode?: string
  }
  proofOfAddress?: File | Blob
  proofOfAddressType?: 'utility_bill' | 'bank_statement' | 'tax_return' | 'rental_agreement'
}

async function authedRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers ?? {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'omit' })
  const ct = res.headers.get('content-type') ?? ''
  let body: any = null
  if (ct.includes('application/json')) {
    try { body = await res.json() } catch { body = null }
  } else {
    try { body = await res.text() } catch { body = null }
  }
  if (!res.ok) {
    const msg = body?.error?.message ?? body?.message ?? body?.error ?? body ?? res.statusText
    throw new Error(typeof msg === 'string' ? msg : `KYC request failed (${res.status})`)
  }
  return body as T
}

export const kycService = {
  getStatus(): Promise<KYCStatusResponse> {
    return authedRequest<KYCStatusResponse>('/kyc/status', { method: 'GET' })
  },

  retry(): Promise<{ success: boolean; message: string }> {
    return authedRequest('/kyc/retry', { method: 'POST' })
  },

  async submit(data: KYCSubmitInput): Promise<KYCSubmissionResponse> {
    const fd = new FormData()
    fd.append('documentType', data.documentType)
    fd.append('documentFront', data.documentFront)
    if (data.documentBack) fd.append('documentBack', data.documentBack)
    fd.append('selfie', data.selfie)
    if (data.livenessVideo) fd.append('livenessVideo', data.livenessVideo, 'liveness.webm')
    if (data.personalInfo) fd.append('personalInfo', JSON.stringify(data.personalInfo))
    if (data.proofOfAddress) fd.append('proofOfAddress', data.proofOfAddress)
    if (data.proofOfAddressType) fd.append('proofOfAddressType', data.proofOfAddressType)
    return authedRequest<KYCSubmissionResponse>('/kyc/submit', { method: 'POST', body: fd })
  },
}

export default kycService
