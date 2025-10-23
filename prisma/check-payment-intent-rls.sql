-- Check RLS policies on payment_intent_data table
-- Run these queries in Supabase SQL Editor

-- 1. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_intent_data';

-- 2. Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'payment_intent_data';

-- 3. Check table permissions
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'payment_intent_data' 
    AND table_schema = 'public';

-- 4. Test if we can insert data (run this last)
-- This will help us see the exact error
INSERT INTO payment_intent_data (payment_intent_id, cart_data) 
VALUES ('test_pi_debug_123', '{"test": "debug data"}');

