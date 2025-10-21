-- ============================================================================
-- 4AS Tutor Booking App - Comprehensive RLS Policy Analysis
-- ============================================================================
-- Purpose: Analyze all RLS policies to identify conflicts and duplicates
-- Run this in Supabase SQL Editor to get a complete picture
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. OVERVIEW: RLS Status by Table
-- ----------------------------------------------------------------------------
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  CASE 
    WHEN COUNT(p.policyname) = 0 THEN '❌ NO POLICIES'
    WHEN COUNT(p.policyname) = 1 THEN '✅ SINGLE POLICY'
    WHEN COUNT(p.policyname) BETWEEN 2 AND 3 THEN '⚠️ MULTIPLE POLICIES'
    ELSE '🚨 MANY POLICIES'
  END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY policy_count DESC, t.tablename;

-- ----------------------------------------------------------------------------
-- 2. DETAILED POLICY LISTING
-- ----------------------------------------------------------------------------
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- 3. CONFLICT DETECTION: Same Table + Role + Command
-- ----------------------------------------------------------------------------
SELECT 
  tablename,
  cmd as command,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as conflicting_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename;

-- ----------------------------------------------------------------------------
-- 4. RECURRING SESSIONS SPECIFIC ANALYSIS
-- ----------------------------------------------------------------------------
SELECT 
  'recurring_sessions' as table_name,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'recurring_sessions'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- 5. TABLES WITH NO RLS POLICIES (Potential Security Issue)
-- ----------------------------------------------------------------------------
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  '❌ NO POLICIES - SECURITY RISK' as issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true 
  AND p.policyname IS NULL
ORDER BY t.tablename;

-- ----------------------------------------------------------------------------
-- 6. TABLES WITH RLS DISABLED (Potential Security Issue)
-- ----------------------------------------------------------------------------
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count,
  '⚠️ RLS DISABLED' as issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = false
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ----------------------------------------------------------------------------
-- 7. SUMMARY STATISTICS
-- ----------------------------------------------------------------------------
SELECT 
  'Total Tables' as metric,
  COUNT(*)::text as value
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Tables with RLS Enabled',
  COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true

UNION ALL

SELECT 
  'Tables with RLS Disabled',
  COUNT(*)::text
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false

UNION ALL

SELECT 
  'Total Policies',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Tables with Multiple Policies',
  COUNT(*)::text
FROM (
  SELECT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  HAVING COUNT(*) > 1
) as multi_policy_tables;
