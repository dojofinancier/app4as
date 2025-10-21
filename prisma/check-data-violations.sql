-- ============================================================================
-- 4AS Tutor Booking App - Data Validation Before Constraints
-- ============================================================================
-- Purpose: Check existing data for violations before applying constraints
-- Run this in Supabase SQL Editor to identify data issues
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHECK INVALID DURATIONS (should be 60, 90, or 120 minutes)
-- ----------------------------------------------------------------------------

SELECT 'cart_items' as table_name, COUNT(*) as violations 
FROM cart_items WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'order_items', COUNT(*) 
FROM order_items WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'slot_holds', COUNT(*) 
FROM slot_holds WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'recurring_sessions', COUNT(*) 
FROM recurring_sessions WHERE duration_min NOT IN (60, 90, 120);

-- Show specific invalid durations if any exist
SELECT 'cart_items' as table_name, id, duration_min, 'INVALID DURATION' as issue
FROM cart_items WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'order_items', id::text, duration_min, 'INVALID DURATION'
FROM order_items WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'slot_holds', id::text, duration_min, 'INVALID DURATION'
FROM slot_holds WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'recurring_sessions', id::text, duration_min, 'INVALID DURATION'
FROM recurring_sessions WHERE duration_min NOT IN (60, 90, 120);

-- ----------------------------------------------------------------------------
-- 2. CHECK NEGATIVE OR ZERO PRICES
-- ----------------------------------------------------------------------------

SELECT 'tutors' as table_name, COUNT(*) as violations
FROM tutors WHERE hourly_base_rate_cad <= 0
UNION ALL
SELECT 'orders', COUNT(*)
FROM orders WHERE total_cad < 0
UNION ALL
SELECT 'order_items', COUNT(*)
FROM order_items WHERE unit_price_cad < 0
UNION ALL
SELECT 'cart_items', COUNT(*)
FROM cart_items WHERE unit_price_cad < 0;

-- Show specific negative prices if any exist
SELECT 'tutors' as table_name, id, hourly_base_rate_cad, 'NEGATIVE/ZERO RATE' as issue
FROM tutors WHERE hourly_base_rate_cad <= 0
UNION ALL
SELECT 'orders', id::text, total_cad, 'NEGATIVE TOTAL'
FROM orders WHERE total_cad < 0
UNION ALL
SELECT 'order_items', id::text, unit_price_cad, 'NEGATIVE PRICE'
FROM order_items WHERE unit_price_cad < 0
UNION ALL
SELECT 'cart_items', id::text, unit_price_cad, 'NEGATIVE PRICE'
FROM cart_items WHERE unit_price_cad < 0;

-- ----------------------------------------------------------------------------
-- 3. CHECK INVALID WEEKDAY RANGES (should be 0-6)
-- ----------------------------------------------------------------------------

SELECT 'availability_rules' as table_name, COUNT(*) as violations
FROM availability_rules WHERE weekday NOT BETWEEN 0 AND 6;

-- Show specific invalid weekdays if any exist
SELECT 'availability_rules' as table_name, id, weekday, 'INVALID WEEKDAY' as issue
FROM availability_rules WHERE weekday NOT BETWEEN 0 AND 6;

-- ----------------------------------------------------------------------------
-- 4. CHECK INVALID TIME RANGES (end > start)
-- ----------------------------------------------------------------------------

SELECT 'availability_rules' as table_name, COUNT(*) as violations
FROM availability_rules WHERE end_time <= start_time
UNION ALL
SELECT 'availability_exceptions', COUNT(*)
FROM availability_exceptions WHERE end_time <= start_time
UNION ALL
SELECT 'time_off', COUNT(*)
FROM time_off WHERE end_datetime <= start_datetime
UNION ALL
SELECT 'appointments', COUNT(*)
FROM appointments WHERE end_datetime <= start_datetime
UNION ALL
SELECT 'slot_holds', COUNT(*)
FROM slot_holds WHERE (start_datetime + (duration_min || ' minutes')::interval) <= start_datetime
UNION ALL
SELECT 'recurring_sessions', COUNT(*)
FROM recurring_sessions WHERE end_date <= start_date;

-- Show specific invalid time ranges if any exist
SELECT 'availability_rules' as table_name, id, start_time, end_time, 'END <= START' as issue
FROM availability_rules WHERE end_time <= start_time
UNION ALL
SELECT 'availability_exceptions', id::text, start_time, end_time, 'END <= START'
FROM availability_exceptions WHERE end_time <= start_time
UNION ALL
SELECT 'time_off', id::text, start_datetime::text, end_datetime::text, 'END <= START'
FROM time_off WHERE end_datetime <= start_datetime
UNION ALL
SELECT 'appointments', id::text, start_datetime::text, end_datetime::text, 'END <= START'
FROM appointments WHERE end_datetime <= start_datetime
UNION ALL
SELECT 'slot_holds', id::text, start_datetime::text, (start_datetime + (duration_min || ' minutes')::interval)::text, 'INVALID DURATION'
FROM slot_holds WHERE (start_datetime + (duration_min || ' minutes')::interval) <= start_datetime
UNION ALL
SELECT 'recurring_sessions', id::text, start_date::text, end_date::text, 'END <= START'
FROM recurring_sessions WHERE end_date <= start_date;

-- ----------------------------------------------------------------------------
-- 5. CHECK INVALID COUPON REDEMPTIONS
-- ----------------------------------------------------------------------------

SELECT 'coupons' as table_name, COUNT(*) as violations
FROM coupons WHERE max_redemptions < 0;

-- Show specific invalid coupon settings if any exist
SELECT 'coupons' as table_name, id, max_redemptions, 'NEGATIVE REDEMPTIONS' as issue
FROM coupons WHERE max_redemptions < 0;

-- ----------------------------------------------------------------------------
-- 6. CHECK INVALID RECURRING SESSION COUNTS
-- ----------------------------------------------------------------------------

SELECT 'recurring_sessions' as table_name, COUNT(*) as violations
FROM recurring_sessions WHERE total_sessions <= 0 OR sessions_completed < 0;

-- Show specific invalid session counts if any exist
SELECT 'recurring_sessions' as table_name, id, total_sessions, sessions_completed, 'INVALID SESSION COUNT' as issue
FROM recurring_sessions WHERE total_sessions <= 0 OR sessions_completed < 0;

-- ----------------------------------------------------------------------------
-- 7. CHECK INVALID CREDIT BALANCES
-- ----------------------------------------------------------------------------

SELECT 'users' as table_name, COUNT(*) as violations
FROM users WHERE credit_balance < 0;

-- Show specific negative credit balances if any exist
SELECT 'users' as table_name, id, credit_balance, 'NEGATIVE CREDIT BALANCE' as issue
FROM users WHERE credit_balance < 0;

-- ----------------------------------------------------------------------------
-- 8. SUMMARY REPORT
-- ----------------------------------------------------------------------------

SELECT 
  'SUMMARY' as report_type,
  'Data validation complete. Check results above for violations.' as message,
  'If any violations found, fix them before applying constraints.' as action;
