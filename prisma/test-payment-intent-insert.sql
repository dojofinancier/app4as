-- Test direct insert into payment_intent_data table
-- This will help us determine if it's a database permission issue or Prisma client issue

-- 1. Test basic insert
INSERT INTO payment_intent_data (payment_intent_id, cart_data) 
VALUES ('test_pi_direct_123', '{"test": "direct insert test"}');

-- 2. Check if the insert worked
SELECT * FROM payment_intent_data WHERE payment_intent_id = 'test_pi_direct_123';

-- 3. Clean up test data
DELETE FROM payment_intent_data WHERE payment_intent_id = 'test_pi_direct_123';

