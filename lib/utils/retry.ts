/**
 * Retry utility with exponential backoff
 * 
 * Automatically retries failed operations with exponential backoff delay
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  retryable?: (error: unknown) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryable: () => true, // Retry all errors by default
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if error is retryable
      if (!config.retryable(error)) {
        throw error
      }

      // Don't wait after last attempt
      if (attempt === config.maxAttempts) {
        break
      }

      // Calculate delay with exponential backoff
      const delayMs = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      )

      console.log(`Retry attempt ${attempt}/${config.maxAttempts} after ${delayMs}ms`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw lastError
}

/**
 * Check if an error is a network error (retryable)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    )
  }
  return false
}

/**
 * Check if an error is a server error (5xx - retryable)
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof Error && 'status' in error) {
    const status = (error as Error & { status: number }).status
    return status >= 500 && status < 600
  }
  return false
}

/**
 * Retry configuration for API calls
 */
export const API_RETRY_CONFIG: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryable: (error) => isNetworkError(error) || isServerError(error),
}

/**
 * Retry configuration for database operations
 */
export const DB_RETRY_CONFIG: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryable: (error) => {
    // Retry on connection errors, timeouts, and deadlocks
    if (error instanceof Error) {
      return (
        error.message.includes('connection') ||
        error.message.includes('timeout') ||
        error.message.includes('deadlock') ||
        error.message.includes('P1001') || // Prisma connection error
        error.message.includes('P1008')    // Prisma timeout error
      )
    }
    return false
  },
}

