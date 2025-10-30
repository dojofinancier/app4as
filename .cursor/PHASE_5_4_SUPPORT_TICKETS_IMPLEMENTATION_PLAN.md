# Phase 5.4: Support Ticket System - Implementation Plan

## Overview
Implement a comprehensive support ticket system where students can submit tickets, admins can manage and respond, with file attachments, context linking (appointments/orders), and Make.com webhook integration.

---

## 1. Database Schema Updates

### 1.1 Prisma Schema Updates
**File:** `prisma/schema.prisma`

**Add Enums:**
```prisma
enum TicketStatus {
  open
  in_progress
  resolved
  closed
}

enum TicketPriority {
  low
  medium
  high
  urgent
}
```

**Add Models:**
```prisma
model SupportTicket {
  id          String         @id @default(uuid())
  userId      String         @map("user_id")
  subject     String
  description String         @db.Text
  category    String         // "réservations", "soutient technique", "demande de cours", "changement de cours/tuteur", "paiement", "autre"
  priority    TicketPriority @default(medium)
  status      TicketStatus   @default(open)
  assignedTo  String?        @map("assigned_to")
  appointmentId String?      @map("appointment_id")
  orderId     String?        @map("order_id")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  resolvedAt  DateTime?      @map("resolved_at")

  user        User             @relation(fields: [userId], references: [id])
  assignee    User?            @relation("AssignedTickets", fields: [assignedTo], references: [id])
  appointment Appointment?     @relation(fields: [appointmentId], references: [id])
  order       Order?           @relation(fields: [orderId], references: [id])
  attachments TicketAttachment[]
  messages    TicketMessage[]

  @@index([userId, status])
  @@index([assignedTo, status])
  @@index([appointmentId])
  @@index([orderId])
  @@map("support_tickets")
}

model TicketAttachment {
  id       String   @id @default(uuid())
  ticketId String   @map("ticket_id")
  fileName String   @map("file_name")
  filePath String   @map("file_path")
  fileType String   @map("file_type")
  fileSize Int      @map("file_size")
  
  ticket SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  @@index([ticketId])
  @@map("ticket_attachments")
}

model TicketMessage {
  id        String   @id @default(uuid())
  ticketId  String   @map("ticket_id")
  userId    String   @map("user_id")
  message   String   @db.Text
  isInternal Boolean @default(false) @map("is_internal") // Admin-only notes
  createdAt DateTime @default(now()) @map("created_at")

  ticket SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user   User          @relation(fields: [userId], references: [id])

  @@index([ticketId])
  @@index([userId])
  @@map("ticket_messages")
}
```

**Update Relations:**
- Add to `User` model:
```prisma
assignedTickets     SupportTicket[] @relation("AssignedTickets")
ticketMessages      TicketMessage[]
supportTickets      SupportTicket[]
```

- Add to `Appointment` model:
```prisma
supportTickets      SupportTicket[]
```

- Add to `Order` model:
```prisma
supportTickets      SupportTicket[]
```

### 1.2 Migration Script
**File:** `prisma/migrations/add-support-tickets.sql`

After schema update, run:
```bash
npm run prisma:generate
npm run prisma:push
```

---

## 2. RLS Policies

### 2.1 RLS Policy File
**File:** `prisma/rls-policies-support-tickets.sql`

**Policies for `support_tickets`:**
- Students: Can SELECT/INSERT/UPDATE their own tickets (can't change status to closed after resolved, can't reopen)
- Admins: Full CRUD access to all tickets
- Tutors: No access (for now)

**Policies for `ticket_attachments`:**
- Students: Can SELECT/INSERT attachments for their own tickets
- Admins: Full CRUD access to all attachments

**Policies for `ticket_messages`:**
- Students: Can SELECT/INSERT messages for their own tickets (only non-internal)
- Admins: Full CRUD access, can see internal messages

**Implementation Details:**
- Check if user owns ticket: `userId = auth.uid()`
- Check if admin: `(SELECT role FROM users WHERE id = auth.uid()) = 'admin'`
- Prevent students from reopening: Status transitions enforced in server actions

