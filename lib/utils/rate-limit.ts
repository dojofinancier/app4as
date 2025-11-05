/**
 * Rate Limiting Utility for API Routes
 * 
 * Simple in-memory rate limiter for Netlify serverless functions.
 * Uses a Map to track request counts per identifier (IP or user ID).
 * 
 * Note: This is a simple in-memory solution. For production at scale,
 * consider upgrading to Redis or Upstash for distributed rate limiting.
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  identifier: string // IP address or user ID
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp when limit resets
  retryAfter?: number // Seconds until retry allowed
}

// In-memory store for rate limit data
// Structure: Map<identifier, { count: number, resetTime: number }>
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
let lastCleanup = Date.now()

function cleanupOldEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { windowMs, maxRequests, identifier } = config
  const now = Date.now()
  const resetTime = now + windowMs

  // Cleanup old entries periodically
  cleanupOldEntries()

  // Get current rate limit data
  const current = rateLimitStore.get(identifier)

  if (!current || current.resetTime < now) {
    // No existing limit or window expired, create new entry
    rateLimitStore.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Math.floor(resetTime / 1000),
    }
  }

  // Increment count
  current.count++

  if (current.count > maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((current.resetTime - now) / 1000)
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.floor(current.resetTime / 1000),
      retryAfter,
    }
  }

  // Within limit
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - current.count,
    reset: Math.floor(current.resetTime / 1000),
  }
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getIdentifier(request: Request, userId?: string | null): string {
  // Use user ID if available (for user-based rate limiting)
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Authentication endpoints (very strict)
  AUTH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
  // Payment endpoints (strict)
  PAYMENT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // General API routes (moderate)
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Public endpoints (lenient)
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
} as const

/**
 * Rate limit middleware for API routes
 * Returns Response if rate limited, null if OK
 */
export function rateLimit(
  request: Request,
  type: keyof typeof RATE_LIMITS,
  userId?: string | null
): Response | null {
  const config = RATE_LIMITS[type]
  const identifier = getIdentifier(request, userId)
  
  const result = checkRateLimit({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    identifier,
  })

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter || 60),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.reset),
        },
      }
    )
  }

  return null // Request is allowed
}

