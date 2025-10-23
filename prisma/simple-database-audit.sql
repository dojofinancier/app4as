-- Simple Database Audit Script
-- Run this in Supabase SQL Editor to see your current database structure

-- 1. List all tables in your database
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Count rows in each table
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'tutors', COUNT(*) FROM tutors
UNION ALL
SELECT 'tutor_courses', COUNT(*) FROM tutor_courses
UNION ALL
SELECT 'availability_rules', COUNT(*) FROM availability_rules
UNION ALL
SELECT 'availability_exceptions', COUNT(*) FROM availability_exceptions
UNION ALL
SELECT 'time_offs', COUNT(*) FROM time_offs
UNION ALL
SELECT 'external_calendars', COUNT(*) FROM external_calendars
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL
SELECT 'carts', COUNT(*) FROM carts
UNION ALL
SELECT 'cart_items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'slot_holds', COUNT(*) FROM slot_holds
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'webhook_events', COUNT(*) FROM webhook_events
UNION ALL
SELECT 'payment_intent_data', COUNT(*) FROM payment_intent_data
UNION ALL
SELECT 'credit_transactions', COUNT(*) FROM credit_transactions
UNION ALL
SELECT 'refund_requests', COUNT(*) FROM refund_requests
UNION ALL
SELECT 'appointment_modifications', COUNT(*) FROM appointment_modifications
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'message_attachments', COUNT(*) FROM message_attachments
UNION ALL
SELECT 'recurring_sessions', COUNT(*) FROM recurring_sessions
ORDER BY table_name;

-- 3. Show sample data from key tables
SELECT '=== USERS SAMPLE ===' as info;
SELECT id, email, role, created_at FROM users LIMIT 3;

SELECT '=== COURSES SAMPLE ===' as info;
SELECT id, title_fr, student_rate_cad FROM courses LIMIT 3;

SELECT '=== TUTORS SAMPLE ===' as info;
SELECT id, display_name, hourly_base_rate_cad FROM tutors LIMIT 3;

SELECT '=== CARTS SAMPLE ===' as info;
SELECT id, user_id, session_id, created_at FROM carts LIMIT 3;

SELECT '=== ORDERS SAMPLE ===' as info;
SELECT id, user_id, total_cad, status, created_at FROM orders LIMIT 3;

SELECT '=== APPOINTMENTS SAMPLE ===' as info;
SELECT id, user_id, tutor_id, start_datetime, status FROM appointments LIMIT 3;

