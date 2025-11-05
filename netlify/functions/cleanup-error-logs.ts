import { Handler } from '@netlify/functions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Scheduled function to clean up error logs older than 90 days
 * Runs weekly on Sundays at 2 AM
 */
export const handler: Handler = async (event, _context) => {
  // Only allow scheduled invocations
  if (event.httpMethod !== 'POST' && (event as any).source !== 'netlify-scheduled') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        deletedCount: result.count,
        cutoffDate: ninetyDaysAgo.toISOString(),
      }),
    }
  } catch (error) {
    console.error('Error cleaning up error logs:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to clean up error logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  } finally {
    await prisma.$disconnect()
  }
}

