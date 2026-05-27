// Human-name allowlist. Mirrors the backend rule (auth-service, user-service,
// ai-gateway-service): Unicode letters plus space, apostrophe, hyphen and period
// only. Must start with a letter. Rejects digits and all other symbols, which
// blocks HTML/script injection in the name field.
export const NAME_REGEX = /^\p{L}[\p{L}\p{M}\s'.-]*$/u
export const NAME_VALIDATION_MESSAGE =
  'Name may only contain letters, spaces, hyphens, apostrophes and periods'

export function isValidName(name: string): boolean {
  return NAME_REGEX.test(name.trim())
}
