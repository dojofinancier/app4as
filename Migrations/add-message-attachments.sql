-- Add message attachments table
CREATE TABLE message_attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for message_attachments
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

-- Add attachments relation to messages table (this is handled by Prisma relations)
-- No additional columns needed as it's a one-to-many relationship
