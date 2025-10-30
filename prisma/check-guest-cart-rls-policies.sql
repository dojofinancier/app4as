-- =====================================================
-- RLS Policy Audit for Guest Cart & Payment Flow
-- =====================================================
-- Purpose: Check RLS policies for new tables/fields added for guest checkout
-- Date: January 2025
-- Related: Phase 0.5 - Payment Flow Overhaul

-- =====================================================
-- 1. Check if RLS is enabled on relevant tables
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('payment_intent_data', 'carts', 'slot_holds', 'cart_items')
  AND schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. Check existing RLS policies
-- =====================================================
SELECT 
  schemaname AS "Schema",
  tablename AS "Table",
  policyname AS "Policy Name",
  permissive AS "Permissive",
  roles AS "Roles",
  cmd AS "Command",
  qual AS "USING Expression",
  with_check AS "WITH CHECK Expression"
FROM pg_policies
WHERE tablename IN ('payment_intent_data', 'carts', 'slot_holds', 'cart_items')
ORDER BY tablename, policyname;

-- =====================================================
-- 3. Test session-based access pattern
-- =====================================================
-- Note: Run these queries in your application context where 
-- app.cart_session_id is set via Prisma's $executeRaw

-- Example test (run in application context):
-- SELECT set_config('app.cart_session_id', 'test-session-123', true);
-- SELECT * FROM carts WHERE session_id = current_setting('app.cart_session_id', true);

-- =====================================================
-- 4. Recommended RLS Policies (if not present)
-- =====================================================

-- Policy for payment_intent_data (system/service role only)
-- CREATE POLICY "payment_intent_data_service_role_all"
-- ON payment_intent_data
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- Policy for carts (guest session or authenticated user)
-- CREATE POLICY "carts_guest_or_user_access"
-- ON carts
-- FOR ALL
-- USING (
--   (session_id IS NOT NULL AND session_id = current_setting('app.cart_session_id', true))
--   OR
--   (user_id IS NOT NULL AND user_id = auth.uid()::text)
-- );

-- Policy for slot_holds (guest session or authenticated user)
-- CREATE POLICY "slot_holds_guest_or_user_access"
-- ON slot_holds
-- FOR ALL
-- USING (
--   (session_id IS NOT NULL AND session_id = current_setting('app.cart_session_id', true))
--   OR
--   (user_id IS NOT NULL AND user_id = auth.uid()::text)
-- );

-- Policy for cart_items (access via parent cart)
-- CREATE POLICY "cart_items_via_cart_access"
-- ON cart_items
-- FOR ALL
-- USING (
--   EXISTS (
--     SELECT 1 FROM carts
--     WHERE carts.id = cart_items.cart_id
--     AND (
--       (carts.session_id IS NOT NULL AND carts.session_id = current_setting('app.cart_session_id', true))
--       OR
--       (carts.user_id IS NOT NULL AND carts.user_id = auth.uid()::text)
--     )
--   )
-- );

-- =====================================================
-- 5. Check for orphaned payment_intent_data records
-- =====================================================
-- These should be cleaned up after successful payment processing
SELECT 
  id,
  payment_intent_id,
  created_at,
  AGE(NOW(), created_at) AS "Age"
FROM payment_intent_data
WHERE created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- =====================================================
-- 6. Check for guest carts and holds
-- =====================================================
-- Guest carts (session_id set, user_id null)
SELECT 
  'Guest Carts' AS "Type",
  COUNT(*) AS "Count",
  MIN(created_at) AS "Oldest",
  MAX(created_at) AS "Newest"
FROM carts
WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Guest holds (session_id set, user_id null)
SELECT 
  'Guest Holds' AS "Type",
  COUNT(*) AS "Count",
  MIN(created_at) AS "Oldest",
  MAX(created_at) AS "Newest"
FROM slot_holds
WHERE session_id IS NOT NULL AND user_id IS NULL;

-- =====================================================
-- 7. Test query to verify guest access works
-- =====================================================
-- Run this after setting session config in your app:
-- SELECT set_config('app.cart_session_id', '<your-session-id>', true);
-- 
-- Then test:
-- SELECT * FROM carts WHERE session_id = current_setting('app.cart_session_id', true);
-- SELECT * FROM slot_holds WHERE session_id = current_setting('app.cart_session_id', true);

-- =====================================================
-- End of RLS Policy Audit Script
-- =====================================================


