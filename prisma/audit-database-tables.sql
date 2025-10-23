-- Database Audit Script: List all tables and their purposes
-- Run this in Supabase SQL Editor to see your current database structure

-- 1. List all tables with their row counts
SELECT 
    schemaname,
    relname as table_name,
    n_tup_ins as "Total Inserts",
    n_tup_upd as "Total Updates", 
    n_tup_del as "Total Deletes",
    n_live_tup as "Current Rows",
    n_dead_tup as "Dead Rows"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- 2. List all tables with column information
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_primary_key
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku 
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 3. List all foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. List all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. Check for any missing tables that should exist based on Prisma schema
SELECT 'Missing Tables Check' as check_type;

-- Expected tables from Prisma schema:
-- users, courses, tutors, tutor_courses, availability_rules, availability_exceptions, 
-- time_offs, external_calendars, coupons, carts, cart_items, slot_holds, orders, 
-- order_items, appointments, webhook_events, payment_intent_data, credit_transactions, 
-- refund_requests, appointment_modifications, messages, message_attachments, recurring_sessions

-- 6. Sample data from key tables (first 3 rows each)
SELECT 'USERS SAMPLE' as table_name, * FROM users LIMIT 3;
SELECT 'COURSES SAMPLE' as table_name, * FROM courses LIMIT 3;
SELECT 'TUTORS SAMPLE' as table_name, * FROM tutors LIMIT 3;
SELECT 'CARTS SAMPLE' as table_name, * FROM carts LIMIT 3;
SELECT 'ORDERS SAMPLE' as table_name, * FROM orders LIMIT 3;
SELECT 'APPOINTMENTS SAMPLE' as table_name, * FROM appointments LIMIT 3;
