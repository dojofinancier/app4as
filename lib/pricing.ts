// ============================================================================
// 4AS Tutor Booking App - Dual Rate Pricing Calculator
// ============================================================================
// Purpose: Calculate student prices and tutor earnings with dual rate system
// ============================================================================

import { Decimal } from '@prisma/client/runtime/library'

// Duration multipliers for different session lengths
export const DURATION_MULTIPLIERS = {
  60: 1.0,    // 1 hour = base rate
  90: 1.5,    // 1.5 hours = base rate × 1.5
  120: 2.0,   // 2 hours = base rate × 2
} as const

export type DurationMinutes = keyof typeof DURATION_MULTIPLIERS

// ============================================================================
// STUDENT PRICING (What students pay)
// ============================================================================

/**
 * Calculate the price a student pays for a session
 * @param courseRate - The course's student rate (what students pay)
 * @param durationMin - Session duration in minutes (60, 90, or 120)
 * @returns Student price in CAD
 */
export function calculateStudentPrice(
  courseRate: number | Decimal | string,
  durationMin: DurationMinutes
): number {
  const rate = toNumeric(courseRate)
  const multiplier = DURATION_MULTIPLIERS[durationMin]
  return rate * multiplier
}

/**
 * Calculate student price with coupon discount
 * @param basePrice - Base student price
 * @param couponType - 'percent' or 'fixed'
 * @param couponValue - Discount value
 * @returns Final student price after discount
 */
export function calculateStudentPriceWithCoupon(
  basePrice: number,
  couponType: 'percent' | 'fixed',
  couponValue: number
): number {
  if (couponType === 'percent') {
    return basePrice * (1 - couponValue / 100)
  } else {
    return Math.max(0, basePrice - couponValue)
  }
}

// ============================================================================
// TUTOR EARNINGS (What tutors earn)
// ============================================================================

/**
 * Calculate what a tutor earns for a session
 * @param tutorRate - The tutor's hourly rate (what tutor earns)
 * @param durationMin - Session duration in minutes (60, 90, or 120)
 * @returns Tutor earnings in CAD
 */
export function calculateTutorEarnings(
  tutorRate: number | Decimal | string,
  durationMin: DurationMinutes
): number {
  const rate = toNumeric(tutorRate)
  const multiplier = DURATION_MULTIPLIERS[durationMin]
  return rate * multiplier
}

// ============================================================================
// MARGIN CALCULATIONS
// ============================================================================

/**
 * Calculate the gross margin for a session
 * @param studentPrice - What the student pays
 * @param tutorEarnings - What the tutor earns
 * @returns Gross margin in CAD
 */
export function calculateMargin(studentPrice: number, tutorEarnings: number): number {
  return studentPrice - tutorEarnings
}

/**
 * Calculate the margin percentage
 * @param studentPrice - What the student pays
 * @param tutorEarnings - What the tutor earns
 * @returns Margin percentage (0-100)
 */
export function calculateMarginPercentage(studentPrice: number, tutorEarnings: number): number {
  if (studentPrice === 0) return 0
  return ((studentPrice - tutorEarnings) / studentPrice) * 100
}

// ============================================================================
// COMPREHENSIVE PRICING CALCULATOR
// ============================================================================

export interface PricingCalculation {
  // Input
  courseRate: number
  tutorRate: number
  durationMin: DurationMinutes
  couponType?: 'percent' | 'fixed'
  couponValue?: number
  
  // Output
  baseStudentPrice: number
  finalStudentPrice: number
  tutorEarnings: number
  grossMargin: number
  marginPercentage: number
  discountAmount: number
}

/**
 * Calculate complete pricing breakdown for a session
 * @param params - Pricing parameters
 * @returns Complete pricing calculation
 */
export function calculateSessionPricing(params: {
  courseRate: number | Decimal | string
  tutorRate: number | Decimal | string
  durationMin: DurationMinutes
  couponType?: 'percent' | 'fixed'
  couponValue?: number
}): PricingCalculation {
  const courseRate = toNumeric(params.courseRate)
  const tutorRate = toNumeric(params.tutorRate)
  
  // Calculate base prices
  const baseStudentPrice = calculateStudentPrice(courseRate, params.durationMin)
  const tutorEarnings = calculateTutorEarnings(tutorRate, params.durationMin)
  
  // Apply coupon if provided
  let finalStudentPrice = baseStudentPrice
  let discountAmount = 0
  
  if (params.couponType && params.couponValue) {
    finalStudentPrice = calculateStudentPriceWithCoupon(
      baseStudentPrice,
      params.couponType,
      params.couponValue
    )
    discountAmount = baseStudentPrice - finalStudentPrice
  }
  
  // Calculate margins
  const grossMargin = calculateMargin(finalStudentPrice, tutorEarnings)
  const marginPercentage = calculateMarginPercentage(finalStudentPrice, tutorEarnings)
  
  return {
    courseRate,
    tutorRate,
    durationMin: params.durationMin,
    couponType: params.couponType,
    couponValue: params.couponValue,
    baseStudentPrice,
    finalStudentPrice,
    tutorEarnings,
    grossMargin,
    marginPercentage,
    discountAmount,
  }
}

// ============================================================================
// CART CALCULATIONS
// ============================================================================

