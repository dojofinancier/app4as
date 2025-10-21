-- ============================================================================
-- 4AS Tutor Booking App - RLS Policies V1 (Clean Version)
-- ============================================================================
-- Purpose: Single source of truth for Row Level Security policies
-- Run this AFTER reviewing and backing up existing policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Clean up existing policies (CAREFUL!)
-- ----------------------------------------------------------------------------

-- Uncomment these after backing up existing policies
-- DROP POLICY IF EXISTS ... (list all existing policies)

-- Or use this to generate DROP statements:
-- SELECT 'DROP POLICY IF EXISTS ' || policyname || ' ON ' || tablename || ';'
-- FROM pg_policies WHERE schemaname = 'public';


-- ----------------------------------------------------------------------------
-- STEP 2: Enable RLS on all tables
-- ----------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_sessions ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM users WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if current user is tutor
CREATE OR REPLACE FUNCTION is_tutor()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'tutor' FROM users WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Admin can do everything
CREATE POLICY admin_all_users ON users
  FOR ALL
  USING (is_admin());

-- Users can view their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow user creation (for signup)
CREATE POLICY users_insert_self ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ----------------------------------------------------------------------------
-- COURSES TABLE POLICIES (Public Read, Admin Write)
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_courses ON courses
  FOR ALL
  USING (is_admin());

CREATE POLICY public_select_courses ON courses
  FOR SELECT
  USING (true); -- Everyone can view courses


-- ----------------------------------------------------------------------------
-- TUTORS TABLE POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_tutors ON tutors
  FOR ALL
  USING (is_admin());

CREATE POLICY public_select_active_tutors ON tutors
  FOR SELECT
  USING (active = true); -- Everyone can view active tutors

CREATE POLICY tutors_update_own ON tutors
  FOR UPDATE
  USING (auth.uid() = id); -- Tutors can update their own profile


-- ----------------------------------------------------------------------------
-- TUTOR COURSES POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_tutor_courses ON tutor_courses
  FOR ALL
  USING (is_admin());

CREATE POLICY public_select_tutor_courses ON tutor_courses
  FOR SELECT
  USING (true); -- Everyone can view tutor-course assignments


-- ----------------------------------------------------------------------------
-- AVAILABILITY POLICIES (Tutor + Admin)
-- ----------------------------------------------------------------------------

-- Availability Rules
CREATE POLICY admin_all_availability_rules ON availability_rules
  FOR ALL
  USING (is_admin());

CREATE POLICY tutors_all_own_availability_rules ON availability_rules
  FOR ALL
  USING (auth.uid() = tutor_id);

CREATE POLICY public_select_availability_rules ON availability_rules
  FOR SELECT
  USING (true); -- Everyone can view for slot generation

-- Availability Exceptions
CREATE POLICY admin_all_availability_exceptions ON availability_exceptions
  FOR ALL
  USING (is_admin());

CREATE POLICY tutors_all_own_availability_exceptions ON availability_exceptions
  FOR ALL
  USING (auth.uid() = tutor_id);

CREATE POLICY public_select_availability_exceptions ON availability_exceptions
  FOR SELECT
  USING (true);

-- Time Off
CREATE POLICY admin_all_time_off ON time_off
  FOR ALL
  USING (is_admin());

CREATE POLICY tutors_all_own_time_off ON time_off
  FOR ALL
  USING (auth.uid() = tutor_id);

CREATE POLICY public_select_time_off ON time_off
  FOR SELECT
  USING (true);


-- ----------------------------------------------------------------------------
-- EXTERNAL CALENDARS POLICIES (Tutor + Admin only)
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_external_calendars ON external_calendars
  FOR ALL
  USING (is_admin());

CREATE POLICY tutors_all_own_external_calendars ON external_calendars
  FOR ALL
  USING (auth.uid() = tutor_id);


-- ----------------------------------------------------------------------------
-- COUPONS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_coupons ON coupons
  FOR ALL
  USING (is_admin());

CREATE POLICY public_select_active_coupons ON coupons
  FOR SELECT
  USING (active = true); -- Users can view active coupons


-- ----------------------------------------------------------------------------
-- CART POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_carts ON carts
  FOR ALL
  USING (is_admin());

