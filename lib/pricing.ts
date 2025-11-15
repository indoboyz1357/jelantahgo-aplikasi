import prisma from '@/lib/prisma';

// Cache settings for 5 minutes to reduce database calls
let settingsCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get system settings with caching
 */
export async function getSettings() {
  const now = Date.now();

  // Return cached settings if still valid
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  // Fetch from database
  let settings = await prisma.settings.findFirst();

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.settings.create({
      data: {}
    });
  }

  // Update cache
  settingsCache = settings;
  cacheTimestamp = now;

  return settings;
}

/**
 * Calculate price per liter based on volume using tiered pricing
 */
export async function getPricePerLiter(volume: number): Promise<number> {
  const settings = await getSettings();

  // Tier 1: 1-99 liters
  if (volume >= settings.priceTier1Min && volume <= settings.priceTier1Max) {
    return settings.priceTier1Rate;
  }

  // Tier 2: 100-199 liters
  if (volume >= settings.priceTier2Min && volume <= settings.priceTier2Max) {
    return settings.priceTier2Rate;
  }

  // Tier 3: 200+ liters
  if (volume >= settings.priceTier3Min) {
    return settings.priceTier3Rate;
  }

  // Default to tier 1 rate if volume is less than minimum
  return settings.priceTier1Rate;
}

/**
 * Calculate total price based on volume
 */
export async function calculateTotalPrice(volume: number): Promise<number> {
  const pricePerLiter = await getPricePerLiter(volume);
  return volume * pricePerLiter;
}

/**
 * Calculate courier commission based on volume
 */
export async function calculateCourierCommission(volume: number): Promise<number> {
  const settings = await getSettings();
  return volume * settings.courierCommissionPerLiter;
}

/**
 * Get courier daily salary
 */
export async function getCourierDailySalary(): Promise<number> {
  const settings = await getSettings();
  return settings.courierDailySalary;
}

/**
 * Calculate affiliate commission based on volume
 */
export async function calculateAffiliateCommission(volume: number): Promise<number> {
  const settings = await getSettings();
  return volume * settings.affiliateCommissionPerLiter;
}

/**
 * Get pricing breakdown for a given volume
 */
export async function getPricingBreakdown(volume: number) {
  const pricePerLiter = await getPricePerLiter(volume);
  const totalPrice = volume * pricePerLiter;
  const courierCommission = await calculateCourierCommission(volume);
  const affiliateCommission = await calculateAffiliateCommission(volume);

  return {
    volume,
    pricePerLiter,
    totalPrice,
    courierCommission,
    affiliateCommission
  };
}

/**
 * Clear settings cache (use after updating settings)
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
}
