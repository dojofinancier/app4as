-- Add the new columns with default values to existing order_items table
ALTER TABLE order_items 
ADD COLUMN end_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE order_items 
ADD COLUMN tutor_earnings_cad DECIMAL(10, 2) DEFAULT 0.00;

-- Update existing rows to calculate end_datetime from start_datetime + duration
UPDATE order_items 
SET end_datetime = start_datetime + (duration_min || ' minutes')::INTERVAL
WHERE end_datetime = NOW(); -- Only update rows that still have the default value

-- Make the columns NOT NULL after updating existing data
ALTER TABLE order_items 
ALTER COLUMN end_datetime SET NOT NULL;

ALTER TABLE order_items 
ALTER COLUMN tutor_earnings_cad SET NOT NULL;

-- Verify the changes
SELECT id, start_datetime, end_datetime, duration_min, tutor_earnings_cad 
FROM order_items 
LIMIT 5;

