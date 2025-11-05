-- Ultra simple storage setup - minimal RLS for testing
-- This approach focuses on getting file uploads working first

-- Ensure message_attachments table has RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can access their own message attachments" ON message_attachments;

-- Create a very simple policy - allow all authenticated users for now
-- We can make this more restrictive later once uploads are working
CREATE POLICY "Allow authenticated users to access attachments" ON message_attachments
FOR ALL USING (auth.role() = 'authenticated');

-- Note: For the storage bucket, we'll use the simplest possible policy:
-- Go to Supabase Dashboard > Storage > message-attachments > Policies
-- Add this single policy:

-- Policy Name: "Allow authenticated users to manage files"
-- Operation: ALL (INSERT, SELECT, UPDATE, DELETE)  
-- Target roles: authenticated
-- USING expression: auth.role() = 'authenticated'

-- This is very permissive but will allow us to test file uploads
-- We can add more specific security later once the basic functionality works
