import { LegalDoc } from './LegalDoc'
import { PRIVACY_SECTIONS } from '../../data/legalSections'

export function Privacy() {
  return (
    <LegalDoc
      title="Privacy Policy"
      lastUpdated="April 1, 2026 · v2.8"
      sections={PRIVACY_SECTIONS}
    />
  )
}
