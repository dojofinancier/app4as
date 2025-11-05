/**
 * Production-safe logging utility
 * 
 * Provides different log levels for better control over what gets logged
 * in development vs production environments.
 * 
 * Usage:
 *   import { logger } from '@/lib/utils/logger'
 *   logger.debug('Debug message')  // Only in development
 *   logger.info('Info message')    // Only in development
 *   logger.warn('Warning message') // Always logged
 *   logger.error('Error message')  // Always logged
 */

const isDev = process.env.NODE_ENV === 'development'

/**
 * Logger utility with different log levels
 */
export const logger = {
  /**
   * Debug logs - only in development
   * Use for detailed debugging information
   */
  debug: (...args: any[]): void => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Info logs - only in development
   * Use for general informational messages
   */
  info: (...args: any[]): void => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },

  /**
   * Warning logs - always logged
   * Use for warnings that should be visible in production
   */
  warn: (...args: any[]): void => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Error logs - always logged
   * Use for errors that need monitoring in production
   * 
   * Future enhancement: Integrate with error tracking service (Sentry, LogRocket, etc.)
   * for production error monitoring and alerting.
   */
  error: (...args: any[]): void => {
    console.error('[ERROR]', ...args)
    // Future: Send to error tracking service (Sentry, etc.)
  },
}

/**
 * Helper to conditionally log based on environment
 * Useful for verbose logging that should only happen in development
 */
export function logIfDev(...args: any[]): void {
  if (isDev) {
    console.log(...args)
  }
}

