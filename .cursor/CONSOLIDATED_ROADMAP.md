# 4AS Tutor Booking Application - Consolidated Development Roadmap

## Overview
This roadmap consolidates the original prompt, implementation plan, and feature tracking into a single source of truth. It defines V1 scope, implementation order, and cross-cutting concerns to ensure consistency across all features.

---

## **Project Specifications (V1 Scope)**

### **Core Requirements**
- **Language:** French (Canada) UI only
- **Currency:** CAD only, no taxes
- **Timezone:** Single timezone (EST/EDT, no conversions)
- **Payment:** Stripe Payment Intents (card saving enabled)
- **Booking:** Cart-based flow (unlimited slots before payment)
- **Guest Checkout:** Supported with account creation on payment
- **Webhooks:** Make.com for all student/tutor events
- **Deployment:** Netlify with scheduled functions

### **Tech Stack**
- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, shadcn/ui enhanced with [TweakCN](https://tweakcn.com/)
- **Database:** Supabase PostgreSQL + Prisma ORM
- **Auth:** Supabase Auth (Email + OAuth)
- **Payments:** Stripe Payment Intents
- **Storage:** Supabase Storage (message attachments)

### **Booking Rules**
- **Durations:** 60, 90, or 120 minutes only
- **Slot Grid:** 30-minute increments
- **Lead Time:** 12 hours minimum, 60 days maximum
- **Holds:** 15 minutes TTL, inline cleanup
- **Cancellation:** 2 hours before start (credit issued)
- **Reschedule:** 24 hours before start
- **Pricing:** Dual rate system with linear multipliers
  - **Tutor Rate:** What tutors earn (set by admin, visible to tutor only)
  - **Course/Student Rate:** What students pay (set by admin per course, visible to students)
  - **Multipliers:** 60min base, 90min ×1.5, 120min ×2 (applied to course rate for students)
  - **Example:** Tutor earns $30/h, student pays $45/h (60min session)

---

## **Implementation Status Legend**
- ✅ **Completed & Tested** - Feature is fully functional
- 🚧 **Partially Implemented** - Core logic exists but incomplete
- ⚠️ **Needs Refactoring** - Implemented but breaks other features
- 🔲 **Not Started** - To be implemented
- 🔄 **V2 Deferred** - Moved to future version

---

## **PHASE 0: Cleanup & Foundation (CURRENT PRIORITY)**

### **0.1 Code Cleanup**
**Status:** 🚧 In Progress

**Tasks:**
- [x] Audit existing code
- [ ] Remove test/debug API routes:
  - `app/api/test/`
  - `app/api/debug-*`
  - `app/api/test-appointment/`
  - `app/api/test-tutor-relationship/`
- [ ] Remove direct booking flow:
  - `lib/actions/booking.ts`
  - Direct reservation pages if any
  - Old checkout components
- [ ] Consolidate duplicate utilities
- [ ] Review and organize `lib/actions/` structure

**Acceptance Criteria:**
- No unused API routes in production
- Single payment flow (cart-based only)
- Clean file structure without duplicates

---

### **0.2 Database Schema Hardening & Dual Rate System**
**Status:** 🚧 In Progress

**Tasks:**
- [ ] **Add Dual Rate System to Schema:**
  - [ ] Add `studentRateCad` (Decimal) to `Course` model
  - [ ] Keep `hourlyBaseRateCad` on `Tutor` model (tutor earnings)
  - [ ] Update pricing calculations to use course rate for students
  - [ ] Update cart/order calculations
  - [ ] Migration script to set default course rates
- [ ] Add CHECK constraints:
  - Duration validation (60, 90, 120)
  - Price > 0 validations (both tutor and course rates)
  - Date/time logic (end > start)
  - Weekday range (0-6)
  - Coupon redemption limits
  - Recurring session counters
- [ ] Review and consolidate RLS policies:
  - Remove conflicting policies
  - Ensure student/tutor/admin scopes are consistent
  - Test policies with each role
- [ ] Add missing indexes for performance:
  - `appointments(userId, status, startDatetime)`
  - `messages(receiverId, isRead, createdAt)`
  - `recurring_sessions(userId, active)`
- [ ] Verify all foreign key constraints

**Acceptance Criteria:**
- Dual rate system implemented in schema
- Course rates visible to students only
- Tutor rates visible to tutors and admins only
- Single, clean RLS policy file applied
- All constraints documented in schema
- Query performance optimized with indexes
- No duplicate or conflicting policies

**Database Schema Changes:**
```prisma
model Course {
  id            String   @id @default(uuid())
  slug          String   @unique
  titleFr       String   @map("title_fr")
  descriptionFr String   @map("description_fr") @db.Text
  studentRateCad Decimal @map("student_rate_cad") @db.Decimal(10, 2) @default(45.00) // NEW: What students pay
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  // ... relations
}

model Tutor {
  // ... existing fields
  hourlyBaseRateCad  Decimal @map("hourly_base_rate_cad") @db.Decimal(10, 2) // What tutors earn
  // ... rest of model
}
```

**Deliverables:**
- `prisma/schema.prisma` with all constraints
- `prisma/rls-policies-v1.sql` (single source of truth)
- `prisma/seed.ts` updated with valid test data

---

### **0.3 Environment & Configuration Audit**
**Status:** 🚧 In Progress

**Tasks:**
- [ ] Document all required environment variables
- [ ] Remove placeholders for unused features (Google/Microsoft OAuth - V2)
- [ ] Add Make.com webhook URLs to .env.example:
  - `MAKE_SIGNUP_WEBHOOK_URL`
  - `MAKE_BOOKING_WEBHOOK_URL`
  - `MAKE_CANCELLATION_WEBHOOK_URL`
  - `MAKE_MESSAGE_WEBHOOK_URL`
- [ ] Verify Stripe keys are for Payment Intents (not Checkout Sessions)
- [ ] Set up Netlify environment variables

**Acceptance Criteria:**
- `.env.example` accurately reflects V1 requirements
- No unused environment variables
- All Make.com webhook endpoints documented

---

## **PHASE 1: Core Booking Flow (Cart-Based)**

### **1.1 Slot Generation Engine**
**Status:** ✅ Completed

**Location:** `lib/slots/generator.ts`

**Features:**
- [x] Tutor availability from weekly rules
- [x] Availability exceptions (one-off blocks)
- [x] Time off subtraction
- [x] Appointment conflict detection
- [x] Slot hold conflict detection
- [x] 30-minute grid generation
- [x] Lead time constraints (12h min, 60 days max)
- [x] Union availability for courses

**Acceptance Criteria:**
- Slots respect all tutor constraints
- Holds and appointments block slots
- Lead time enforced
- No duplicate slots generated

---

### **1.2 Cart System with Holds**
**Status:** ⚠️ Needs Refactoring (recurring sessions broke cart)

**Location:** `lib/actions/cart.ts`, `components/cart/`

**Tasks:**
- [ ] **Fix:** Ensure cart works for both single and recurring sessions
- [ ] **Fix:** Inline hold cleanup on cart operations
- [ ] Add to cart creates 15-min hold
- [ ] Remove from cart releases hold
- [ ] Apply coupon validation (date range, redemption count)
- [ ] Cart totals calculation with discount
- [ ] Guest cart support (temporary user ID)
- [ ] Cart item validation before checkout

**Acceptance Criteria:**
- Adding slot creates hold and prevents double-booking
- Removing slot releases hold immediately
- Holds expire after 15 minutes (inline cleanup)
- Coupons apply correctly (% or fixed)
- Cart works for logged-in and guest users
- Recurring sessions properly integrate with cart

---

### **1.3 Stripe Payment Intent Checkout**
**Status:** 🚧 Partially Implemented

**Location:** `app/checkout/`, `lib/actions/checkout.ts`

**Tasks:**
- [ ] **Refactor:** Create single checkout page from cart
- [ ] Remove old direct booking checkout
- [ ] Guest checkout form (create account + payment)
- [ ] Logged-in checkout (use saved card or new card)
- [ ] Save payment method option for future use
- [ ] Billing address collection
- [ ] Payment confirmation handling
- [ ] Error handling and retry logic

**Acceptance Criteria:**
- Cart items displayed in checkout summary
- Guest can create account and pay in one flow
- Logged-in users can save cards
- Payment succeeds and triggers webhook
- Failed payments release holds

---

### **1.4 Stripe Webhook Handler**
**Status:** 🚧 Partially Implemented

**Location:** `app/api/webhooks/stripe/route.ts`

**Tasks:**
- [ ] **Fix:** Handle Payment Intent succeeded (not Checkout Session)
- [ ] Idempotent order creation (check `stripePaymentIntentId`)
- [ ] Atomic transaction:
  - Create `Order` and `OrderItems`
  - Convert holds to `Appointments`
  - Delete holds
  - Update coupon redemption count
- [ ] Conflict check before appointment creation
- [ ] Refund on conflict detection
- [ ] Guest account finalization (link Stripe customer ID)
- [ ] Trigger Make.com booking webhook
- [ ] Log to `webhook_events` table

**Acceptance Criteria:**
- Payment creates order and appointments atomically
- Holds converted to appointments on success
- Conflicts detected and refunded
- Make.com webhook sent on success
- All webhook events logged

---

### **1.5 Make.com Webhooks**
**Status:** 🔲 Not Started

**Location:** `lib/webhooks/make.ts` (to create)

**Tasks:**
- [ ] Create webhook utility function
- [ ] Implement retry logic (3 attempts with exponential backoff)
- [ ] Event types:
  - `signup` (user creation)
  - `booking.created` (after payment)
  - `booking.cancelled` (student/tutor/admin)
  - `booking.rescheduled`
  - `message.sent` (student ↔ tutor)
- [ ] Payload formatting (per original spec)
- [ ] Error logging and admin notification on failure
- [ ] Webhook event recording in DB

**Acceptance Criteria:**
- All specified events trigger webhooks
- Retries happen automatically (max 3)
- Failed webhooks notify admin
- Webhook payload matches spec format

---

## **PHASE 2: Student Dashboard Features**

### **2.1 Enhanced Profile Management**
**Status:** ✅ Completed

**Location:** `components/dashboard/profile-management-tab.tsx`

**Features:**
- [x] Update profile info (name, phone)
- [x] Change password
- [x] View account creation date
- [x] View Stripe customer info

**Acceptance Criteria:**
- Student can update personal information
- Password change works securely
- Changes persist and revalidate

---

### **2.2 Reservation Management**
**Status:** ✅ Completed

**Location:** `components/dashboard/reservation-management-tab.tsx`

**Features:**
- [x] View upcoming appointments
- [x] View past appointments
- [x] Cancel appointments (2-hour cutoff)
- [x] Credit bank system (credits issued on cancellation)
- [x] Reschedule appointments (24-hour cutoff)
- [x] Cancellation reason tracking
- [x] Modification history

**Acceptance Criteria:**
- Cancellation creates credit transaction
- Reschedule validates 24-hour window
- All modifications logged
- Credits displayed and tracked

---

### **2.3 Student Messaging System**
**Status:** ✅ Completed (Phase 1 & 2)

**Location:** `components/messaging/messaging-tab.tsx`

**Features:**
- [x] Send messages to tutors
- [x] View conversation history
- [x] File attachments (Phase 2)
- [x] Message read status
- [x] Trigger Make.com webhook on message send

**Remaining Tasks:**
- [ ] Add Make.com webhook for messages
- [ ] Real-time message updates (polling or WebSocket - optional)

**Acceptance Criteria:**
- Students can message tutors about appointments
- Files upload to Supabase Storage
- Message history persists
- Make.com webhook sent on new message

---

### **2.4 Payment Methods Management**
**Status:** ✅ Completed

**Location:** `components/dashboard/profile-management-tab.tsx`

**Features:**
- [x] View saved payment methods
- [x] Add new payment method
- [x] Set default payment method
- [x] Remove payment method
- [x] Stripe customer integration

**Acceptance Criteria:**
- Payment methods sync with Stripe
- Default method used in checkout
- Secure storage via Stripe

---

### **2.5 Recurring Sessions Booking**
**Status:** ⚠️ Needs Refactoring (broke existing flow)

**Location:** `components/booking/recurring-session-form.tsx`, `lib/actions/recurring-sessions.ts`

**Tasks:**
- [ ] **Fix:** Integrate recurring sessions with cart flow (not separate)
- [ ] **Fix:** Ensure single bookings still work
- [ ] Weekly/bi-weekly frequency selection
- [ ] Total sessions input
- [ ] Create all appointments upfront (pay upfront)
- [ ] Validate all slots are available before payment
- [ ] Create holds for all recurring slots
- [ ] Cancel individual sessions (credits issued)
- [ ] Track recurring session progress

**Acceptance Criteria:**
- Recurring sessions added to cart like single slots
- All sessions validated before payment
- Payment creates all appointments at once
- Individual sessions can be cancelled
- Credits issued per session cancelled
- Recurring booking doesn't break single booking

---

## **PHASE 3: Tutor Dashboard Features**

### **3.1 Tutor Overview & Stats**
**Status:** ✅ Completed

**Location:** `components/dashboard/tutor-dashboard.tsx`

**Features:**
- [x] Today's appointments count
- [x] Upcoming appointments count
- [x] Display hourly rate
- [x] Profile information display
- [x] Courses taught badges
- [x] Active status badge

**Acceptance Criteria:**
- Stats calculate correctly
- Today's appointments filtered properly
- Profile info displayed accurately

---

### **3.2 Availability Management (CRUD)**
**Status:** 🔲 Not Started (HIGH PRIORITY)

**Location:** To create in `components/dashboard/tutor/`

**Tasks:**
- [ ] **Weekly Recurring Rules:**
  - [ ] Create availability rule form (weekday, start time, end time)
  - [ ] List all recurring rules
  - [ ] Edit existing rule
  - [ ] Delete rule
  - [ ] Validation: end > start, no overlaps
- [ ] **Availability Exceptions:**
  - [ ] Create exception form (specific date, open/closed)
  - [ ] List upcoming exceptions
  - [ ] Edit exception
  - [ ] Delete exception
- [ ] **Time Off Management:**
  - [ ] Create time off form (date range)
  - [ ] List time off periods
  - [ ] Edit time off
  - [ ] Delete time off
  - [ ] Prevent bookings during time off

**Server Actions Needed:**
- `lib/actions/availability.ts`:
  - `createAvailabilityRule()`
  - `updateAvailabilityRule()`
  - `deleteAvailabilityRule()`
  - `createAvailabilityException()`
  - `updateAvailabilityException()`
  - `deleteAvailabilityException()`
  - `createTimeOff()`
  - `updateTimeOff()`
  - `deleteTimeOff()`

**Acceptance Criteria:**
- Tutors can set weekly recurring hours
- Exceptions override recurring rules
- Time off blocks all bookings in range
- Slot generator respects all availability changes immediately
- Form validation prevents invalid entries
- Changes reflect in student-facing calendars instantly

---

### **3.3 Tutor Appointments Management**
**Status:** 🔲 Not Started

**Location:** To create in `components/dashboard/tutor/`

**Tasks:**
- [ ] View all appointments (upcoming/past)
- [ ] Filter by status (scheduled/cancelled/completed)
- [ ] View appointment details (student info, course, time)
- [ ] Cancel appointment (with reason, triggers refund/credit)
- [ ] Add meeting link to appointment (Zoom, Teams, Google Meet)
- [ ] Download ICS file per appointment
- [ ] Trigger Make.com webhook on tutor actions

**Models Needed:**
- [ ] `MeetingLink` (appointmentId, platform, url, password)

**Server Actions Needed:**
- `lib/actions/tutor.ts`:
  - `cancelAppointment(appointmentId, reason)` (tutor-initiated)
  - `addMeetingLink(appointmentId, platform, url, password)`
  - `updateMeetingLink()`
  - `deleteMeetingLink()`

**Acceptance Criteria:**
- Tutors can cancel with valid reason
- Cancellation creates credit for student
- Meeting links stored and shared with student
- Make.com webhook sent on cancellation
- All actions logged in modification history

---

### **3.4 Tutor Messaging System**
**Status:** 🔲 Not Started

**Location:** To create in `components/messaging/tutor-messaging-tab.tsx`

**Tasks:**
- [ ] Create messaging tab in tutor dashboard
- [ ] View conversations with students
- [ ] Reply to messages
- [ ] Send new message to student (for their appointments)
- [ ] File attachments support
- [ ] Message read receipts
- [ ] Trigger Make.com webhook on tutor message

**Note:** Reuse existing `Message` model and components from student side.

**Acceptance Criteria:**
- Tutors can message students
- Conversation view shows full history
- File uploads work
- Make.com webhook sent

---

### **3.5 Tutor Earnings Dashboard**
**Status:** 🔲 Not Started

**Location:** To create in `components/dashboard/tutor/earnings-dashboard.tsx`

**Tasks:**
- [ ] Monthly hours worked (from completed appointments)
- [ ] Monthly earnings calculation (hours × rate)
- [ ] Current month vs completed payments
- [ ] Earnings history (past months)
- [ ] Payment status per month (pending/paid by admin)
- [ ] Export earnings to CSV
- [ ] Tax year summary

**Models Needed:**
- [ ] `TutorPayment` (tutorId, month, year, totalHours, totalEarnings, status, paidAt, confirmationNumber)

**Server Actions Needed:**
- `lib/actions/tutor.ts`:
  - `getTutorEarnings(tutorId, year, month)`
  - `getEarningsHistory(tutorId)`

**Acceptance Criteria:**
- Earnings calculated from completed appointments
- Payment status tracked (admin marks as paid)
- Export functionality works
- Historical data accessible

---

### **3.6 Tutor Course Management**
**Status:** 🔲 Not Started

**Location:** To create in `components/dashboard/tutor/course-management.tsx`

**Tasks:**
- [ ] View assigned courses
- [ ] Request new course assignment (admin approval)
- [ ] View course performance metrics:
  - Total sessions taught
  - Average session rating (if ratings implemented)
  - Total earnings per course
- [ ] Course status (active/inactive)

**Models Needed:**
- [ ] Add `status` field to `TutorCourse` (pending/approved/inactive)
- [ ] Add request tracking

**Server Actions Needed:**
- `lib/actions/tutor.ts`:
  - `requestCourseAssignment(tutorId, courseId)`
  - `getTutorCourseMetrics(tutorId, courseId)`

**Acceptance Criteria:**
- Tutors can request course assignments
- Admin can approve/reject requests
- Metrics calculate correctly
- Performance data displayed

---

## **PHASE 4: Admin Dashboard Features**

### **4.1 Enhanced Overview**
**Status:** 🚧 Partially Implemented (mock data)

**Location:** `components/dashboard/admin-dashboard.tsx`

**Tasks:**
- [ ] **Replace mock data with real queries:**
  - [ ] Total active courses
  - [ ] Total active tutors
  - [ ] Total active students
  - [ ] This month vs last month revenue
  - [ ] Unanswered support tickets (if implemented)
  - [ ] Recent orders (real data)
  - [ ] Recent appointments (real data)
- [ ] Revenue comparison chart
- [ ] Quick action buttons (create course, tutor, etc.)
- [ ] System health indicators

**Acceptance Criteria:**
- All stats pull from real database
- Revenue comparison accurate
- Charts display correctly
- Quick actions work

---

### **4.2 Course Management (Full CRUD with Dual Rate System)**
**Status:** 🔲 Not Started (HIGH PRIORITY)

**Location:** To create in `components/admin/course-management.tsx`

**Tasks:**
- [ ] List all courses (active/inactive)
- [ ] Create course form:
  - Title (FR)
  - Slug (auto-generated or manual)
  - Description (FR)
  - **Student Rate (CAD)** - What students pay per hour
  - Active status
- [ ] Edit course (including student rate)
- [ ] Delete course (with confirmation)
- [ ] Assign tutors to course
- [ ] Unassign tutors from course
- [ ] View course analytics:
  - Total bookings
  - Total student revenue (what students paid)
  - Total tutor costs (what tutors earned)
  - **Revenue margin** (student revenue - tutor costs)
  - Active students
  - Assigned tutors

**Server Actions Needed:**
- `lib/actions/admin.ts`:
  - `createCourse(data)` (includes studentRateCad)
  - `updateCourse(id, data)` (can update studentRateCad)
  - `deleteCourse(id)` (soft delete if has appointments)
  - `assignTutorToCourse(tutorId, courseId)`
  - `unassignTutorFromCourse(tutorId, courseId)`
  - `getCourseAnalytics(courseId)` (includes margin calculations)

**Acceptance Criteria:**
- Admins can create/edit/delete courses
- Student rate field required (default $45.00)
- Tutor assignments work
- Analytics calculate correctly with dual rates
- Revenue margin displayed
- Slug validation prevents duplicates
- Soft delete if course has historical data

---

### **4.3 Tutor Management (Enhanced with Dual Rate System)**
**Status:** ✅ Completed (basic CRUD exists)

**Location:** `components/admin/tutor-management.tsx`

**Remaining Tasks:**
- [ ] **Edit tutor hourly rate** (what tutors earn, not student rate)
- [ ] **Display tutor rate vs course rates** (show margin potential)
- [ ] View tutor ratings (if rating system implemented)
- [ ] View tutor earnings (calculated from tutor rate)
- [ ] Edit payment status (mark as paid)
- [ ] Add payment confirmation number
- [ ] View availability utilization (% of available slots booked)
- [ ] Performance analytics
- [ ] **Revenue margin analysis** (total collected from students - total paid to tutor)

**Models Needed:**
- [ ] Enhance `TutorPayment` with admin edit capability

**Server Actions Needed:**
- `lib/actions/admin.ts`:
  - `updateTutorRate(tutorId, newRate)` (update hourlyBaseRateCad)
  - `getTutorEarningsSummary(tutorId)` (uses tutor rate)
  - `getTutorRevenueMargin(tutorId)` (student payments - tutor earnings)
  - `markTutorPaymentPaid(tutorId, month, year, confirmationNumber)`
  - `getTutorPerformance(tutorId)`
  - `getTutorAvailabilityUtilization(tutorId)`

**Acceptance Criteria:**
- Admin can edit tutor hourly rate separately from course rates
- Tutor earnings calculated from tutor rate
- Revenue margin visible (shows profitability per tutor)
- Admin can mark payments as paid
- Payment confirmation tracked
- Performance metrics accurate
- Utilization calculates correctly

---

### **4.4 Student Management**
**Status:** 🚧 Partially Implemented

**Location:** `components/admin/student-management.tsx`

**Tasks:**
- [ ] List all students with search/filter
- [ ] View student details:
  - Total appointments
  - Total spent
  - Credit balance
  - Recent activity
- [ ] Manage account status (active/suspended)
- [ ] View student support tickets (if implemented)
- [ ] Manual credit adjustments
- [ ] View student's appointment history
- [ ] Communication tools (view messages)

**Server Actions Needed:**
- `lib/actions/admin.ts`:
  - `getStudentDetails(studentId)`
  - `updateStudentStatus(studentId, status)`
  - `adjustStudentCredit(studentId, amount, reason)`
  - `getStudentActivity(studentId)`

**Acceptance Criteria:**
- All students listed with key metrics
- Account suspension prevents booking
- Credit adjustments logged
- Activity history accurate

---

### **4.5 Coupon Management (Full CRUD)**
**Status:** 🔲 Not Started

**Location:** To create in `components/admin/coupon-management.tsx`

**Tasks:**
- [ ] List all coupons (active/expired)
- [ ] Create coupon form:
  - Code (unique, uppercase)
  - Type (percent/fixed)
  - Value
  - Start/end dates (optional)
  - Max redemptions (optional)
  - Active status
- [ ] Edit coupon
- [ ] Delete coupon (soft delete if used)
- [ ] Toggle active status
- [ ] View coupon usage:
  - Redemption count
  - Total discount given
  - Recent orders using coupon
- [ ] Coupon performance analytics

**Server Actions Needed:**
- `lib/actions/admin.ts`:
  - `createCoupon(data)`
  - `updateCoupon(id, data)`
  - `deleteCoupon(id)` (soft delete)
  - `toggleCouponStatus(id)`
  - `getCouponUsage(id)`

**Acceptance Criteria:**
- Admins can create/edit coupons
- Validation prevents duplicate codes
- Usage tracking accurate
- Expired coupons automatically inactive
- Analytics show ROI

---

### **4.6 Appointment Management**
**Status:** 🔲 Not Started

**Location:** To create in `components/admin/appointment-management.tsx`

**Tasks:**
- [ ] List all appointments with filters:
  - Status (scheduled/cancelled/completed)
  - Date range
  - Tutor
  - Student
  - Course
- [ ] View appointment details
- [ ] Manual appointment creation (bypass payment)
- [ ] Cancel appointment (with refund option)
- [ ] Change appointment status
- [ ] View modification history
- [ ] Resolve conflicts
- [ ] Bulk operations (cancel multiple, export)

**Server Actions Needed:**
- `lib/actions/admin.ts`:
  - `createManualAppointment(data)` (no payment required)
  - `cancelAppointmentAdmin(id, refund, reason)`
  - `updateAppointmentStatus(id, status)`
  - `getAppointmentHistory(id)`
  - `resolveConflict(id, action)`

**Acceptance Criteria:**
- Admin can create free appointments
- Cancellations handle refunds properly
- Status changes logged
- Bulk operations work
- Conflict resolution tools available

---

### **4.7 Order Management & Refunds**
**Status:** 🔲 Not Started

**Location:** To create in `components/admin/order-management.tsx`

**Tasks:**
- [ ] List all orders with filters (status, date, amount)
- [ ] View order details:
  - Order items
  - Payment info
  - Stripe payment link
  - Associated appointments
- [ ] Process refund (full/partial)
- [ ] Cancel order (cancel all appointments)
- [ ] View refund history
- [ ] Stripe refund sync
- [ ] Order analytics

**Models Needed:**
- [ ] `Refund` (orderId, amount, reason, status, stripeRefundId, processedBy, processedAt)

**Server Actions Needed:**
- `lib/actions/admin.ts`:
  - `refundOrder(orderId, amount, reason, cancelAppointments)`
  - `getOrderDetails(orderId)`
  - `getRefundHistory()`

**Acceptance Criteria:**
- Refunds process through Stripe
- Appointments cancelled if specified
- Refund tracking complete
- Stripe sync accurate

---

### **4.8 Revenue Analytics Dashboard (Dual Rate System)**
**Status:** 🔲 Not Started

**Location:** To create in `components/admin/revenue-analytics.tsx`

**Tasks:**
- [ ] Yearly revenue chart
- [ ] Monthly revenue breakdown
- [ ] Revenue by course (cumulative)
- [ ] Revenue by tutor (cumulative)
- [ ] **Student payments total** (gross revenue from students)
- [ ] **Tutor earnings total** (costs paid to tutors)
- [ ] **Gross margin** (student payments - tutor earnings)
- [ ] **Margin percentage** ((gross margin / student payments) × 100)
- [ ] Refunds tracking
- [ ] Tutor payments tracking
- [ ] Net revenue calculation (gross margin - refunds - other costs)
- [ ] Revenue trends and forecasting
- [ ] Export to CSV/Excel

**Server Actions Needed:**
- `lib/actions/admin.ts`:
  - `getYearlyRevenue(year)` (returns student revenue, tutor costs, margin)
  - `getMonthlyRevenue(year, month)` (returns detailed breakdown)
  - `getRevenueByCourse()` (includes margin per course)
  - `getRevenueByTutor()` (includes margin per tutor)
  - `getGrossMarginAnalysis()` (overall profitability metrics)
  - `getRefundsSummary()`
  - `getTutorPaymentsSummary()`

**Acceptance Criteria:**
- All calculations accurate (dual rate system)
- Margin calculations correct
- Charts display trends (revenue vs costs vs margin)
- Export functionality works
- Filters apply correctly
- Profitability metrics visible

---

### **4.9 Recurring Sessions Management**
**Status:** ✅ Completed

**Location:** `components/admin/recurring-sessions-management.tsx`

**Features:**
- [x] View all recurring sessions
- [x] Filter by status (active/completed/cancelled)
- [x] View session details and progress
- [x] Cancel recurring series
- [x] Adjust recurring session (future feature)

**Acceptance Criteria:**
- Admin can view all recurring bookings
- Session progress tracked
- Cancellation works properly

---

## **PHASE 5: Cross-Cutting Features**

### **5.1 Meeting Links System**
**Status:** 🔲 Not Started

**Database Schema:**
```prisma
model MeetingLink {
  id            String   @id @default(uuid())
  appointmentId String   @unique @map("appointment_id")
  platform      String   // "zoom", "teams", "google_meet", "other"
  url           String
  password      String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  appointment Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)

  @@map("meeting_links")
}
```

**Tasks:**
- [ ] Add `MeetingLink` model to schema
- [ ] Migration to create table
- [ ] Tutor can add/edit meeting link
- [ ] Student can view meeting link (in appointment details)
- [ ] Platform icons and validation
- [ ] Copy link button

**Acceptance Criteria:**
- Tutors add meeting links easily
- Students see link 15 minutes before appointment
- Platform-specific validation

---

### **5.2 Rating & Review System**
**Status:** 🔲 Not Started (V1 Scope)

**Database Schema:**
```prisma
model TutorRating {
  id            String   @id @default(uuid())
  appointmentId String   @unique @map("appointment_id")
  tutorId       String   @map("tutor_id")
  studentId     String   @map("student_id")
  rating        Int      // 1-5 stars
  comment       String?  @db.Text
  createdAt     DateTime @default(now()) @map("created_at")

  appointment Appointment @relation(fields: [appointmentId], references: [id])
  tutor       Tutor       @relation(fields: [tutorId], references: [id])
  student     User        @relation(fields: [studentId], references: [id])

  @@index([tutorId])
  @@map("tutor_ratings")
}
```

**Tasks:**
- [ ] Add rating model
- [ ] Post-appointment rating request (email or in-app)
- [ ] Student submits rating after completed appointment
- [ ] Tutor views ratings in dashboard
- [ ] Admin views and moderates ratings
- [ ] Calculate average rating per tutor
- [ ] Display rating on tutor profile page

**Acceptance Criteria:**
- Students can rate completed appointments
- Ratings appear in tutor profile
- Average rating calculates correctly
- Admin can moderate inappropriate reviews

---

### **5.3 Support Ticket System**
**Status:** 🔲 Not Started (V1 Scope)

**Database Schema:**
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

model SupportTicket {
  id          String         @id @default(uuid())
  userId      String         @map("user_id")
  subject     String
  description String         @db.Text
  category    String         // "booking", "payment", "technical", "other"
  priority    TicketPriority @default(medium)
  status      TicketStatus   @default(open)
  assignedTo  String?        @map("assigned_to")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  resolvedAt  DateTime?      @map("resolved_at")

  user        User             @relation(fields: [userId], references: [id])
  assignee    User?            @relation("AssignedTickets", fields: [assignedTo], references: [id])
  attachments TicketAttachment[]
  messages    TicketMessage[]

  @@index([userId, status])
  @@index([assignedTo, status])
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
  
  @@map("ticket_attachments")
}

model TicketMessage {
  id        String   @id @default(uuid())
  ticketId  String   @map("ticket_id")
  userId    String   @map("user_id")
  message   String   @db.Text
  isInternal Boolean @default(false) @map("is_internal") // Admin notes
  createdAt DateTime @default(now()) @map("created_at")

  ticket SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  user   User          @relation(fields: [userId], references: [id])

  @@map("ticket_messages")
}
```

**Tasks:**
- [ ] Add support ticket models
- [ ] Student: Submit support ticket
- [ ] Student: View ticket history and status
- [ ] Admin: View all tickets
- [ ] Admin: Assign tickets
- [ ] Admin: Respond to tickets
- [ ] Admin: Change ticket status/priority
- [ ] Email notifications on ticket updates
- [ ] Make.com webhook on new ticket

**Acceptance Criteria:**
- Students can submit and track tickets
- Admins can manage and respond
- Status tracking works
- Email notifications sent
- Priority system functional

---

### **5.4 Notification System**
**Status:** 🔲 Not Started (V2 - simplified for V1)

**V1 Approach:**
- Make.com webhooks handle all notifications (email/SMS off-platform)
- No in-app notification center

**V2 Features (Deferred):**
- In-app notification bell
- Real-time notifications
- Notification preferences
- Push notifications

---

## **PHASE 6: UI/UX Enhancement with TweakCN**

### **6.1 TweakCN Component Library Integration**
**Status:** 🔲 Not Started (After Core Functionality)

**Reference:** [TweakCN - Enhanced shadcn/ui Components](https://tweakcn.com/)

**Description:**
Redesign and enhance the visual appearance of key pages using [TweakCN](https://tweakcn.com/), which provides enhanced shadcn/ui components with better styling, animations, and UX patterns.

**Pages to Redesign:**

1. **Homepage (`app/page.tsx`)**
   - Hero section with modern gradient backgrounds
   - Feature highlights with icon cards
   - CTA buttons with enhanced styling
   - Testimonials section
   - Course showcase with hover effects

2. **Course Listing Page (`app/cours/page.tsx`)**
   - Enhanced card layouts for courses
   - Better filtering UI with animated transitions
   - Search with autocomplete styling
   - Course category badges
   - Loading skeletons

3. **Course Detail & Reservation (`app/cours/[slug]/page.tsx`)**
   - Modern calendar component from TweakCN
   - Enhanced slot selection UI
   - Better tutor profile display
   - Sticky booking summary
   - Animated slot availability indicators

4. **Cart Page (`app/panier/page.tsx`)**
   - Enhanced shopping cart UI
   - Animated item additions/removals
   - Coupon input with validation feedback
   - Order summary with visual hierarchy
   - Empty cart state with illustration

5. **Checkout Page (`app/checkout/page.tsx`)**
   - Multi-step form with progress indicator
   - Enhanced payment form styling
   - Better error messaging
   - Success/loading animations
   - Security badges and trust indicators

6. **Student Dashboard (`components/dashboard/student-dashboard.tsx`)**
   - Modern stats cards with gradients
   - Enhanced appointment cards
   - Better tab navigation
   - Improved data visualization
   - Quick action buttons with icons

7. **Tutor Dashboard (`components/dashboard/tutor-dashboard.tsx`)**
   - Professional earnings display
   - Enhanced calendar views
   - Better availability management UI
   - Modern stats visualization
   - Improved messaging interface

8. **Admin Dashboard (`components/dashboard/admin-dashboard.tsx`)**
   - Enhanced data tables with sorting/filtering
   - Modern chart components
   - Better form layouts for CRUD operations
   - Improved navigation and organization
   - Advanced filtering UI

**Implementation Strategy:**

1. **Phase 6.1.1: Component Audit & Planning (2-3 hours)**
   - [ ] Review all current pages
   - [ ] Identify TweakCN components to use
   - [ ] Create component mapping (old → new)
   - [ ] Plan color scheme and theme updates
   - [ ] Create design system documentation

2. **Phase 6.1.2: Install & Configure TweakCN (1-2 hours)**
   - [ ] Install TweakCN components
   - [ ] Configure Tailwind with TweakCN theme
   - [ ] Set up color palette (brand colors)
   - [ ] Configure typography scale
   - [ ] Test component library

3. **Phase 6.1.3: Public Pages Redesign (8-12 hours)**
   - [ ] Homepage redesign
   - [ ] Course listing page
   - [ ] Course detail & reservation page
   - [ ] Ensure mobile responsiveness
   - [ ] Add loading states and transitions

4. **Phase 6.1.4: Booking Flow Redesign (6-8 hours)**
   - [ ] Cart page enhancement
   - [ ] Checkout flow improvement
   - [ ] Success/error pages
   - [ ] Payment form styling
   - [ ] Add micro-interactions

5. **Phase 6.1.5: Dashboard Redesign (12-16 hours)**
   - [ ] Student dashboard enhancement
   - [ ] Tutor dashboard enhancement
   - [ ] Admin dashboard enhancement
   - [ ] Consistent component usage
   - [ ] Improved data visualization

6. **Phase 6.1.6: Polish & Refinement (4-6 hours)**
   - [ ] Consistent spacing and typography
   - [ ] Dark mode testing and fixes
   - [ ] Accessibility improvements
   - [ ] Animation performance optimization
   - [ ] Cross-browser testing

**TweakCN Components to Use:**

Based on [TweakCN](https://tweakcn.com/), consider these enhanced components:

- **Navigation:** Enhanced navbar with dropdowns, mega menus
- **Cards:** Gradient cards, hover effects, glass morphism
- **Buttons:** Animated buttons, loading states, icon buttons
- **Forms:** Enhanced input fields, validation states, multi-step forms
- **Tables:** Advanced data tables with sorting, filtering, pagination
- **Charts:** Beautiful chart components for analytics
- **Modals:** Enhanced dialog components with animations
- **Calendars:** Modern calendar/date picker components
- **Badges:** Status badges, notification badges
- **Tooltips:** Enhanced tooltips and popovers
- **Loading:** Skeleton loaders, progress indicators
- **Empty States:** Illustration-based empty states

**Deliverables:**
- [ ] `tailwind.config.ts` updated with TweakCN theme
- [ ] `app/globals.css` with TweakCN custom styles
- [ ] All pages redesigned with enhanced components
- [ ] Design system documentation
- [ ] Component usage guide
- [ ] Before/after screenshots

**Acceptance Criteria:**
- All pages use TweakCN enhanced components
- Consistent design language across app
- Mobile responsive (all breakpoints)
- Dark mode fully functional
- Animations smooth (60fps)
- Accessibility maintained (WCAG 2.1 AA)
- Loading states for all async operations
- Better visual hierarchy and UX
- French labels maintained throughout

**Estimated Time:** 35-50 hours total

---

## **PHASE 7: Performance & Security**

### **7.1 Database Optimization**
**Status:** 🔲 Not Started

**Tasks:**
- [ ] Add all recommended indexes
- [ ] Implement database connection pooling
- [ ] Query optimization (use `select` to limit fields)
- [ ] Implement caching for frequently accessed data:
  - Course list
  - Tutor profiles
  - Availability rules
- [ ] Use Prisma query batching
- [ ] Monitor slow queries

**Acceptance Criteria:**
- Page load times < 2s
- API responses < 500ms
- Database connections efficient
- No N+1 query issues

---

### **6.2 Security Hardening**
**Status:** 🚧 In Progress

**Tasks:**
- [ ] Complete RLS policy audit
- [ ] Implement rate limiting on API routes
- [ ] Add CSRF protection
- [ ] Input sanitization for all forms
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention
- [ ] Secure file upload validation
- [ ] Webhook signature verification (Stripe)
- [ ] Environment variable validation on startup

**Acceptance Criteria:**
- All RLS policies tested per role
- Rate limiting prevents abuse
- File uploads validated (size, type)
- No security vulnerabilities

---

### **6.3 Error Handling & Logging**
**Status:** 🔲 Not Started

**Tasks:**
- [ ] Centralized error logging (Sentry or similar)
- [ ] Friendly error pages (500, 404, etc.)
- [ ] User-friendly error messages (French)
- [ ] Admin error notification system
- [ ] Webhook failure alerts
- [ ] Database error recovery

**Acceptance Criteria:**
- Errors logged systematically
- Users see helpful error messages
- Admins notified of critical errors
- No sensitive data in error messages

---

## **PHASE 7: Testing & Quality Assurance**

### **7.1 Unit Tests**
**Status:** 🔲 Not Started

**Test Coverage:**
- [ ] Slot generation engine
- [ ] Pricing calculator
- [ ] Coupon validation
- [ ] Hold expiration logic
- [ ] Date/time utilities
- [ ] Availability conflict detection

**Tools:** Jest, React Testing Library

---

### **7.2 Integration Tests**
**Status:** 🔲 Not Started

**Test Scenarios:**
- [ ] End-to-end booking flow (guest user)
- [ ] End-to-end booking flow (logged-in user)
- [ ] Cart operations
- [ ] Checkout process
- [ ] Webhook handling
- [ ] Cancellation/refund flow
- [ ] Recurring session creation

**Tools:** Playwright or Cypress

---

### **7.3 Manual Testing Checklist**
**Status:** 🔲 Not Started

**User Flows:**
- [ ] Guest booking → account creation → payment
- [ ] Logged-in booking → save card → payment
- [ ] Apply coupon → verify discount
- [ ] Cancel appointment → verify credit
- [ ] Reschedule appointment
- [ ] Tutor set availability → student sees changes
- [ ] Admin create course → assign tutor → student books
- [ ] Message between student and tutor
- [ ] File upload and download
- [ ] Recurring session booking
- [ ] Meeting link sharing

---

## **PHASE 8: Deployment & Documentation**

### **8.1 Netlify Deployment**
**Status:** 🔲 Not Started

**Tasks:**
- [ ] Configure `netlify.toml`
- [ ] Set up environment variables
- [ ] Configure Netlify Functions:
  - Stripe webhook endpoint
  - Scheduled hold cleanup (every minute)
- [ ] Configure redirects and headers
- [ ] Test build process
- [ ] Set up preview deployments
- [ ] Configure custom domain

---

### **8.2 Scheduled Functions**
**Status:** 🔲 Not Started

**Location:** `netlify/functions/`

**Functions Needed:**
- [ ] `cleanup-expired-holds.ts` (runs every minute)
- [ ] `appointment-reminders.ts` (runs daily, sends reminders 24h before)
- [ ] `complete-past-appointments.ts` (runs daily, marks past appointments as completed)

---

### **8.3 Documentation**
**Status:** 🔲 Not Started

**Deliverables:**
- [ ] README.md (setup instructions)
- [ ] DEPLOYMENT.md (Netlify deployment guide)
- [ ] API.md (API routes documentation)
- [ ] WEBHOOKS.md (Make.com webhook payloads)
- [ ] DATABASE.md (schema documentation)
- [ ] TESTING.md (testing guide)

---

## **Cross-Cutting Concerns & Consistency Rules**

### **Booking Flow Consistency**
When implementing ANY booking-related feature, ALWAYS:
1. Check for slot availability conflicts (appointments + holds)
2. Validate lead time (12h min, 60 days max)
3. Respect tutor availability (rules + exceptions + time off)
4. Use 15-minute holds during checkout
5. Clean up expired holds inline
6. Validate duration is 60, 90, or 120
7. **Calculate price using course's `studentRateCad` (what students pay)**
8. **Track tutor earnings separately using tutor's `hourlyBaseRateCad`**
9. Update both cart and holds atomically
10. Trigger Make.com webhooks on success

### **Payment Flow Consistency**
When implementing ANY payment-related feature, ALWAYS:
1. Use Stripe Payment Intents (not Checkout Sessions)
2. Collect billing address
3. Support guest users (create account on payment)
4. Support logged-in users (save card option)
5. Handle webhook idempotently (check `stripePaymentIntentId`)
6. Use atomic transactions (order + appointments)
7. **Calculate order totals using course `studentRateCad`** (student-facing rate)
8. **Store tutor earnings calculation** for future payout tracking
9. Release holds on payment failure
10. Trigger Make.com booking webhook on success
11. Log all webhook events to database

### **Cancellation/Refund Consistency**
When implementing ANY cancellation feature, ALWAYS:
1. Check 2-hour cutoff for cancellations
2. Issue credits by default (admin can manually refund)
3. Record cancellation reason
4. Log modification in `AppointmentModification`
5. Trigger Make.com webhook
6. Update recurring session counters if applicable
7. Release slot hold/appointment to make available
8. Notify all parties (student, tutor, admin)

### **Messaging Consistency**
When implementing messaging features, ALWAYS:
1. Support file attachments
2. Store files in Supabase Storage
3. Validate file size (max 10MB) and type
4. Track read status
5. Trigger Make.com webhook on send
6. Allow only student ↔ tutor communication (not student ↔ student)
7. Link messages to appointments when relevant

### **Dashboard Consistency**
When implementing ANY dashboard feature, ALWAYS:
1. Use tab-based navigation
2. Show loading states during data fetching
3. Handle empty states gracefully
4. Use French labels throughout
5. Format dates using `formatDate()`, `formatDateTime()`
6. Format currency using `formatCurrency()`
7. **Show appropriate rates based on user role:**
   - Students: See course `studentRateCad` (what they pay)
   - Tutors: See their `hourlyBaseRateCad` (what they earn)
   - Admins: See both rates and margin
8. Show success/error toasts for actions
9. Revalidate data after mutations
10. Use shadcn/ui (enhanced with TweakCN) components for consistency

### **Form Validation Consistency**
When implementing ANY form, ALWAYS:
1. Use react-hook-form + zod
2. Show inline error messages
3. Disable submit during loading
4. Show loading spinner on submit button
5. Clear errors on successful submit
6. French error messages
7. Validate on blur and submit
8. Use server-side validation in Server Actions

---

## **V1 Scope Summary (Must-Have for Launch)**

### **Core Features:**
- 🚧 Database schema with constraints, RLS, and **dual rate system**
- ✅ Slot generation engine
- ⚠️ Cart-based booking flow (needs refactoring + dual rate pricing)
- 🚧 Stripe Payment Intent checkout (use course rates)
- 🚧 Stripe webhook handler (track both rates)
- 🔲 Make.com webhooks (all events)

### **Student Dashboard:**
- ✅ Profile management
- ✅ Reservation management (cancel/reschedule)
- ✅ Messaging
- ✅ Payment methods
- ⚠️ Recurring sessions (needs fixing)
- 🔲 Support tickets

### **Tutor Dashboard:**
- ✅ Overview/stats
- 🔲 Availability CRUD (HIGH PRIORITY)
- 🔲 Appointment management
- 🔲 Messaging tab
- 🔲 Earnings dashboard
- 🔲 Course management
- 🔲 Meeting links

### **Admin Dashboard:**
- 🔲 Course CRUD with **student rate management** (HIGH PRIORITY)
- ✅ Tutor management (basic)
- 🔲 Enhanced tutor management (**tutor rate editing, margin analysis, payments**)
- 🔲 Student management
- 🔲 Coupon CRUD
- 🔲 Appointment management
- 🔲 Order/refund management
- 🔲 Revenue analytics (**with margin tracking: student revenue - tutor costs**)
- ✅ Recurring sessions view

### **UI/UX Enhancement:**
- 🔲 TweakCN component library integration (Phase 6)
- 🔲 Homepage redesign
- 🔲 Course pages redesign
- 🔲 Booking flow enhancement
- 🔲 Dashboard modernization
- 🔲 Design system documentation

### **Additional V1 Features:**
- 🔲 Meeting links
- 🔲 Rating system
- 🔲 Support tickets

---

## **V2 Scope (Deferred Features)**

### **External Integrations:**
- Google Calendar sync for tutors
- Microsoft Calendar sync for tutors
- Automatic calendar event creation

### **Advanced Analytics:**
- Revenue forecasting
- Student retention metrics
- Tutor performance scoring
- Course popularity trends

### **Enhanced User Experience:**
- In-app notifications
- Real-time messaging (WebSocket)
- Push notifications
- Mobile app

### **Advanced Features:**
- Multi-language support (English)
- Multi-currency support
- Tax calculation
- Subscription plans
- Group sessions
- Waiting list system

---

## **Implementation Order (Recommended)**

Based on technical dependencies and user value:

1. **PHASE 0:** Cleanup & Foundation + **Dual Rate System** (CURRENT)
   - Database schema hardening
   - Add `studentRateCad` to Course model
   - Update pricing calculations
   - RLS policy consolidation
2. **Cart + Payment Flow Fix** (High priority, blocks everything)
   - Fix to use course rates for students
3. **Tutor Availability CRUD** (Blocks student booking)
4. **Admin Course CRUD** (Needed for testing, includes rate management)
5. **Make.com Webhooks** (Communications dependency)
6. **Recurring Sessions Fix** (Currently broken)
7. **Tutor Messaging** (Complete messaging feature)
8. **Meeting Links** (High user value)
9. **Support Tickets** (User support)
10. **Rating System** (Trust building)
11. **Admin Features** (Coupons, Orders, Revenue Analytics with margin tracking)
12. **PHASE 6: UI/UX Enhancement with TweakCN** (After core functionality)
    - Homepage, course pages, booking flow
    - Cart, checkout, dashboards
    - 35-50 hours estimated
13. **Testing & QA**
14. **Deployment**

---

## **Success Criteria for V1 Launch**

### **Functional Requirements:**
- [ ] Student can browse courses and book appointments
- [ ] Student can use cart to book multiple slots
- [ ] Guest can book and create account
- [ ] Payment processing works (save cards)
- [ ] Appointments appear in dashboards
- [ ] Student can cancel/reschedule with credits
- [ ] Student can message tutor
- [ ] Tutor can set availability
- [ ] Tutor can manage appointments
- [ ] Tutor can message students
- [ ] Admin can manage courses, tutors, students
- [ ] Admin can process refunds
- [ ] Make.com webhooks fire correctly
- [ ] Recurring sessions work end-to-end

### **Performance Requirements:**
- [ ] Page load < 2s
- [ ] API response < 500ms
- [ ] No double-booking possible
- [ ] Holds prevent conflicts

### **Security Requirements:**
- [ ] RLS policies enforced
- [ ] Payment data secure (PCI compliant via Stripe)
- [ ] File uploads validated
- [ ] XSS/CSRF protection
- [ ] Rate limiting on public endpoints

### **Quality Requirements:**
- [ ] All French labels
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Error handling graceful
- [ ] Loading states clear

---

## **Maintenance & Monitoring (Post-Launch)**

### **Daily:**
- Monitor webhook delivery
- Check payment failures
- Review error logs

### **Weekly:**
- Review support tickets
- Analyze booking patterns
- Check system performance

### **Monthly:**
- Review revenue reports
- Analyze user feedback
- Plan feature improvements

---

**Last Updated:** January 2025  
**Document Owner:** Development Team  
**Next Review:** Before each implementation phase

