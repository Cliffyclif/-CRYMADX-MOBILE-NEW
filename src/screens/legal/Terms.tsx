import { LegalDoc } from './LegalDoc'
import { TERMS_SECTIONS } from '../../data/legalSections'

export function Terms() {
  return (
    <LegalDoc
      title="Terms of Service"
      lastUpdated="April 1, 2026 · v3.2"
      sections={TERMS_SECTIONS}
    />
  )
}
