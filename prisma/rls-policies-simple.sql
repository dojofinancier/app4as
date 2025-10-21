-- Simple RLS Policies for Initial Setup
-- Run this FIRST to enable RLS without restrictions, then create users, then apply proper policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Temporary policies that allow everything (for initial setup)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on courses" ON courses FOR ALL USING (true);
CREATE POLICY "Allow all on tutors" ON tutors FOR ALL USING (true);
CREATE POLICY "Allow all on tutor_courses" ON tutor_courses FOR ALL USING (true);
CREATE POLICY "Allow all on availability_rules" ON availability_rules FOR ALL USING (true);
CREATE POLICY "Allow all on availability_exceptions" ON availability_exceptions FOR ALL USING (true);
CREATE POLICY "Allow all on time_off" ON time_off FOR ALL USING (true);
CREATE POLICY "Allow all on external_calendars" ON external_calendars FOR ALL USING (true);
CREATE POLICY "Allow all on coupons" ON coupons FOR ALL USING (true);
CREATE POLICY "Allow all on carts" ON carts FOR ALL USING (true);
CREATE POLICY "Allow all on cart_items" ON cart_items FOR ALL USING (true);
CREATE POLICY "Allow all on slot_holds" ON slot_holds FOR ALL USING (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all on order_items" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all on appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all on webhook_events" ON webhook_events FOR ALL USING (true);

