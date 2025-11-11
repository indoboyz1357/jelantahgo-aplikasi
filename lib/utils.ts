export function normalizePhone(raw: string | undefined | null): string {
  if (!raw) return ''
  // Keep digits only
  let digits = String(raw).replace(/\D+/g, '')
  if (digits.startsWith('62')) {
    // +62 or 62xxxx -> convert to 0xxx
    digits = '0' + digits.slice(2)
  } else if (!digits.startsWith('0') && digits.length > 0) {
    // If doesn't start with 0, assume local and prefix 0
    digits = '0' + digits
  }
  return digits
}
