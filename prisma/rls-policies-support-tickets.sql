-- ============================================================================
-- 4AS Tutor Booking App - RLS Policies for Support Tickets
-- ============================================================================
-- Purpose: Row Level Security policies for support ticket system
-- Run this AFTER creating the tables via Prisma
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Enable RLS on support ticket tables
-- ----------------------------------------------------------------------------

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- SUPPORT_TICKETS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Admin can do everything on all tickets
CREATE POLICY admin_all_tickets ON support_tickets
  FOR ALL
  USING (is_admin());

-- Students can view their own tickets
CREATE POLICY students_select_own_tickets ON support_tickets
  FOR SELECT
  USING (
    auth.uid() = user_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'student'
  );

-- Students can create tickets
CREATE POLICY students_insert_own_tickets ON support_tickets
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'student'
  );

-- Students can update their own tickets (with restrictions in server actions)
-- Allow update but server actions will enforce: can't reopen closed tickets
CREATE POLICY students_update_own_tickets ON support_tickets
  FOR UPDATE
  USING (
    auth.uid() = user_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'student'
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'student'
  );


-- ----------------------------------------------------------------------------
-- TICKET_ATTACHMENTS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Admin can do everything on all attachments
CREATE POLICY admin_all_ticket_attachments ON ticket_attachments
  FOR ALL
  USING (is_admin());

-- Students can view attachments for their own tickets
CREATE POLICY students_select_own_ticket_attachments ON ticket_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_attachments.ticket_id
        AND support_tickets.user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'student'
    )
  );

-- Students can insert attachments for their own tickets
CREATE POLICY students_insert_own_ticket_attachments ON ticket_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_attachments.ticket_id
        AND support_tickets.user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'student'
    )
  );


-- ----------------------------------------------------------------------------
-- TICKET_MESSAGES TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Admin can do everything on all messages (including internal notes)
CREATE POLICY admin_all_ticket_messages ON ticket_messages
  FOR ALL
  USING (is_admin());

-- Students can view non-internal messages for their own tickets
CREATE POLICY students_select_own_ticket_messages ON ticket_messages
  FOR SELECT
  USING (
    is_internal = false AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'student'
    )
  );

-- Students can insert messages for their own tickets (always non-internal)
CREATE POLICY students_insert_own_ticket_messages ON ticket_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    is_internal = false AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
        AND (SELECT role FROM users WHERE id = auth.uid()) = 'student'
    )
  );


-- ----------------------------------------------------------------------------
-- NOTES
-- ----------------------------------------------------------------------------
-- 1. Server actions must enforce:
--    - Students cannot reopen closed tickets (must create new ticket)
--    - Students cannot set priority
--    - Students cannot see internal messages (handled by RLS)
--    - Students cannot change status to certain values (enforced in server actions)
--
-- 2. Status transitions:
--    - Students can close tickets
--    - Students cannot reopen closed tickets
--    - Admin controls all status changes
--
-- 3. Priority is admin-only (not visible to students in UI)
--
-- 4. Internal notes are admin-only (filtered by RLS policy)