CREATE POLICY users_all_own_carts ON carts
  FOR ALL
  USING (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- CART ITEMS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_cart_items ON cart_items
  FOR ALL
  USING (is_admin());

CREATE POLICY users_all_own_cart_items ON cart_items
  FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM carts WHERE id = cart_id)
  );


-- ----------------------------------------------------------------------------
-- SLOT HOLDS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_slot_holds ON slot_holds
  FOR ALL
  USING (is_admin());

CREATE POLICY users_all_own_slot_holds ON slot_holds
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY tutors_select_own_slot_holds ON slot_holds
  FOR SELECT
  USING (auth.uid() = tutor_id);


-- ----------------------------------------------------------------------------
-- ORDERS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_orders ON orders
  FOR ALL
  USING (is_admin());

CREATE POLICY users_select_own_orders ON orders
  FOR SELECT
  USING (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- ORDER ITEMS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_order_items ON order_items
  FOR ALL
  USING (is_admin());

CREATE POLICY users_select_own_order_items ON order_items
  FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM orders WHERE id = order_id)
  );


-- ----------------------------------------------------------------------------
-- APPOINTMENTS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_appointments ON appointments
  FOR ALL
  USING (is_admin());

CREATE POLICY students_all_own_appointments ON appointments
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY tutors_all_own_appointments ON appointments
  FOR ALL
  USING (auth.uid() = tutor_id);


-- ----------------------------------------------------------------------------
-- WEBHOOK EVENTS POLICIES (Admin only)
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_webhook_events ON webhook_events
  FOR ALL
  USING (is_admin());


-- ----------------------------------------------------------------------------
-- CREDIT TRANSACTIONS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_credit_transactions ON credit_transactions
  FOR ALL
  USING (is_admin());

CREATE POLICY users_select_own_credit_transactions ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- REFUND REQUESTS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_refund_requests ON refund_requests
  FOR ALL
  USING (is_admin());

CREATE POLICY users_all_own_refund_requests ON refund_requests
  FOR ALL
  USING (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- APPOINTMENT MODIFICATIONS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_appointment_modifications ON appointment_modifications
  FOR ALL
  USING (is_admin());

CREATE POLICY users_select_own_appointment_modifications ON appointment_modifications
  FOR SELECT
  USING (
    auth.uid() = modified_by OR
    auth.uid() = (SELECT user_id FROM appointments WHERE id = appointment_id) OR
    auth.uid() = (SELECT tutor_id FROM appointments WHERE id = appointment_id)
  );


-- ----------------------------------------------------------------------------
-- MESSAGES POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_select_messages ON messages
  FOR SELECT
  USING (is_admin());

CREATE POLICY users_all_own_messages ON messages
  FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


-- ----------------------------------------------------------------------------
-- MESSAGE ATTACHMENTS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_select_message_attachments ON message_attachments
  FOR SELECT
  USING (is_admin());

CREATE POLICY users_select_own_message_attachments ON message_attachments
  FOR SELECT
  USING (
    auth.uid() = (SELECT sender_id FROM messages WHERE id = message_id) OR
    auth.uid() = (SELECT receiver_id FROM messages WHERE id = message_id)
  );

CREATE POLICY users_insert_own_message_attachments ON message_attachments
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT sender_id FROM messages WHERE id = message_id)
  );


-- ----------------------------------------------------------------------------
-- RECURRING SESSIONS POLICIES
-- ----------------------------------------------------------------------------

CREATE POLICY admin_all_recurring_sessions ON recurring_sessions
  FOR ALL
  USING (is_admin());

CREATE POLICY students_all_own_recurring_sessions ON recurring_sessions
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY tutors_select_own_recurring_sessions ON recurring_sessions
  FOR SELECT
  USING (auth.uid() = tutor_id);


-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------

-- Test these policies by:
-- 1. Creating test users with different roles
-- 2. Trying CRUD operations from each role
-- 3. Ensuring students can't see other students' data
-- 4. Ensuring tutors can only see their own availability
-- 5. Ensuring admins can see everything

-- To test as a specific user:
-- SET LOCAL auth.uid = 'user-uuid-here';
-- SELECT * FROM appointments;

