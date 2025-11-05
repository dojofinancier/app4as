/**
 * Netlify Scheduled Function: Analyze Database Tables
 * 
 * Purpose: Run ANALYZE on critical tables to update query planner statistics
 * Schedule: Weekly (recommended: Sunday 2 AM EST)
 * 
 * Configuration in netlify.toml:
 * [[schedule]]
 * cron = "0 2 * * 0"  # Every Sunday at 2 AM
 * function = "analyze-database"
 */

import { Handler } from '@netlify/functions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Critical tables that should be analyzed regularly
const CRITICAL_TABLES = [
  'appointments',
  'orders',
  'order_items',
  'slot_holds',
  'tutor_ratings',
  'messages',
  'support_tickets',
  'webhook_events',
] as const

export const handler: Handler = async (event, _context) => {
  // Only allow scheduled execution (not manual triggers)
  if ((event as any).source !== 'netlify-scheduled') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'This function can only be triggered by scheduled events' }),
    }
  }

  const startTime = Date.now()
  const results: Array<{ table: string; success: boolean; error?: string; duration?: number }> = []

  try {
    console.log(`Starting database ANALYZE for ${CRITICAL_TABLES.length} tables...`)

    for (const tableName of CRITICAL_TABLES) {
      const tableStartTime = Date.now()
      try {
        // Use executeRawUnsafe to run ANALYZE (Prisma doesn't have direct ANALYZE support)
        await prisma.$executeRawUnsafe(`ANALYZE ${tableName}`)
        const duration = Date.now() - tableStartTime
        results.push({
          table: tableName,
          success: true,
          duration,
        })
        console.log(`✓ Analyzed ${tableName} (${duration}ms)`)
      } catch (error) {
        const duration = Date.now() - tableStartTime
        results.push({
          table: tableName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
        })
        console.error(`✗ Failed to analyze ${tableName}:`, error)
      }
    }

    const totalDuration = Date.now() - startTime
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(
      `Database ANALYZE completed: ${successCount} succeeded, ${failureCount} failed (${totalDuration}ms total)`
    )

    await prisma.$disconnect()

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        summary: {
          totalTables: CRITICAL_TABLES.length,
          successCount,
          failureCount,
          totalDuration,
        },
        results,
        timestamp: new Date().toISOString(),
      }),
    }
  } catch (error) {
    console.error('Fatal error in analyze-database function:', error)
    await prisma.$disconnect()

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        results,
        timestamp: new Date().toISOString(),
      }),
    }
  }
}