---

## 3. Server Actions

### 3.1 Student Actions
**File:** `lib/actions/support-tickets.ts` (NEW)

**Functions:**
1. `createSupportTicket(data)`
   - Validate user is student
   - Validate appointment/order belongs to user (if provided)
   - Create ticket with status "open"
   - Trigger Make.com webhook
   - Return ticket ID

2. `getStudentTickets(params)`
   - Get all tickets for current user
   - Support filtering by status
   - Include messages count, last message date
   - Return paginated results

3. `getTicketDetails(ticketId)`
   - Verify user owns ticket
   - Return ticket with messages (exclude internal), attachments, appointment/order context

4. `addTicketMessage(ticketId, message, attachments?)`
   - Verify user owns ticket
   - Verify ticket is not closed
   - Create message (isInternal = false)
   - Upload attachments if provided
   - Update ticket updatedAt
   - Trigger Make.com webhook
   - Return message ID

5. `closeTicket(ticketId)`
   - Verify user owns ticket
   - Verify ticket status is not "closed"
   - Update status to "closed"
   - Update updatedAt
   - Trigger Make.com webhook

6. `getStudentAppointmentsForTicket()`
   - Get user's appointments (for dropdown selection)
   - Return simplified list: id, course title, tutor name, date

7. `getStudentOrdersForTicket()`
   - Get user's orders (for dropdown selection)
   - Return simplified list: id, total, date, status

### 3.2 Admin Actions
**File:** `lib/actions/admin.ts` (ADD TO EXISTING)

**Functions:**
1. `getAllSupportTickets(params)`
   - Filter by: status, priority, category, assignedTo, date range, search (subject/description)
   - Sort by: createdAt, updatedAt, priority, status
   - Pagination with cursor
   - Include user info, assignee info, message count

2. `getTicketDetails(ticketId)` (Admin version)
   - Full access to all tickets
   - Include internal messages
   - Include all attachments
   - Include appointment/order context

3. `updateTicketStatus(ticketId, status, reason?)`
   - Update status
   - Auto-set resolvedAt if status = "resolved"
   - Log change reason
   - Trigger Make.com webhook

4. `updateTicketPriority(ticketId, priority)`
   - Update priority (admin-only)
   - Trigger Make.com webhook (optional)

5. `assignTicket(ticketId, adminId)`
   - Verify assignee is admin
   - Update assignedTo
   - Trigger Make.com webhook

6. `addTicketMessage(ticketId, message, isInternal, attachments?)`
   - Create message (can be internal)
   - Upload attachments if provided
   - Update ticket updatedAt
   - Trigger Make.com webhook

7. `getAdminsForAssignment()`
   - Get list of admin users for assignment dropdown
   - Return: id, firstName, lastName, email

---

## 4. Components - Student Side

### 4.1 Support Tickets Tab Component
**File:** `components/dashboard/support-tickets-tab.tsx` (NEW)

**Features:**
- List of student's tickets
- Filter by status
- Quick stats (open, in progress, resolved, closed)
- "Create New Ticket" button
- Click ticket to view details

**UI Structure:**
- Status badges (color-coded)
- Category badges
- Last updated date
- Unread indicator (if admin replied)

### 4.2 Create Ticket Modal
**File:** `components/dashboard/create-ticket-modal.tsx` (NEW)

