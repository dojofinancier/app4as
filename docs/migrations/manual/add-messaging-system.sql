-- Add messaging system tables
-- This migration creates the Message table for the student-tutor messaging system

-- Create messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX idx_messages_appointment_id ON messages(appointment_id);

-- Add comments for documentation
COMMENT ON TABLE messages IS 'Messages between students and tutors';
COMMENT ON COLUMN messages.sender_id IS 'ID of the user who sent the message';
COMMENT ON COLUMN messages.receiver_id IS 'ID of the user who received the message';
COMMENT ON COLUMN messages.appointment_id IS 'Optional appointment ID for context';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read by the receiver';
COMMENT ON COLUMN messages.created_at IS 'When the message was sent';