export interface CartItemPricing {
  courseId: string
  tutorId: string
  durationMin: DurationMinutes
  courseRate: number
  tutorRate: number
  basePrice: number
  finalPrice: number
  tutorEarnings: number
  margin: number
}

/**
 * Calculate pricing for a cart item
 * @param item - Cart item data
 * @returns Pricing breakdown for cart item
 */
export function calculateCartItemPricing(item: {
  courseRate: number | Decimal | string
  tutorRate: number | Decimal | string
  durationMin: DurationMinutes
}): Omit<CartItemPricing, 'courseId' | 'tutorId'> {
  const calculation = calculateSessionPricing({
    courseRate: item.courseRate,
    tutorRate: item.tutorRate,
    durationMin: item.durationMin,
  })
  
  return {
    durationMin: item.durationMin,
    courseRate: calculation.courseRate,
    tutorRate: calculation.tutorRate,
    basePrice: calculation.baseStudentPrice,
    finalPrice: calculation.finalStudentPrice,
    tutorEarnings: calculation.tutorEarnings,
    margin: calculation.grossMargin,
  }
}

// ============================================================================
// ORDER CALCULATIONS
// ============================================================================

export interface OrderPricing {
  subtotal: number
  discount: number
  total: number
  totalTutorEarnings: number
  totalMargin: number
  marginPercentage: number
  items: Array<{
    courseId: string
    tutorId: string
    durationMin: DurationMinutes
    studentPrice: number
    tutorEarnings: number
    margin: number
  }>
}

/**
 * Calculate complete order pricing
 * @param items - Order items with pricing data
 * @param couponType - Applied coupon type
 * @param couponValue - Applied coupon value
 * @returns Complete order pricing breakdown
 */
export function calculateOrderPricing(
  items: Array<{
    courseId: string
    tutorId: string
    durationMin: DurationMinutes
    courseRate: number | Decimal | string
    tutorRate: number | Decimal | string
  }>,
  couponType?: 'percent' | 'fixed',
  couponValue?: number
): OrderPricing {
  // Calculate individual item pricing
  const itemPricing = items.map(item => {
    const calculation = calculateSessionPricing({
      courseRate: item.courseRate,
      tutorRate: item.tutorRate,
      durationMin: item.durationMin,
    })
    
    return {
      courseId: item.courseId,
      tutorId: item.tutorId,
      durationMin: item.durationMin,
      studentPrice: calculation.finalStudentPrice,
      tutorEarnings: calculation.tutorEarnings,
      margin: calculation.grossMargin,
    }
  })
  
  // Calculate totals
  const subtotal = itemPricing.reduce((sum, item) => sum + item.studentPrice, 0)
  const totalTutorEarnings = itemPricing.reduce((sum, item) => sum + item.tutorEarnings, 0)
  const totalMargin = itemPricing.reduce((sum, item) => sum + item.margin, 0)
  
  // Apply order-level coupon if provided
  let discount = 0
  let total = subtotal
  
  if (couponType && couponValue) {
    if (couponType === 'percent') {
      discount = subtotal * (couponValue / 100)
    } else {
      discount = Math.min(couponValue, subtotal)
    }
    total = subtotal - discount
  }
  
  const marginPercentage = total > 0 ? (totalMargin / total) * 100 : 0
  
  return {
    subtotal,
    discount,
    total,
    totalTutorEarnings,
    totalMargin,
    marginPercentage,
    items: itemPricing,
  }
}

// ============================================================================
// COUPON VALIDATION
// ============================================================================

export interface CouponValidation {
  valid: boolean
  reason?: string
}

/**
 * Validate a coupon
 * @param coupon - Coupon object from database
 * @returns Validation result
 */
export function validateCoupon(coupon: {
  active: boolean
  startsAt: Date | null
  endsAt: Date | null
  maxRedemptions: number | null
  redemptionCount: number
}): CouponValidation {
  if (!coupon.active) {
    return { valid: false, reason: 'Ce code promo n\'est plus actif' }
  }

  const now = new Date()
  
  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, reason: 'Ce code promo n\'est pas encore valide' }
  }

  if (coupon.endsAt && now > coupon.endsAt) {
    return { valid: false, reason: 'Ce code promo a expiré' }
  }

  if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { valid: false, reason: 'Ce code promo a atteint sa limite d\'utilisation' }
  }

  return { valid: true }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency for display
 * @param amount - Amount in CAD
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount)
}

/**
 * Validate duration is supported
 * @param durationMin - Duration in minutes
 * @returns True if duration is valid
 */
export function isValidDuration(durationMin: number): durationMin is DurationMinutes {
  return durationMin in DURATION_MULTIPLIERS
}

/**
 * Get duration label for display
 * @param durationMin - Duration in minutes
 * @returns Human-readable duration label
 */
export function getDurationLabel(durationMin: DurationMinutes): string {
  const hours = durationMin / 60
  if (hours === 1) return '1 heure'
  if (hours === 1.5) return '1h30'
  if (hours === 2) return '2 heures'
  return `${hours} heures`
}

// ============================================================================
// INTERNAL NUMERIC COERCION
// ============================================================================

function toNumeric(value: number | Decimal | string | null | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }
  if (value && typeof (value as any).toNumber === 'function') {
    try {
      return (value as any).toNumber()
    } catch {
      // fallthrough
    }
  }
  const fallback = Number(value as any)
  return Number.isNaN(fallback) ? 0 : fallback
}