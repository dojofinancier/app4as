-- ============================================================================
-- 4AS Tutor Booking App - RLS Policy Cleanup & Fix
-- ============================================================================
-- Purpose: Remove conflicting policies and apply clean consolidated policies
-- Run this AFTER reviewing the current policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Generate DROP statements for all existing policies
-- ----------------------------------------------------------------------------

-- Run this first to see what will be dropped:
SELECT 'DROP POLICY IF EXISTS ' || policyname || ' ON ' || tablename || ';' as drop_statement
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- STEP 2: Drop all existing policies (uncomment after reviewing above)
-- ----------------------------------------------------------------------------

-- Uncomment these after reviewing the DROP statements above:

-- DROP POLICY IF EXISTS admin_all_recurring_sessions ON recurring_sessions;
-- DROP POLICY IF EXISTS students_all_own_recurring_sessions ON recurring_sessions;
-- DROP POLICY IF EXISTS tutors_select_own_recurring_sessions ON recurring_sessions;
-- DROP POLICY IF EXISTS [any_other_policy_name] ON recurring_sessions;

-- Repeat for all tables with multiple policies...

-- ----------------------------------------------------------------------------
-- STEP 3: Apply clean policies (from rls-policies-v1-clean.sql)
-- ----------------------------------------------------------------------------

-- After dropping old policies, run the clean policies from rls-policies-v1-clean.sql
-- This will ensure we have exactly the right policies with no conflicts

-- ----------------------------------------------------------------------------
-- STEP 4: Verify the fix
-- ----------------------------------------------------------------------------

-- Run this to verify each table has the expected number of policies:
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Expected results after cleanup:
-- recurring_sessions should have 3 policies (admin_all, students_all_own, tutors_select_own)
-- Most other tables should have 1-3 policies each
