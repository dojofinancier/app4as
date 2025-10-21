-- ============================================================================
-- 4AS Tutor Booking App - Targeted RLS Policy Fix
-- ============================================================================
-- Purpose: Fix the specific conflicts and security issues identified
-- Run this AFTER reviewing the analysis results
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Fix the recurring_sessions conflict
-- ----------------------------------------------------------------------------

-- Drop the conflicting SELECT policies on recurring_sessions
DROP POLICY IF EXISTS "Users can view their own recurring sessions" ON recurring_sessions;
DROP POLICY IF EXISTS "Tutors can view their recurring sessions" ON recurring_sessions;

-- Drop the other policies to start clean
DROP POLICY IF EXISTS "Admins can manage all recurring sessions" ON recurring_sessions;
DROP POLICY IF EXISTS "Users can create recurring sessions" ON recurring_sessions;
DROP POLICY IF EXISTS "Users can update their recurring sessions" ON recurring_sessions;

-- ----------------------------------------------------------------------------
-- STEP 2: Enable RLS on tables that have it disabled
-- ----------------------------------------------------------------------------

ALTER TABLE appointment_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- STEP 3: Create helper functions first
-- ----------------------------------------------------------------------------

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id TEXT)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM users WHERE id = auth.uid()::TEXT),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is tutor
CREATE OR REPLACE FUNCTION is_tutor()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'tutor' FROM users WHERE id = auth.uid()::TEXT),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- STEP 4: Apply clean policies for recurring_sessions
-- ----------------------------------------------------------------------------

-- Admin can do everything
CREATE POLICY admin_all_recurring_sessions ON recurring_sessions
  FOR ALL
  USING (is_admin());

-- Students can manage their own recurring sessions
CREATE POLICY students_all_own_recurring_sessions ON recurring_sessions
  FOR ALL
  USING (auth.uid()::TEXT = user_id);

-- Tutors can view recurring sessions they're assigned to
CREATE POLICY tutors_select_own_recurring_sessions ON recurring_sessions
  FOR SELECT
  USING (auth.uid()::TEXT = tutor_id);

-- ----------------------------------------------------------------------------
-- STEP 5: Apply clean policies for tables with RLS disabled
-- ----------------------------------------------------------------------------

-- Appointment Modifications
CREATE POLICY admin_all_appointment_modifications ON appointment_modifications
  FOR ALL
  USING (is_admin());

CREATE POLICY users_select_own_appointment_modifications ON appointment_modifications
  FOR SELECT
  USING (
    auth.uid()::TEXT = modified_by OR
    auth.uid()::TEXT = (SELECT user_id FROM appointments WHERE id = appointment_id) OR
    auth.uid()::TEXT = (SELECT tutor_id FROM appointments WHERE id = appointment_id)
  );

-- Credit Transactions
CREATE POLICY admin_all_credit_transactions ON credit_transactions
  FOR ALL
  USING (is_admin());

CREATE POLICY users_select_own_credit_transactions ON credit_transactions
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- Messages
CREATE POLICY admin_select_messages ON messages
  FOR SELECT
  USING (is_admin());

CREATE POLICY users_all_own_messages ON messages
  FOR ALL
  USING (auth.uid()::TEXT = sender_id OR auth.uid()::TEXT = receiver_id);

-- Refund Requests
CREATE POLICY admin_all_refund_requests ON refund_requests
  FOR ALL
  USING (is_admin());

CREATE POLICY users_all_own_refund_requests ON refund_requests
  FOR ALL
  USING (auth.uid()::TEXT = user_id);

-- ----------------------------------------------------------------------------
-- STEP 6: Verify the fix
-- ----------------------------------------------------------------------------

-- Check recurring_sessions now has exactly 3 policies
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'recurring_sessions'
GROUP BY tablename;

-- Check all tables now have RLS enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;
