-- ============================================================================
-- 4AS Tutor Booking App - RLS Policy Conflict Investigation
-- ============================================================================
-- Purpose: Detailed investigation of policy conflicts
-- Run this in Supabase SQL Editor to identify specific conflicts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DETAILED CONFLICT ANALYSIS
-- ----------------------------------------------------------------------------
SELECT 
  tablename,
  cmd as command,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as conflicting_policies,
  'CONFLICT DETECTED' as issue
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename;

-- ----------------------------------------------------------------------------
-- 2. SHOW FULL DETAILS OF CONFLICTING POLICIES
-- ----------------------------------------------------------------------------
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check,
  'CONFLICTING POLICY' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename, cmd, roles) IN (
    SELECT tablename, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd, roles
    HAVING COUNT(*) > 1
  )
ORDER BY tablename, cmd, roles, policyname;

-- ----------------------------------------------------------------------------
-- 3. CHECK FOR SPECIFIC COMMON CONFLICTS
-- ----------------------------------------------------------------------------

-- Check for multiple SELECT policies on same table/role
SELECT 
  'Multiple SELECT policies' as conflict_type,
  tablename,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND cmd = 'SELECT'
GROUP BY tablename, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC;

-- Check for multiple ALL policies on same table/role
SELECT 
  'Multiple ALL policies' as conflict_type,
  tablename,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND cmd = 'ALL'
GROUP BY tablename, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC;

-- Check for multiple INSERT policies on same table/role
SELECT 
  'Multiple INSERT policies' as conflict_type,
  tablename,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND cmd = 'INSERT'
GROUP BY tablename, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC;

-- Check for multiple UPDATE policies on same table/role
SELECT 
  'Multiple UPDATE policies' as conflict_type,
  tablename,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND cmd = 'UPDATE'
GROUP BY tablename, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC;

-- Check for multiple DELETE policies on same table/role
SELECT 
  'Multiple DELETE policies' as conflict_type,
  tablename,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND cmd = 'DELETE'
GROUP BY tablename, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC;

-- ----------------------------------------------------------------------------
-- 4. SHOW ALL POLICIES BY TABLE (for manual review)
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
  END as has_with_check_clause,
  CASE 
    WHEN (tablename, cmd, roles) IN (
      SELECT tablename, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename, cmd, roles
      HAVING COUNT(*) > 1
    ) THEN '🚨 CONFLICT'
    ELSE '✅ OK'
  END as conflict_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
  CASE 
    WHEN (tablename, cmd, roles) IN (
      SELECT tablename, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename, cmd, roles
      HAVING COUNT(*) > 1
    ) THEN 0
    ELSE 1
  END,
  tablename, 
  cmd, 
  roles, 
  policyname;

-- ----------------------------------------------------------------------------
-- 5. GENERATE DROP STATEMENTS FOR CONFLICTING POLICIES
-- ----------------------------------------------------------------------------
SELECT 
  'DROP POLICY IF EXISTS ' || policyname || ' ON ' || tablename || ';' as drop_statement,
  'CONFLICTING POLICY' as reason
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename, cmd, roles) IN (
    SELECT tablename, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd, roles
    HAVING COUNT(*) > 1
  )
ORDER BY tablename, policyname;
