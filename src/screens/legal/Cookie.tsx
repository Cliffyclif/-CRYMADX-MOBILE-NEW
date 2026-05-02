import { LegalDoc } from './LegalDoc'
import { COOKIES_SECTIONS } from '../../data/legalSections'

export function Cookie() {
  return (
    <LegalDoc
      title="Cookie Policy"
      lastUpdated="April 1, 2026 · v1.4"
      sections={COOKIES_SECTIONS}
    />
  )
}
