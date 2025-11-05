/**
 * Environment Variable Validation
 * 
 * Validates critical environment variables on app startup.
 * Fails fast with clear error messages if required variables are missing.
 * 
 * This is especially important for Netlify deployments where:
 * - Build-time variables are checked, but server-side variables are only checked at runtime
 * - Missing variables can cause silent failures in production
 * - Clear error messages help debug configuration issues quickly
 */

interface EnvValidationResult {
  valid: boolean
  missing: string[]
  errors: string[]
}

/**
 * Validates all required environment variables
 * Returns validation result with missing variables and errors
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = []
  const errors: string[] = []

  // Required variables (app won't work without these)
  const required: Record<string, { name: string; description: string }> = {
    DATABASE_URL: {
      name: 'DATABASE_URL',
      description: 'PostgreSQL connection string (Supabase pooler or direct)',
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      description: 'Supabase project URL (e.g., https://xxx.supabase.co)',
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      description: 'Supabase anonymous/public key',
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key (server-side only)',
    },
    STRIPE_SECRET_KEY: {
      name: 'STRIPE_SECRET_KEY',
      description: 'Stripe secret key (sk_test_... or sk_live_...)',
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      description: 'Stripe publishable key (pk_test_... or pk_live_...)',
    },
    STRIPE_WEBHOOK_SECRET: {
      name: 'STRIPE_WEBHOOK_SECRET',
      description: 'Stripe webhook signing secret (whsec_...)',
    },
  }

  // Check required variables
  for (const [key, info] of Object.entries(required)) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
      errors.push(`Missing ${info.name}: ${info.description}`)
    }
  }

  // Validate format of critical variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must start with https://')
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (stripeSecretKey && !stripeSecretKey.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_')
  }

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (stripePublishableKey && !stripePublishableKey.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_')
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (stripeWebhookSecret && !stripeWebhookSecret.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET must start with whsec_')
  }

  // Optional variables (with warnings)
  const optional: Record<string, string> = {
    MAKE_SIGNUP_WEBHOOK_URL: 'Make.com webhook for signups',
    MAKE_BOOKING_WEBHOOK_URL: 'Make.com webhook for bookings',
    NEXT_PUBLIC_APP_URL: 'App URL for redirects (defaults to Netlify URL)',
  }

  const missingOptional: string[] = []
  for (const [key, description] of Object.entries(optional)) {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      missingOptional.push(`${key} (${description})`)
    }
  }

  // Log warnings for missing optional variables (non-blocking)
  if (missingOptional.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Optional environment variables not set:')
    missingOptional.forEach((varName) => {
      console.warn(`   - ${varName}`)
    })
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  }
}

/**
 * Validates specific environment variables for a route
 * Use this for minimal validation on critical routes
 */
export function validateEnvForRoute(requiredVars: string[]): void {
  const missing: string[] = []
  const errors: string[] = []

  for (const key of requiredVars) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
      errors.push(`Missing required environment variable: ${key}`)
    }
  }

  // Validate format for specific variables
  if (requiredVars.includes('STRIPE_SECRET_KEY')) {
    const key = process.env.STRIPE_SECRET_KEY
    if (key && !key.startsWith('sk_')) {
      errors.push('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_')
    }
  }

  if (requiredVars.includes('STRIPE_WEBHOOK_SECRET')) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (secret && !secret.startsWith('whsec_')) {
      errors.push('STRIPE_WEBHOOK_SECRET must start with whsec_')
    }
  }

  if (requiredVars.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (url && !url.startsWith('https://')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must start with https://')
    }
  }

  if (missing.length > 0 || errors.length > 0) {
    const errorMessage = [
      '❌ Environment variable validation failed:',
      '',
      ...errors,
      '',
      'Missing variables:',
      ...missing.map((key) => `  - ${key}`),
      '',
      'Please check your Netlify environment variables:',
      'Site Settings → Environment Variables',
    ].join('\n')

    // Always throw in production, log warning in development
    if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
      throw new Error(errorMessage)
    }
    console.error(errorMessage)
  }
}

/**
 * Validates environment variables and throws if critical ones are missing
 * Call this early in your app (e.g., in root layout or API route handlers)
 */
export function ensureEnvValid(): void {
  // Skip validation in development if explicitly disabled
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return
  }

  const result = validateEnv()

  if (!result.valid) {
    const errorMessage = [
      '❌ Environment variable validation failed:',
      '',
      ...result.errors,
      '',
      'Please check your Netlify environment variables:',
      'Site Settings → Environment Variables',
      '',
      'Required variables:',
      ...result.missing.map((key) => `  - ${key}`),
    ].join('\n')

    // In production/build, throw error to fail fast
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.NETLIFY) {
      throw new Error(errorMessage)
    }

    // In development, log warning but don't throw (allow local dev without all vars)
    console.error(errorMessage)
    console.warn('⚠️  Continuing in development mode, but app may not work correctly.')
  } else {
    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully')
    }
  }
}

/**
 * Get a validated environment variable with fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    if (fallback) {
      return fallback
    }
    throw new Error(`Environment variable ${key} is required but not set`)
  }
  return value
}

