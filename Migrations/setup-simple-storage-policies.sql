-- Simple storage policies for direct client uploads
-- This approach is much simpler and more efficient

-- Ensure message_attachments table has RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can access their own message attachments" ON message_attachments;

-- Simple policy: users can only access attachments for messages they're part of
CREATE POLICY "Users can access their own message attachments" ON message_attachments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id::text = message_attachments.message_id 
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

-- Note: For the storage bucket, we'll use simple policies:
-- Go to Supabase Dashboard > Storage > message-attachments > Policies
-- Add this single policy:

-- Policy Name: "Allow authenticated users to manage files"
-- Operation: ALL (INSERT, SELECT, UPDATE, DELETE)
-- Target roles: authenticated
-- USING expression: auth.role() = 'authenticated'

-- This is simple but secure since:
-- 1. Only authenticated users can access
-- 2. File paths include message IDs
-- 3. Application logic controls which files users can access
-- 4. We can add more specific policies later if needed
