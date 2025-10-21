-- ============================================================================
-- 4AS Tutor Booking App - RLS Policy Verification
-- ============================================================================
-- Purpose: Verify that RLS policies are working correctly after cleanup
-- Run this in Supabase SQL Editor to check policy status
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
-- 3. CHECK FOR CONFLICTS (should be none after cleanup)
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
-- 4. VERIFY HELPER FUNCTIONS EXIST
-- ----------------------------------------------------------------------------
SELECT 
  'Helper Functions' as category,
  proname as function_name,
  proargnames as arguments,
  'EXISTS' as status
FROM pg_proc 
WHERE proname IN ('is_admin', 'is_tutor', 'get_user_role')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ----------------------------------------------------------------------------
-- 5. CHECK SPECIFIC TABLES FOR EXPECTED POLICIES
-- ----------------------------------------------------------------------------

-- Recurring sessions should have exactly 3 policies
SELECT 
  'recurring_sessions' as table_name,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'recurring_sessions'
GROUP BY tablename;

-- Users table should have 4 policies (admin_all, select_own, update_own, insert_self)
SELECT 
  'users' as table_name,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
GROUP BY tablename;

-- Appointments should have 3 policies (admin_all, students_all_own, tutors_all_own)
SELECT 
  'appointments' as table_name,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'appointments'
GROUP BY tablename;

-- ----------------------------------------------------------------------------
-- 6. SECURITY CHECK: Tables with RLS disabled (should be none)
-- ----------------------------------------------------------------------------
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  '⚠️ RLS DISABLED - SECURITY RISK' as issue
FROM pg_tables t
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = false
ORDER BY t.tablename;

-- ----------------------------------------------------------------------------
-- 7. SECURITY CHECK: Tables with no policies (should be none)
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
-- 8. SUMMARY STATISTICS
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
) as multi_policy_tables

UNION ALL

SELECT 
  'Tables with Single Policy',
  COUNT(*)::text
FROM (
  SELECT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  HAVING COUNT(*) = 1
) as single_policy_tables;

-- ----------------------------------------------------------------------------
-- 9. SUCCESS CRITERIA CHECK
-- ----------------------------------------------------------------------------
SELECT 
  'SUCCESS CRITERIA' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) = 0 
    THEN '✅ All tables have RLS enabled'
    ELSE '❌ Some tables have RLS disabled'
  END as rls_enabled_check,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM (
      SELECT tablename FROM pg_policies WHERE schemaname = 'public'
      GROUP BY tablename HAVING COUNT(*) > 1
    ) as conflicts) = 0
    THEN '✅ No policy conflicts found'
    ELSE '❌ Policy conflicts detected'
  END as conflict_check,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('is_admin', 'is_tutor', 'get_user_role')) = 3
    THEN '✅ All helper functions exist'
    ELSE '❌ Missing helper functions'
  END as helper_functions_check;
