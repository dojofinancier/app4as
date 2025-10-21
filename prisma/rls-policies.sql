-- Row Level Security Policies for Tutor Booking Application
-- Run these SQL commands in your Supabase SQL Editor after running Prisma migrations

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

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT role::text FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (auth.user_role() = 'admin');

-- Courses table policies (public read, admin write)
CREATE POLICY "Anyone can view active courses" ON courses
  FOR SELECT USING (active = true OR auth.user_role() = 'admin');

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (auth.user_role() = 'admin');

-- Tutors table policies (public read active, admin write, tutor self-edit)
CREATE POLICY "Anyone can view active tutors" ON tutors
  FOR SELECT USING (active = true OR id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Tutors can update their own profile" ON tutors
  FOR UPDATE USING (id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Admins can manage tutors" ON tutors
  FOR ALL USING (auth.user_role() = 'admin');

-- Tutor courses policies
CREATE POLICY "Anyone can view active tutor-course assignments" ON tutor_courses
  FOR SELECT USING (active = true OR auth.user_role() IN ('tutor', 'admin'));

CREATE POLICY "Admins can manage tutor-course assignments" ON tutor_courses
  FOR ALL USING (auth.user_role() = 'admin');

-- Availability rules policies
CREATE POLICY "Tutors can view their availability rules" ON availability_rules
  FOR SELECT USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Tutors can manage their availability rules" ON availability_rules
  FOR ALL USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

-- Availability exceptions policies
CREATE POLICY "Tutors can view their availability exceptions" ON availability_exceptions
  FOR SELECT USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Tutors can manage their availability exceptions" ON availability_exceptions
  FOR ALL USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

-- Time off policies
CREATE POLICY "Tutors can view their time off" ON time_off
  FOR SELECT USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Tutors can manage their time off" ON time_off
  FOR ALL USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

-- External calendars policies
CREATE POLICY "Tutors can view their external calendars" ON external_calendars
  FOR SELECT USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Tutors can manage their external calendars" ON external_calendars
  FOR ALL USING (tutor_id = auth.uid() OR auth.user_role() = 'admin');

-- Coupons policies
CREATE POLICY "Authenticated users can view active coupons" ON coupons
  FOR SELECT USING (active = true OR auth.user_role() = 'admin');

CREATE POLICY "Admins can manage coupons" ON coupons
  FOR ALL USING (auth.user_role() = 'admin');

-- Carts policies
CREATE POLICY "Users can view their own cart" ON carts
  FOR SELECT USING (user_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Users can manage their own cart" ON carts
  FOR ALL USING (user_id = auth.uid() OR auth.user_role() = 'admin');

-- Cart items policies
CREATE POLICY "Users can view their cart items" ON cart_items
  FOR SELECT USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
    OR auth.user_role() = 'admin'
  );

CREATE POLICY "Users can manage their cart items" ON cart_items
  FOR ALL USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
    OR auth.user_role() = 'admin'
  );

-- Slot holds policies
CREATE POLICY "Users can view their slot holds" ON slot_holds
  FOR SELECT USING (user_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Users can manage their slot holds" ON slot_holds
  FOR ALL USING (user_id = auth.uid() OR auth.user_role() = 'admin');

-- Orders policies
CREATE POLICY "Users can view their orders" ON orders
  FOR SELECT USING (user_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Admins can manage orders" ON orders
  FOR ALL USING (auth.user_role() = 'admin');

-- Order items policies
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR auth.user_role() = 'admin'
  );

CREATE POLICY "System can create order items" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR auth.user_role() = 'admin'
  );

-- Appointments policies
CREATE POLICY "Students can view their appointments" ON appointments
  FOR SELECT USING (user_id = auth.uid() OR auth.user_role() IN ('admin'));

CREATE POLICY "Tutors can view their appointments" ON appointments
  FOR SELECT USING (tutor_id = auth.uid() OR auth.user_role() IN ('admin'));

CREATE POLICY "Users can manage their appointments" ON appointments
  FOR UPDATE USING (
    user_id = auth.uid() 
    OR tutor_id = auth.uid() 
    OR auth.user_role() = 'admin'
  );

CREATE POLICY "System can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.user_role() IS NOT NULL);

CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (auth.user_role() = 'admin');

-- Webhook events policies (admin only)
CREATE POLICY "Admins can view webhook events" ON webhook_events
  FOR SELECT USING (auth.user_role() = 'admin');

CREATE POLICY "System can create webhook events" ON webhook_events
  FOR INSERT WITH CHECK (true);


