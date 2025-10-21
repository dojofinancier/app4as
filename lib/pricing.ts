import { Decimal } from '@prisma/client/runtime/library'

/**
 * Calculate price based on tutor's hourly base rate and duration
 * Pricing structure:
 * - 60 min = base rate
 * - 90 min = base rate × 1.5
 * - 120 min = base rate × 2
 */
export function calculatePrice(
  hourlyBaseRate: Decimal | number,
  durationMin: 60 | 90 | 120
): number {
  const baseRate = typeof hourlyBaseRate === 'number' 
    ? hourlyBaseRate 
    : hourlyBaseRate.toNumber()

  switch (durationMin) {
    case 60:
      return baseRate
    case 90:
      return baseRate * 1.5
    case 120:
      return baseRate * 2
    default:
      throw new Error(`Invalid duration: ${durationMin}. Must be 60, 90, or 120`)
  }
}

/**
 * Calculate discount based on coupon
 */
export function calculateDiscount(
  subtotal: number,
  coupon: {
    type: 'percent' | 'fixed'
    value: Decimal | number
  }
): number {
  const value = typeof coupon.value === 'number' 
    ? coupon.value 
    : coupon.value.toNumber()

  if (coupon.type === 'percent') {
    return subtotal * (value / 100)
  } else {
    return Math.min(value, subtotal) // Don't discount more than subtotal
  }
}

/**
 * Validate coupon is currently active and has redemptions available
 */
export function validateCoupon(coupon: {
  active: boolean
  startsAt: Date | null
  endsAt: Date | null
  maxRedemptions: number | null
  redemptionCount: number
}): { valid: boolean; reason?: string } {
  if (!coupon.active) {
    return { valid: false, reason: 'Coupon is not active' }
  }

  const now = new Date()

  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, reason: 'Coupon is not yet valid' }
  }

  if (coupon.endsAt && now > coupon.endsAt) {
    return { valid: false, reason: 'Coupon has expired' }
  }

  if (
    coupon.maxRedemptions !== null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    return { valid: false, reason: 'Coupon has reached max redemptions' }
  }

  return { valid: true }
}

/**
 * Calculate order totals with optional coupon
 */
export function calculateOrderTotals(
  items: Array<{ price: number }>,
  coupon?: {
    type: 'percent' | 'fixed'
    value: Decimal | number
  }
): {
  subtotal: number
  discount: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const discount = coupon ? calculateDiscount(subtotal, coupon) : 0
  const total = subtotal - discount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}


