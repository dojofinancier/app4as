-- Payment Flow Table Structure Queries
-- Run these one at a time in Supabase SQL Editor to get column information

-- 1. Users table (core user accounts)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Courses table (pricing and course info)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'courses' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Tutors table (tutor profiles and rates)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tutors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Carts table (shopping baskets)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'carts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Cart_items table (individual cart items)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cart_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Slot_holds table (temporary reservations)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'slot_holds' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Payment_intent_data table (payment details storage)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_intent_data' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Orders table (completed purchases)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Order_items table (individual purchased items)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Appointments table (scheduled sessions)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Coupons table (discount codes)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. Webhook_events table (payment notifications)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'webhook_events' AND table_schema = 'public'
ORDER BY ordinal_position;