**Form Fields:**
- Subject (required)
- Category (dropdown: réservations, soutient technique, demande de cours, changement de cours/tuteur, paiement, autre)
- Description (textarea, required)
- Link to Appointment (optional dropdown - shows user's appointments)
- Link to Order (optional dropdown - shows user's orders)
- File attachments (optional, same as message attachments)

**Validation:**
- Subject: min 5 chars, max 200 chars
- Description: min 10 chars, max 5000 chars
- File size: max 32MB
- File types: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP

### 4.3 Ticket Details Modal
**File:** `components/dashboard/ticket-details-modal.tsx` (NEW)

**Features:**
- Display ticket info (subject, category, status, dates)
- Show linked appointment/order if exists
- Threaded messages (student messages + admin replies)
- File attachments list
- Reply form (only if ticket not closed)
- Close ticket button (if ticket not closed)
- Assignment status badge (no admin name shown)

**Message Thread:**
- Show sender name (You / Admin)
- Timestamp
- File attachments below message
- Internal notes not shown to students

### 4.4 Integration Points

**Update `components/dashboard/student-dashboard.tsx`:**
- Add "Support Tickets" card in overview tab
- Add "Support Tickets" option in messages tab (or separate tab)
- Show ticket count badge

**Update `components/messaging/messaging-tab.tsx`:**
- Add "Support Tickets" section or link
- Or integrate tickets into messaging interface

---

## 5. Components - Admin Side

### 5.1 Support Tickets Management Component
**File:** `components/admin/support-tickets-management.tsx` (NEW)

**Features:**
- Comprehensive filter bar:
  - Status dropdown (all, open, in_progress, resolved, closed)
  - Priority dropdown (all, low, medium, high, urgent)
  - Category dropdown (all categories)
  - Assigned to dropdown (all admins + unassigned)
  - Date range picker (createdAt)
  - Search input (subject, description)
- Sort dropdown (createdAt desc/asc, updatedAt desc/asc, priority desc/asc, status)
- Infinite scroll pagination (20 per page)
- Ticket cards/table view:
  - ID, Subject, Category, Status, Priority, Assignee, Created date, Last updated
  - Unread messages indicator
  - Quick actions (view, assign, respond)

### 5.2 Ticket Details Modal (Admin)
**File:** `components/admin/ticket-details-modal.tsx` (NEW)

**Features:**
- Full ticket information
- Status change dropdown with reason field
- Priority selector (not visible to student)
- Assign to admin dropdown
- Message thread (shows internal messages)
- File attachments list
- Reply form (with checkbox for internal note)
- Link to related appointment/order
- User information card
- Ticket history/log

**Admin Actions:**
- Change status (with reason)
- Change priority
- Assign/unassign
- Add internal note
- Add public reply
- View ticket context (appointment/order details)

### 5.3 Integration Points

**Update `components/dashboard/admin-dashboard.tsx`:**
- Replace placeholder support tickets card with real data
- Add "Support Tickets" tab in admin navigation
- Show unresolved tickets count and recent tickets list

---

## 6. Webhook Integration

### 6.1 Make.com Webhook Functions
**File:** `lib/webhooks/make.ts` (UPDATE EXISTING)

**Add Functions:**

1. `sendTicketWebhook(type, data)`
   - Types: `ticket.created`, `ticket.status_changed`, `ticket.message_added`
   - Payload includes ticket details, user info, changes

2. `sendTicketCreatedWebhook(data)`
   - Triggered when student creates ticket
   - Payload: ticket_id, user_id, user_email, subject, category, priority, status, created_at

3. `sendTicketStatusChangedWebhook(data)`
   - Triggered when status changes
   - Payload: ticket_id, user_id, user_email, old_status, new_status, changed_by, reason, timestamp

4. `sendTicketMessageWebhook(data)`
   - Triggered when student or admin adds message
   - Payload: ticket_id, message_id, user_id, user_email, sender_role, message, is_internal, timestamp

**Environment Variables:**
- `MAKE_TICKET_WEBHOOK_URL` (or use existing `MAKE_BOOKING_WEBHOOK_URL` if same endpoint)

### 6.2 Webhook Trigger Points

**In Server Actions:**
- `createSupportTicket()` → `sendTicketCreatedWebhook()`
- `updateTicketStatus()` → `sendTicketStatusChangedWebhook()`
- `addTicketMessage()` → `sendTicketMessageWebhook()`
- `updateTicketPriority()` → `sendTicketStatusChangedWebhook()` (optional)

---

## 7. File Upload Handling

### 7.1 Ticket Attachment Upload
**File:** `lib/actions/ticket-attachments.ts` (NEW)

**Functions:**
1. `uploadTicketAttachment(ticketId, fileData)`
   - Reuse existing file upload logic from `lib/actions/file-upload.ts`
   - Validate file size (32MB max)
   - Validate file type
   - Upload to `message-attachments` bucket (same as messages)
   - Path: `ticket-attachments/{ticketId}/{timestamp}_{filename}`
   - Create `TicketAttachment` record
   - Return attachment ID

2. `getTicketAttachmentDownloadUrl(attachmentId)`
   - Generate signed URL from Supabase Storage
   - Verify user has access to ticket

### 7.2 Storage Bucket
- Use existing `message-attachments` bucket
- Path structure: `ticket-attachments/{ticketId}/{timestamp}_{filename}`
- Update RLS policies for bucket access

---

## 8. Implementation Steps

### Step 1: Database Setup (2-3 hours)
1. ✅ Update Prisma schema with new models and enums
2. ✅ Generate Prisma client
3. ✅ Push schema to database
4. ✅ Create RLS policies SQL file
5. ✅ Apply RLS policies in Supabase
6. ✅ Test RLS policies with different roles

### Step 2: Server Actions - Student (4-5 hours)
1. ✅ Create `lib/actions/support-tickets.ts`
2. ✅ Implement `createSupportTicket()`
3. ✅ Implement `getStudentTickets()`
4. ✅ Implement `getTicketDetails()`
5. ✅ Implement `addTicketMessage()`
6. ✅ Implement `closeTicket()`
7. ✅ Implement `getStudentAppointmentsForTicket()`
8. ✅ Implement `getStudentOrdersForTicket()`
9. ✅ Add error handling and validation
10. ✅ Test all functions

### Step 3: Server Actions - Admin (4-5 hours)
1. ✅ Add admin functions to `lib/actions/admin.ts`
2. ✅ Implement `getAllSupportTickets()`
3. ✅ Implement `getTicketDetails()` (admin version)
4. ✅ Implement `updateTicketStatus()`
5. ✅ Implement `updateTicketPriority()`
6. ✅ Implement `assignTicket()`
7. ✅ Implement `addTicketMessage()` (admin version)
8. ✅ Implement `getAdminsForAssignment()`
9. ✅ Add error handling and validation
10. ✅ Test all functions

### Step 4: Webhook Integration (2-3 hours)
1. ✅ Update `lib/webhooks/make.ts`
2. ✅ Add `sendTicketCreatedWebhook()`
3. ✅ Add `sendTicketStatusChangedWebhook()`
4. ✅ Add `sendTicketMessageWebhook()`
5. ✅ Integrate webhooks into server actions
6. ✅ Test webhook payloads

### Step 5: File Upload (2-3 hours)
1. ✅ Create `lib/actions/ticket-attachments.ts`
2. ✅ Implement `uploadTicketAttachment()`
3. ✅ Implement `getTicketAttachmentDownloadUrl()`
4. ✅ Test file uploads
5. ✅ Test file downloads

### Step 6: Student UI Components (8-10 hours)
1. ✅ Create `components/dashboard/support-tickets-tab.tsx`
2. ✅ Create `components/dashboard/create-ticket-modal.tsx`
3. ✅ Create `components/dashboard/ticket-details-modal.tsx`
4. ✅ Update `components/dashboard/student-dashboard.tsx`
5. ✅ Integrate tickets into overview tab
6. ✅ Integrate tickets into messages tab
7. ✅ Add French translations
8. ✅ Test UI flows

### Step 7: Admin UI Components (10-12 hours)
1. ✅ Create `components/admin/support-tickets-management.tsx`
2. ✅ Create `components/admin/ticket-details-modal.tsx`
3. ✅ Update `components/dashboard/admin-dashboard.tsx`
4. ✅ Replace placeholder with real data
5. ✅ Add filters and sorting
6. ✅ Add infinite scroll
7. ✅ Add French translations
8. ✅ Test admin flows

### Step 8: Testing & Polish (4-6 hours)
1. ✅ Test student ticket creation flow
2. ✅ Test admin ticket management flow
3. ✅ Test file attachments
4. ✅ Test webhook delivery
5. ✅ Test RLS policies
6. ✅ Test status transitions
7. ✅ Test priority changes
8. ✅ Test assignment functionality
9. ✅ Test internal notes
10. ✅ Fix bugs and polish UI

**Total Estimated Time:** 36-48 hours

---

## 9. Acceptance Criteria Checklist

### Student Features
- [ ] Student can create ticket with subject, category, description
- [ ] Student can link ticket to appointment or order
- [ ] Student can upload file attachments
- [ ] Student can view all their tickets
- [ ] Student can view ticket details and message thread
- [ ] Student can reply to tickets
- [ ] Student can close tickets
- [ ] Student cannot reopen closed tickets
- [ ] Student cannot see internal admin notes
- [ ] Student cannot set priority
- [ ] Student sees assignment status (not admin name)

### Admin Features
- [ ] Admin can view all tickets with filters
- [ ] Admin can filter by status, priority, category, assignee, date range, search
- [ ] Admin can sort tickets
- [ ] Admin can view ticket details
- [ ] Admin can change ticket status
- [ ] Admin can change ticket priority
- [ ] Admin can assign tickets to admins
- [ ] Admin can reply to tickets
- [ ] Admin can add internal notes
- [ ] Admin can see ticket context (appointment/order)
- [ ] Admin can view user information

### Technical Requirements
- [ ] RLS policies enforce proper access control
- [ ] File uploads work (32MB max, valid types)
- [ ] Webhooks trigger correctly (created, status change, message)
- [ ] Status transitions work correctly
- [ ] Priority changes work (admin-only)
- [ ] Assignment works correctly
- [ ] Internal notes hidden from students
- [ ] French translations complete
- [ ] Mobile responsive design
- [ ] Error handling graceful

---

## 10. Notes & Considerations

### Categories
- Predefined categories: "réservations", "soutient technique", "demande de cours", "changement de cours/tuteur", "paiement", "autre"
- Categories can be edited by admin in future (store in database or config)

### Priority System
- Priority is admin-only, not visible to students
- Used internally for admin workflow
- Can be changed by admin at any time

### Status Flow
- open → in_progress → resolved → closed
- Students can close tickets directly
- Students cannot reopen closed tickets (must create new ticket)
- resolvedAt set automatically when status = "resolved"

### File Attachments
- Same bucket as messages: `message-attachments`
- Path: `ticket-attachments/{ticketId}/{timestamp}_{filename}`
- Same size/type limits as messages

### Webhook Events
- `ticket.created` - When student creates ticket
- `ticket.status_changed` - When status changes
- `ticket.message_added` - When student or admin adds message

### Future Enhancements (V2)
- Ticket categories editable by admin
- Email notifications (via Make.com)
- Ticket templates
- Auto-assignment rules
- Ticket SLA tracking
- Ticket analytics dashboard

---

## 11. File Structure Summary

**New Files:**
- `lib/actions/support-tickets.ts`
- `lib/actions/ticket-attachments.ts`
- `components/dashboard/support-tickets-tab.tsx`
- `components/dashboard/create-ticket-modal.tsx`
- `components/dashboard/ticket-details-modal.tsx`
- `components/admin/support-tickets-management.tsx`
- `components/admin/ticket-details-modal.tsx`
- `prisma/rls-policies-support-tickets.sql`

**Modified Files:**
- `prisma/schema.prisma`
- `lib/actions/admin.ts`
- `lib/webhooks/make.ts`
- `components/dashboard/student-dashboard.tsx`
- `components/dashboard/admin-dashboard.tsx`
- `components/messaging/messaging-tab.tsx`
- `lib/i18n/fr-CA.ts` (add ticket-related translations)

---

**Ready for implementation!** 🚀

