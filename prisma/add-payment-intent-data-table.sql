-- Add payment_intent_data table for storing cart data during checkout
-- This avoids Stripe's 500 character metadata limit

BEGIN;

-- Create the payment_intent_data table
CREATE TABLE IF NOT EXISTS public.payment_intent_data (
    id text NOT NULL DEFAULT gen_random_uuid()::text,
    payment_intent_id text NOT NULL,
    cart_data text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT payment_intent_data_pkey PRIMARY KEY (id),
    CONSTRAINT payment_intent_data_payment_intent_id_key UNIQUE (payment_intent_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_intent_data_payment_intent_id ON public.payment_intent_data (payment_intent_id);

-- Add RLS policies
ALTER TABLE public.payment_intent_data ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access payment intent data
CREATE POLICY "Service role can manage payment intent data" ON public.payment_intent_data
    FOR ALL USING (auth.role() = 'service_role');

COMMIT;

