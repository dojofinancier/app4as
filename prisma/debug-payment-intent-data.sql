-- Debug Payment Intent Data Table
-- Run these queries one at a time to diagnose the issue

-- 1. Check if payment_intent_data table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_intent_data' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current row count
SELECT COUNT(*) as row_count FROM payment_intent_data;

-- 3. Check RLS policies on payment_intent_data table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'payment_intent_data';

-- 4. Check if RLS is enabled on the table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_intent_data';

-- 5. Test a simple insert to see if it works (run this last)
-- INSERT INTO payment_intent_data (payment_intent_id, cart_data) 
-- VALUES ('test_pi_123', '{"test": "data"}');

-- 6. Check if there are any constraints or triggers
SELECT conname, contype, confrelid::regclass as foreign_table
FROM pg_constraint 
WHERE conrelid = 'payment_intent_data'::regclass;

