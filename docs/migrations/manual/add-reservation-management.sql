-- Add reservation management and credit bank system
-- Run this in Supabase SQL Editor

-- Add credit balance to users table
ALTER TABLE users 
ADD COLUMN credit_balance DECIMAL(10,2) DEFAULT 0;

-- Add cancellation fields to appointments table
ALTER TABLE appointments 
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_by TEXT,
ADD COLUMN cancelled_at TIMESTAMP;

-- Create credit_transactions table
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'used', 'refunded')),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create refund_requests table
CREATE TABLE refund_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  processed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create appointment_modifications table
CREATE TABLE appointment_modifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  modified_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modification_type TEXT NOT NULL CHECK (modification_type IN ('reschedule', 'cancel', 'tutor_change', 'course_change')),
  reason TEXT,
  old_data JSONB NOT NULL,
  new_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_appointment_id ON credit_transactions(appointment_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);

CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_appointment_id ON refund_requests(appointment_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);

CREATE INDEX idx_appointment_modifications_appointment_id ON appointment_modifications(appointment_id);
CREATE INDEX idx_appointment_modifications_modified_by ON appointment_modifications(modified_by);
CREATE INDEX idx_appointment_modifications_type ON appointment_modifications(modification_type);

-- Add comments for documentation
COMMENT ON COLUMN users.credit_balance IS 'Credit balance in CAD for cancelled appointments';
COMMENT ON COLUMN appointments.cancellation_reason IS 'Reason provided by user for cancellation';
COMMENT ON COLUMN appointments.cancelled_by IS 'Who cancelled: student, tutor, or admin';
COMMENT ON COLUMN appointments.cancelled_at IS 'When the appointment was cancelled';

COMMENT ON TABLE credit_transactions IS 'Track credit bank transactions (earned, used, refunded)';
COMMENT ON TABLE refund_requests IS 'Track refund requests from students';
COMMENT ON TABLE appointment_modifications IS 'Audit log of all appointment changes';
