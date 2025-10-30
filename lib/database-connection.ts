import { prisma } from './prisma'

/**
 * Database connection utility with retry logic for intermittent connection issues
 */

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  backoffMultiplier?: number
}

const defaultRetryOptions: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
}

/**
 * Execute a database operation with retry logic for connection failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, delayMs, backoffMultiplier } = { ...defaultRetryOptions, ...options }
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Check if it's a connection error that should be retried
      if (isRetryableError(error) && attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt)
        console.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // If it's not retryable or we've exhausted retries, throw the error
      throw error
    }
  }
  
  throw lastError
}

/**
 * Check if an error is retryable (connection-related)
 */
function isRetryableError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code || ''
  
  // Prisma connection errors
  if (errorCode === 'P1001' || errorCode === 'P1002' || errorCode === 'P1008') {
    return true
  }
  
  // Network-related error messages
  const retryableMessages = [
    "can't reach database server",
    "connection refused",
    "connection timeout",
    "network error",
    "socket hang up",
    "econnreset",
    "enotfound",
    "etimedout"
  ]
  
  return retryableMessages.some(msg => errorMessage.includes(msg))
}

/**
 * Test database connectivity
 */
export async function testConnection(): Promise<boolean> {
  try {
    await withRetry(async () => {
      await prisma.$queryRaw`SELECT 1`
    })
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}
