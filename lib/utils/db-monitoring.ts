/**
 * Database query performance monitoring utilities
 * 
 * Use these to identify slow queries and optimize performance
 */

import { prisma } from '@/lib/prisma'

/**
 * Log slow queries (queries taking longer than threshold)
 */
export async function logSlowQueries(thresholdMs: number = 1000) {
  try {
    // Check if pg_stat_statements is enabled
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_extension 
      WHERE extname = 'pg_stat_statements'
    `
    
    if (result[0]?.count === BigInt(0)) {
      console.warn('pg_stat_statements extension not enabled. Cannot monitor slow queries.')
      return []
    }

    // Get slow queries from pg_stat_statements
    const slowQueries = await prisma.$queryRaw<Array<{
      query: string
      calls: bigint
      total_exec_time: number
      mean_exec_time: number
      max_exec_time: number
    }>>`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > ${thresholdMs}
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `

    if (slowQueries.length > 0) {
      console.warn(`Found ${slowQueries.length} slow queries (threshold: ${thresholdMs}ms):`)
      slowQueries.forEach((q, i) => {
        console.warn(`  ${i + 1}. Mean: ${q.mean_exec_time.toFixed(2)}ms, Max: ${q.max_exec_time.toFixed(2)}ms, Calls: ${q.calls}`)
        console.warn(`     Query: ${q.query.substring(0, 200)}...`)
      })
    }

    return slowQueries
  } catch (error) {
    console.error('Error monitoring slow queries:', error)
    return []
  }
}

/**
 * Get database connection stats
 */
export async function getConnectionStats() {
  try {
    const stats = await prisma.$queryRaw<Array<{
      state: string
      count: bigint
    }>>`
      SELECT 
        state,
        COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `

    return stats.map(s => ({
      state: s.state,
      count: Number(s.count),
    }))
  } catch (error) {
    console.error('Error getting connection stats:', error)
    return []
  }
}

/**
 * Get table sizes and index usage
 */
export async function getTableStats() {
  try {
    const stats = await prisma.$queryRaw<Array<{
      tablename: string
      table_size: string
      indexes_size: string
      total_size: string
      row_count: bigint
    }>>`
      SELECT 
        schemaname||'.'||tablename as tablename,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        (SELECT COUNT(*) FROM information_schema.tables t2 
         WHERE t2.table_schema = schemaname AND t2.table_name = tablename) as row_count
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 20
    `

    return stats.map(s => ({
      tablename: s.tablename,
      table_size: s.table_size,
      indexes_size: s.indexes_size,
      total_size: s.total_size,
      row_count: Number(s.row_count),
    }))
  } catch (error) {
    console.error('Error getting table stats:', error)
    return []
  }
}

/**
 * Run ANALYZE on specific tables
 */
export async function analyzeTables(tableNames: string[]) {
  try {
    for (const tableName of tableNames) {
      await prisma.$executeRawUnsafe(`ANALYZE ${tableName}`)
      console.log(`Analyzed table: ${tableName}`)
    }
    return { success: true }
  } catch (error) {
    console.error('Error analyzing tables:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Get index usage statistics
 */
export async function getIndexUsage() {
  try {
    const indexStats = await prisma.$queryRaw<Array<{
      schemaname: string
      tablename: string
      indexname: string
      idx_scan: bigint
      idx_tup_read: bigint
      idx_tup_fetch: bigint
    }>>`
      SELECT 
        schemaname,
        tablename,
        indexrelname as indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC
      LIMIT 50
    `

    return indexStats.map(s => ({
      schemaname: s.schemaname,
      tablename: s.tablename,
      indexname: s.indexname,
      scans: Number(s.idx_scan),
      tuples_read: Number(s.idx_tup_read),
      tuples_fetched: Number(s.idx_tup_fetch),
    }))
  } catch (error) {
    console.error('Error getting index usage:', error)
    return []
  }
}

