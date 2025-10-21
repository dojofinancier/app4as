-- Set up storage policies for message-attachments bucket
-- This uses Supabase's storage policy system instead of direct RLS

-- First, let's ensure the message_attachments table has proper RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can access their own message attachments" ON message_attachments;

-- Create simple policy for message_attachments table
CREATE POLICY "Users can access their own message attachments" ON message_attachments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id = message_attachments.message_id 
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

-- Note: Storage bucket policies need to be created through Supabase Dashboard
-- Go to Storage > message-attachments bucket > Policies tab
-- Add these policies manually:

-- Policy 1: Allow authenticated users to upload files
-- Name: "Allow authenticated uploads"
-- Operation: INSERT
-- Target roles: authenticated
-- USING expression: bucket_id = 'message-attachments'

-- Policy 2: Allow users to read files from their conversations  
-- Name: "Allow users to read their files"
-- Operation: SELECT
-- Target roles: authenticated
-- USING expression: bucket_id = 'message-attachments'

-- Policy 3: Allow users to update files in their conversations
-- Name: "Allow users to update their files" 
-- Operation: UPDATE
-- Target roles: authenticated
-- USING expression: bucket_id = 'message-attachments'
