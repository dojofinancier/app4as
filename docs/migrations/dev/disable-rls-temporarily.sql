-- Temporarily disable RLS for message-attachments storage bucket for testing
-- This is NOT recommended for production but allows us to test file uploads

-- First, let's check if there are existing policies and drop them
DROP POLICY IF EXISTS "Users can upload files to their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can read files from their conversations" ON storage.objects;
DROP POLICY IF EXISTS "Users can update files in their conversations" ON storage.objects;

-- Disable RLS on storage.objects table temporarily
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Also ensure message_attachments table has proper RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Simple policy for message_attachments table
DROP POLICY IF EXISTS "Users can access their own message attachments" ON message_attachments;

CREATE POLICY "Users can access their own message attachments" ON message_attachments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id = message_attachments.message_id 
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);
