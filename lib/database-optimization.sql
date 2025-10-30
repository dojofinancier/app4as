-- Database optimization queries to improve connection stability
-- Run these in your Supabase SQL Editor

-- 1. Add missing indexes for foreign keys (from the advisor recommendations)
CREATE INDEX IF NOT EXISTS idx_appointments_course_id ON appointments(course_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tutor_id ON appointments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_course_id ON cart_items(course_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_tutor_id ON cart_items(tutor_id);
CREATE INDEX IF NOT EXISTS idx_carts_coupon_id ON carts(coupon_id);
CREATE INDEX IF NOT EXISTS idx_order_items_course_id ON order_items(course_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tutor_id ON order_items(tutor_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_processed_by ON refund_requests(processed_by);
CREATE INDEX IF NOT EXISTS idx_slot_holds_course_id ON slot_holds(course_id);
CREATE INDEX IF NOT EXISTS idx_slot_holds_recurring_session_id ON slot_holds(recurring_session_id);
CREATE INDEX IF NOT EXISTS idx_slot_holds_user_id ON slot_holds(user_id);

-- 2. Optimize connection pool settings
-- These settings help with connection management
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;

-- 3. Add connection timeout settings
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10min';

-- 4. Optimize for frequent queries
CREATE INDEX IF NOT EXISTS idx_availability_rules_tutor_id ON availability_rules(tutor_id);
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_tutor_date ON availability_exceptions(tutor_id, date);
CREATE INDEX IF NOT EXISTS idx_time_off_tutor_dates ON time_off(tutor_id, start_datetime, end_datetime);

-- 5. Clean up unused indexes (optional - only if you're sure they're not needed)
-- DROP INDEX IF EXISTS idx_messages_appointment_id;
-- DROP INDEX IF EXISTS order_items_order_id_idx;
-- DROP INDEX IF EXISTS webhook_events_source_type_idx;
-- DROP INDEX IF EXISTS idx_credit_transactions_type;
-- DROP INDEX IF EXISTS idx_refund_requests_status;
-- DROP INDEX IF EXISTS idx_users_stripe_customer_id;
-- DROP INDEX IF EXISTS idx_users_default_payment_method_id;
-- DROP INDEX IF EXISTS idx_appointment_modifications_type;
-- DROP INDEX IF EXISTS idx_recurring_sessions_tutor_id;
-- DROP INDEX IF EXISTS idx_recurring_sessions_course_id;
-- DROP INDEX IF EXISTS idx_recurring_sessions_active;
-- DROP INDEX IF EXISTS idx_appointments_recurring_session_id;
-- DROP INDEX IF EXISTS idx_carts_session_id;
-- DROP INDEX IF EXISTS idx_slot_holds_session;

-- 6. Analyze tables to update statistics
ANALYZE appointments;
ANALYZE availability_rules;
ANALYZE availability_exceptions;
ANALYZE time_off;
ANALYZE slot_holds;
ANALYZE cart_items;
ANALYZE order_items;
