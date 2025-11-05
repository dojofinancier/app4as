    -- Enable RLS on message_attachments table
    ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

    -- Create RLS policy for message attachments
    -- Users can only access attachments for messages they sent or received
    CREATE POLICY "Users can access their own message attachments" ON message_attachments
    FOR ALL USING (
    EXISTS (
        SELECT 1 FROM messages 
        WHERE messages.id = message_attachments.message_id 
        AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
    )
    );

-- Create RLS policy for the message-attachments storage bucket
-- This allows users to upload files to conversations they're part of
CREATE POLICY "Users can upload files to their conversations" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'message-attachments' 
  AND EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id::text = split_part(name, '/', 2)
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

-- Allow users to read files from their conversations
CREATE POLICY "Users can read files from their conversations" ON storage.objects
FOR SELECT USING (
  bucket_id = 'message-attachments' 
  AND EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id::text = split_part(name, '/', 2)
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

-- Allow users to update files in their conversations (for potential future features)
CREATE POLICY "Users can update files in their conversations" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'message-attachments' 
  AND EXISTS (
    SELECT 1 FROM messages 
    WHERE messages.id::text = split_part(name, '/', 2)
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);
