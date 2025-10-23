-- Fast Database Audit Script
-- Run this in Supabase SQL Editor - much faster than the complex version

-- 1. List all tables (simple and fast)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Count rows in each table (run these one at a time if needed)
SELECT 'users' as table_name, COUNT(*) as row_count FROM users;
SELECT 'courses' as table_name, COUNT(*) as row_count FROM courses;
SELECT 'tutors' as table_name, COUNT(*) as row_count FROM tutors;
SELECT 'carts' as table_name, COUNT(*) as row_count FROM carts;
SELECT 'cart_items' as table_name, COUNT(*) as row_count FROM cart_items;
SELECT 'slot_holds' as table_name, COUNT(*) as row_count FROM slot_holds;
SELECT 'orders' as table_name, COUNT(*) as row_count FROM orders;
SELECT 'order_items' as table_name, COUNT(*) as row_count FROM order_items;
SELECT 'appointments' as table_name, COUNT(*) as row_count FROM appointments;
SELECT 'webhook_events' as table_name, COUNT(*) as row_count FROM webhook_events;
SELECT 'coupons' as table_name, COUNT(*) as row_count FROM coupons;

-- 3. Check if payment_intent_data table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_intent_data'
) as payment_intent_data_exists;

-- 4. Show structure of key tables (run one at a time)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'carts' AND table_schema = 'public'
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' AND table_schema = 'public'
-- ORDER BY ordinal_position;

