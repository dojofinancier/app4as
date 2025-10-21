-- ============================================================================
-- 4AS Tutor Booking App - Database Constraints
-- ============================================================================
-- Purpose: Add CHECK constraints to enforce business rules at database level
-- Run this after reviewing to ensure data integrity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DURATION VALIDATIONS (60, 90, or 120 minutes only)
-- ----------------------------------------------------------------------------

-- Cart items
ALTER TABLE cart_items 
  ADD CONSTRAINT check_cart_duration 
  CHECK (duration_min IN (60, 90, 120));

-- Order items
ALTER TABLE order_items 
  ADD CONSTRAINT check_order_duration 
  CHECK (duration_min IN (60, 90, 120));

-- Slot holds
ALTER TABLE slot_holds 
  ADD CONSTRAINT check_hold_duration 
  CHECK (duration_min IN (60, 90, 120));

-- Recurring sessions
ALTER TABLE recurring_sessions 
  ADD CONSTRAINT check_recurring_duration 
  CHECK (duration_min IN (60, 90, 120));


-- ----------------------------------------------------------------------------
-- TIME LOGIC VALIDATIONS (end > start)
-- ----------------------------------------------------------------------------

-- Appointments
ALTER TABLE appointments 
  ADD CONSTRAINT check_appointment_time_order 
  CHECK (end_datetime > start_datetime);

-- Time off
ALTER TABLE time_off 
  ADD CONSTRAINT check_timeoff_order 
  CHECK (end_datetime > start_datetime);

-- Note: For availability_rules and availability_exceptions, 
-- we can't add CHECK on string time fields, validation in app code


-- ----------------------------------------------------------------------------
-- PRICE VALIDATIONS (must be positive)
-- ----------------------------------------------------------------------------

-- Tutor hourly rate
ALTER TABLE tutors 
  ADD CONSTRAINT check_positive_rate 
  CHECK (hourly_base_rate_cad > 0);

-- Order totals (can be 0 for free sessions, but not negative)
ALTER TABLE orders 
  ADD CONSTRAINT check_order_total 
  CHECK (total_cad >= 0);

ALTER TABLE orders 
  ADD CONSTRAINT check_order_subtotal 
  CHECK (subtotal_cad >= 0);

ALTER TABLE orders 
  ADD CONSTRAINT check_order_discount 
  CHECK (discount_cad >= 0);

-- Coupon values
ALTER TABLE coupons 
  ADD CONSTRAINT check_coupon_value 
  CHECK (value > 0);

-- Cart and order item prices
ALTER TABLE cart_items 
  ADD CONSTRAINT check_cart_price 
  CHECK (unit_price_cad > 0 AND line_total_cad >= 0);

ALTER TABLE order_items 
  ADD CONSTRAINT check_order_item_price 
  CHECK (unit_price_cad > 0 AND line_total_cad >= 0);


-- ----------------------------------------------------------------------------
-- BUSINESS LOGIC VALIDATIONS
-- ----------------------------------------------------------------------------

-- Weekday must be 0-6 (Sunday-Saturday)
ALTER TABLE availability_rules 
  ADD CONSTRAINT check_weekday_range 
  CHECK (weekday BETWEEN 0 AND 6);

-- Tutor priority (lower = higher priority)
ALTER TABLE tutors 
  ADD CONSTRAINT check_priority 
  CHECK (priority >= 1);

-- Coupon redemption count validation
ALTER TABLE coupons 
  ADD CONSTRAINT check_redemption_count 
  CHECK (redemption_count >= 0);

ALTER TABLE coupons 
  ADD CONSTRAINT check_redemption_limit 
  CHECK (max_redemptions IS NULL OR max_redemptions > 0);

ALTER TABLE coupons 
  ADD CONSTRAINT check_redemption_not_exceeded 
  CHECK (max_redemptions IS NULL OR redemption_count <= max_redemptions);


-- ----------------------------------------------------------------------------
-- RECURRING SESSION VALIDATIONS
-- ----------------------------------------------------------------------------

-- Frequency must be 'weekly' or 'biweekly'
ALTER TABLE recurring_sessions 
  ADD CONSTRAINT check_frequency 
  CHECK (frequency IN ('weekly', 'biweekly'));

-- Session counts must be logical
ALTER TABLE recurring_sessions 
  ADD CONSTRAINT check_total_sessions 
  CHECK (total_sessions > 0);

ALTER TABLE recurring_sessions 
  ADD CONSTRAINT check_sessions_created 
  CHECK (sessions_created >= 0 AND sessions_created <= total_sessions);

ALTER TABLE recurring_sessions 
  ADD CONSTRAINT check_sessions_completed 
  CHECK (sessions_completed >= 0);

ALTER TABLE recurring_sessions 
  ADD CONSTRAINT check_sessions_cancelled 
  CHECK (sessions_cancelled >= 0);


-- ----------------------------------------------------------------------------
-- CREDIT SYSTEM VALIDATIONS
-- ----------------------------------------------------------------------------

-- User credit balance cannot be negative
ALTER TABLE users 
  ADD CONSTRAINT check_credit_balance 
  CHECK (credit_balance >= 0);

-- Credit transactions
ALTER TABLE credit_transactions 
  ADD CONSTRAINT check_credit_amount 
  CHECK (amount != 0); -- Credits can be positive or negative, but not zero


-- ----------------------------------------------------------------------------
-- APPOINTMENT STATUS VALIDATIONS
-- ----------------------------------------------------------------------------

-- Ensure cancellation tracking is consistent
ALTER TABLE appointments 
  ADD CONSTRAINT check_cancellation_consistency 
  CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status != 'cancelled' AND cancelled_at IS NULL)
  );


-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------

-- If any of these constraints fail, it means you have existing data
-- that violates the business rules. You should:
-- 1. Query to find the violating rows
-- 2. Fix or delete the bad data
-- 3. Then run this script again

-- Example query to check duration violations before adding constraint:
-- SELECT * FROM cart_items WHERE duration_min NOT IN (60, 90, 120);

-- To drop a constraint if needed:
-- ALTER TABLE table_name DROP CONSTRAINT constraint_name;

