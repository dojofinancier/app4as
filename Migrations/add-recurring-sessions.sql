-- Add Recurring Sessions Support
-- Run this migration in Supabase SQL Editor

-- Create recurring_sessions table
CREATE TABLE recurring_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutor_id TEXT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly')),
  duration_min INTEGER NOT NULL,
  total_sessions INTEGER NOT NULL,
  sessions_created INTEGER DEFAULT 0,
  sessions_completed INTEGER DEFAULT 0,
  sessions_cancelled INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for recurring_sessions table
CREATE INDEX idx_recurring_sessions_user_id ON recurring_sessions(user_id);
CREATE INDEX idx_recurring_sessions_tutor_id ON recurring_sessions(tutor_id);
CREATE INDEX idx_recurring_sessions_course_id ON recurring_sessions(course_id);
CREATE INDEX idx_recurring_sessions_active ON recurring_sessions(active);

-- Add recurring_session_id column to appointments table
ALTER TABLE appointments
ADD COLUMN recurring_session_id TEXT REFERENCES recurring_sessions(id) ON DELETE SET NULL;

-- Add index for recurring_session_id in appointments
CREATE INDEX idx_appointments_recurring_session_id ON appointments(recurring_session_id);

-- Add recurring_session_id column to slot_holds table
ALTER TABLE slot_holds
ADD COLUMN recurring_session_id TEXT REFERENCES recurring_sessions(id) ON DELETE SET NULL;

-- Enable RLS on recurring_sessions table
ALTER TABLE recurring_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recurring_sessions
CREATE POLICY "Users can view their own recurring sessions" ON recurring_sessions
  FOR SELECT USING (user_id = auth.uid()::text OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

CREATE POLICY "Tutors can view their recurring sessions" ON recurring_sessions
  FOR SELECT USING (tutor_id = auth.uid()::text OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

CREATE POLICY "Users can create recurring sessions" ON recurring_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid()::text OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

CREATE POLICY "Users can update their recurring sessions" ON recurring_sessions
  FOR UPDATE USING (user_id = auth.uid()::text OR (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');

CREATE POLICY "Admins can manage all recurring sessions" ON recurring_sessions
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()::text) = 'admin');
