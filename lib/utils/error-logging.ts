'use server'

import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export type ErrorType = 'client' | 'server' | 'api' | 'database' | 'validation' | 'network'
export type ErrorSeverity = 'error' | 'warning' | 'critical'

export interface ErrorContext {
  url?: string
  method?: string
  requestId?: string
  [key: string]: unknown
}

/**
 * Log an error to the database and send webhook notification
 * 
 * @param message - Error message
 * @param errorType - Type of error (client/server/api/database)
 * @param severity - Error severity (error/warning/critical)
 * @param userId - User ID if authenticated (optional)
 * @param stack - Stack trace (optional)
 * @param context - Additional context (URL, request data, etc.)
 */
export async function logError(
  message: string,
  errorType: ErrorType = 'server',
  severity: ErrorSeverity = 'error',
  options?: {
    userId?: string
    stack?: string
    context?: ErrorContext
    userAgent?: string
    url?: string
  }
): Promise<string> {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    // Get user agent and URL from headers if available
    const headersList = await headers()
    const userAgent = options?.userAgent || headersList.get('user-agent') || undefined
    const url = options?.url || headersList.get('referer') || undefined

    // Log to database
    const errorLog = await prisma.errorLog.create({
      data: {
        id: errorId,
        message,
        stack: options?.stack,
        userId: options?.userId,
        errorType,
        severity,
        context: options?.context || undefined,
        userAgent,
        url,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Send Make.com webhook for all errors
    try {
      const { sendErrorOccurredWebhook } = await import('@/lib/webhooks/make')
      await sendErrorOccurredWebhook({
        errorId,
        message,
        errorType,
        severity,
        userId: errorLog.userId || undefined,
        userEmail: errorLog.user?.email || undefined,
        url: errorLog.url || undefined,
        stack: errorLog.stack || undefined,
        context: errorLog.context || undefined,
        timestamp: errorLog.createdAt.toISOString(),
      })
    } catch (webhookError) {
      // Don't fail error logging if webhook fails
      console.error('Failed to send error webhook:', webhookError)
    }

    console.error(`[${errorType.toUpperCase()}] ${severity}: ${message}`, {
      errorId,
      userId: options?.userId,
      url,
    })

    return errorId
  } catch (dbError) {
    // Fallback: log to console if database fails
    console.error('Failed to log error to database:', dbError)
    console.error('Original error:', message, {
      errorType,
      severity,
      userId: options?.userId,
      stack: options?.stack,
    })
    return errorId
  }
}

/**
 * Log a client-side error
 */
export async function logClientError(
  message: string,
  stack?: string,
  context?: ErrorContext
): Promise<string> {
  return logError(message, 'client', 'error', {
    stack,
    context,
  })
}

/**
 * Log a server-side error
 */
export async function logServerError(
  message: string,
  stack?: string,
  userId?: string,
  context?: ErrorContext
): Promise<string> {
  return logError(message, 'server', 'error', {
    userId,
    stack,
    context,
  })
}

/**
 * Log a critical error (requires immediate attention)
 */
export async function logCriticalError(
  message: string,
  errorType: ErrorType = 'server',
  stack?: string,
  userId?: string,
  context?: ErrorContext
): Promise<string> {
  return logError(message, errorType, 'critical', {
    userId,
    stack,
    context,
  })
}

/**
 * Clean up old error logs (90 days retention)
 * Should be called by a scheduled function
 */
export async function cleanupOldErrorLogs(): Promise<number> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const result = await prisma.errorLog.deleteMany({
    where: {
      createdAt: {
        lt: ninetyDaysAgo,
      },
    },
  })

  console.log(`Cleaned up ${result.count} error logs older than 90 days`)
  return result.count
}

