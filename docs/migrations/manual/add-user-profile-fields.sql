-- Add new profile management fields to users table
-- Run this in Supabase SQL Editor

-- Add stripe customer ID field
ALTER TABLE users 
ADD COLUMN stripe_customer_id TEXT;

-- Add default payment method ID field  
ALTER TABLE users 
ADD COLUMN default_payment_method_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN users.default_payment_method_id IS 'Default payment method ID from Stripe';

-- Create indexes for better performance
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_default_payment_method_id ON users(default_payment_method_id);
