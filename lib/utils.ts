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

import prisma from './prisma';

/**
 * Generate unique referral code
 */
export async function generateReferralCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    // Generate 8 character code
    code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existing = await prisma.user.findUnique({
      where: { referralCode: code }
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}
