-- ============================================================================
-- 4AS Tutor Booking App - Fix RLS Policy Conflicts
-- ============================================================================
-- Purpose: Fix the policy conflicts by combining overlapping policies
-- Run this in Supabase SQL Editor to resolve conflicts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Drop the conflicting policies
-- ----------------------------------------------------------------------------

-- Drop conflicting policies on recurring_sessions
DROP POLICY IF EXISTS admin_all_recurring_sessions ON recurring_sessions;
DROP POLICY IF EXISTS students_all_own_recurring_sessions ON recurring_sessions;

-- Drop conflicting policies on refund_requests
DROP POLICY IF EXISTS admin_all_refund_requests ON refund_requests;
DROP POLICY IF EXISTS users_all_own_refund_requests ON refund_requests;

-- ----------------------------------------------------------------------------
-- STEP 2: Create combined policies that handle both admin and user access
-- ----------------------------------------------------------------------------

-- Recurring Sessions: Combined policy for admin + student access
CREATE POLICY recurring_sessions_combined_access ON recurring_sessions
  FOR ALL
  USING (
    is_admin() OR 
    auth.uid()::TEXT = user_id
  );

-- Refund Requests: Combined policy for admin + user access
CREATE POLICY refund_requests_combined_access ON refund_requests
  FOR ALL
  USING (
    is_admin() OR 
    auth.uid()::TEXT = user_id
  );

-- ----------------------------------------------------------------------------
-- STEP 3: Verify the fix
-- ----------------------------------------------------------------------------

-- Check that conflicts are resolved
SELECT 
  tablename,
  cmd as command,
  roles,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd, roles
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename;

-- Show the new policies
SELECT 
  tablename,
  policyname,
  cmd as command,
  roles,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('recurring_sessions', 'refund_requests')
ORDER BY tablename, policyname;
