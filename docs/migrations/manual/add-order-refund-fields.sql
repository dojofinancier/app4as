-- Migration: Add order refund fields to RefundRequest table
-- This migration adds the orderId and stripeRefundId fields to the refund_requests table

-- Add orderId column to refund_requests table
ALTER TABLE refund_requests 
ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add stripeRefundId column to refund_requests table
ALTER TABLE refund_requests 
ADD COLUMN stripe_refund_id VARCHAR(255);

-- Add index for order_id for better query performance
CREATE INDEX idx_refund_requests_order_id ON refund_requests(order_id);

-- Add partially_refunded to OrderStatus enum
-- Note: This might need to be done through Prisma or manually in the database
-- ALTER TYPE "OrderStatus" ADD VALUE 'partially_refunded';

-- Update existing refund_requests to have a default order_id if needed
-- This is optional and depends on your data structure
-- UPDATE refund_requests 
-- SET order_id = (
--   SELECT o.id 
--   FROM orders o 
--   JOIN order_items oi ON o.id = oi.order_id
--   JOIN appointments a ON oi.id = a.order_item_id
--   WHERE a.id = refund_requests.appointment_id
--   LIMIT 1
-- )
-- WHERE order_id IS NULL;







