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

## **🚀 QUICK START GUIDE - Phase 0 Execution Plan**

### **📋 What We're Doing**
Consolidating planning documents ✅, cleaning up the codebase, implementing dual rate system, and fixing broken features before adding new functionality.

### **🎯 Key Decisions Made**

| Topic | Decision |
|-------|----------|
| **Payment Flow** | Payment Intents ONLY (remove Checkout Sessions) |
| **Booking Flow** | Cart-based ONLY (remove direct booking) |
| **Guest Checkout** | Keep it (create account on payment) |
| **Pricing Model** | **Dual Rate System** (tutor rate vs student rate) |
| **Hold Cleanup** | Inline (not scheduled function for now) |
| **Hold Duration** | Always 15 min from creation (no extension) |
| **Cancellation** | Credits by default (admin manual refunds) |
| **Reschedule Window** | 24 hours (different from 2h cancellation) |
| **Make.com Webhooks** | All student/tutor events + retry logic |
| **Database Constraints** | Add all recommended constraints |
| **RLS Policies** | Consolidate into single file |
| **UI Components** | shadcn/ui + TweakCN (Phase 6, after core works) |

### **🚨 Critical Issues to Fix**

| Issue | Impact | Priority | Est. Time |
|-------|--------|----------|-----------|
| ~~**Recurring Sessions Breaking Cart**~~ | ~~High~~ | ~~Fix immediately~~ | ~~4-6 hours~~ |
| **Duplicate Checkout Flows** | High | Before new features | 6-8 hours |
| **Scattered RLS Policies** | Medium | Phase 0 | 2-3 hours |
| **Test/Debug Code in Production** | Low | Phase 0 | 1 hour |

**Note:** Recurring sessions removed as separate feature - users can now select multiple sessions in cart for same effect.

---

### **✅ PHASE 0 EXECUTION CHECKLIST**

#### **Step 1: Backup Current State** (5 min)
```bash
git add .
git commit -m "Pre-cleanup checkpoint"
git push
```

#### **Step 2: Run RLS Diagnostic** (15 min)
1. Copy contents of `prisma/check-rls-policies.sql`
2. Run in Supabase SQL Editor
3. Save output for review: `prisma/rls-policies.md`
4. Identify conflicting policies

#### **Step 3: Check Data for Constraint Violations** (15 min)
```sql
-- Run in Supabase SQL Editor:

-- Check invalid durations
SELECT 'cart_items' as table_name, COUNT(*) as violations 
FROM cart_items WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'order_items', COUNT(*) 
FROM order_items WHERE duration_min NOT IN (60, 90, 120)
UNION ALL
SELECT 'slot_holds', COUNT(*) 
FROM slot_holds WHERE duration_min NOT IN (60, 90, 120);

-- Check negative prices
SELECT 'tutors' as table_name, COUNT(*) as violations
FROM tutors WHERE hourly_base_rate_cad <= 0
UNION ALL
SELECT 'orders', COUNT(*)
FROM orders WHERE total_cad < 0;

-- Check weekday range
SELECT 'availability_rules', COUNT(*)
FROM availability_rules WHERE weekday NOT BETWEEN 0 AND 6;
```

#### **Step 4: Implement Dual Rate System** (2-3 hours)
```bash
# 1. Update Prisma schema
# Add studentRateCad to Course model (see Phase 0.2 below)

# 2. Generate migration
npm run prisma:generate

# 3. Push to database
npm run prisma:push

# 4. Update pricing calculator (lib/pricing.ts)
# - Add calculateStudentPrice() function
# - Add calculateTutorEarnings() function
# - Add calculateMargin() function
```

#### **Step 5: Delete Test/Debug Code** (30 min)
```bash
# Delete test routes
rm -rf app/api/test
rm -rf app/api/debug-appointments
rm -rf app/api/debug-appointment-tutor
rm -rf app/api/debug-payment
rm -rf app/api/debug-tutor-data
rm -rf app/api/debug-webhooks
rm -rf app/api/test-appointment
rm -rf app/api/test-tutor-relationship

# Delete direct booking action
rm lib/actions/booking.ts

# Verify deletion
git status
```

#### **Step 6: Apply Database Constraints** (1 hour)
1. Fix any data violations found in Step 3
2. Review `prisma/add-constraints.sql`
3. Run in Supabase SQL Editor
4. Test with sample queries

#### **Step 7: Apply Clean RLS Policies** (1-2 hours)
1. Backup existing policies (from Step 2 output)
2. Review `prisma/rls-policies-v1-clean.sql`
3. Generate DROP statements for old policies
4. Run clean policy file
5. Test with different user roles

#### **Step 8: Commit Cleanup** (5 min)
```bash
git add .
git commit -m "Phase 0: Cleanup, dual rate system, constraints, and RLS policies"
git push
```

---

### **🔧 PHASE 0.5: CRITICAL FIXES (Before Phase 1)**

These are broken features that need immediate fixing before we can proceed with new development:

#### ~~**Fix 1: Recurring Sessions Integration**~~ (REMOVED)
**Status:** ✅ **DECISION MADE** - Recurring sessions feature removed

**Rationale:** 
- Cart-based system now allows users to select multiple sessions in one transaction
- Separate recurring flow was redundant and created complexity
- Users can achieve same result by adding multiple slots to cart
- Simplifies codebase and reduces maintenance burden

**Action Required:**
- [ ] Remove recurring session components and actions
- [ ] Clean up related database models if not used elsewhere
- [ ] Update documentation to reflect new approach

#### **Fix 2: Consolidate Checkout Flows** (6-8 hours)
**Goal:** Single cart-based Payment Intent checkout (remove duplicate flows)

**Files to Modify:**
- `app/checkout/page.tsx` (refactor)
- `lib/actions/checkout.ts` (update to use course rates)
- Remove old checkout components

**Acceptance Criteria:**
- [ ] Works from cart page
- [ ] Guest flow (account creation + payment)
- [ ] Logged-in flow (saved cards)
- [ ] Uses course `studentRateCad` for pricing
- [ ] Tracks tutor earnings separately
- [ ] Payment succeeds → creates order + appointments

#### **Fix 3: Fix Stripe Webhook** (3-4 hours)
**Goal:** Handle Payment Intent webhook correctly with dual rates

**Status:** ✅ Completed

**Files Modified:**
- `app/api/webhooks/stripe/route.ts`
- `app/api/checkout/confirm-payment-with-password/route.ts` (NEW)

**Acceptance Criteria:**
- [x] Listens for `payment_intent.succeeded`
- [x] Idempotent (check payment_intent_id)
- [x] Creates order + order_items + appointments atomically
- [x] Stores both student payment and tutor earnings
- [x] Deletes holds
- [x] Fetches cart data from `PaymentIntentData` table (no Stripe metadata limit)
- [x] Handles guest users (separate account creation endpoint)
- [x] Handles authenticated users (updates Stripe customer ID, saves payment method)
- [ ] Triggers Make.com webhook (Phase 5)
- [x] Logs all events

---

### **📊 Phase 0 Progress Tracker**

Track your progress:

- [x] **Backup created** (git commit)
- [x] **RLS diagnostic run** (policies reviewed)
- [x] **Data validated** (no constraint violations)
- [x] **Dual rate system added** (studentRateCad in schema)
- [ ] **Test code deleted** (cleaner codebase) - Pending
- [ ] **Constraints applied** (business rules enforced) - Pending
- [ ] **RLS policies consolidated** (single source of truth) - Pending review for guest tables
- [x] **Direct booking removed** (cart flow only)
- [x] **Cleanup committed** (changes saved)

### **✅ Phase 0.5 Critical Fixes - COMPLETED**

**Fix 1: Recurring Sessions Integration** - ✅ **REMOVED** (feature eliminated)
- Decision: Cart-based multi-session selection replaces recurring sessions
- Users can add multiple slots to cart for same effect
- Reduces complexity and maintenance burden

**Fix 2: Consolidate Checkout Flows** - ✅ COMPLETED
- Single cart-based Payment Intent checkout working
- Guest flow with account creation + password
- Logged-in flow with saved cards
- Dual rate system implemented
- Success redirect to dashboard

**Fix 3: Fix Stripe Webhook** - ✅ COMPLETED
- Handles Payment Intent succeeded
- Dual rate system tracking
- Guest account creation separated to secure endpoint
- Fetches cart data from database (no metadata limit)
- Atomic order + appointment creation

---

### **🎯 Success Metrics**

After Phase 0 & 0.5, you should have:

1. ✅ Single roadmap document (this file)
2. 🚧 No test/debug routes in production (pending cleanup)
3. ✅ **Dual rate system in database** (Course.studentRateCad, OrderItem.tutorEarningsCad)
4. 🚧 Database constraints enforcing business rules (pending)
5. 🚧 Clean, consolidated RLS policies (pending review for new tables)
6. ✅ **Single payment flow (Payment Intents) - FULLY WORKING**
7. ✅ **Single booking flow (cart-based) - FULLY WORKING**
8. ✅ **Guest checkout with account creation - FULLY WORKING**
9. ✅ **Auto sign-in and dashboard redirect - FULLY WORKING**
10. ✅ Clear path forward for Phase 1

### **🎉 Major Accomplishments (January 2025)**

**Payment Flow Overhaul:**
- ✅ Implemented dual rate system (student payments vs tutor earnings)
- ✅ Guest checkout with secure account creation
- ✅ Password-based registration during checkout
- ✅ Auto sign-in after payment
- ✅ Bypass Stripe metadata 500-char limit with database storage
- ✅ Atomic order/appointment creation with conflict detection
- ✅ Fixed numerous TypeScript type errors across codebase
- ✅ Fixed cart total calculation bugs (string concatenation → numeric)
- ✅ Added session-based guest cart support with cookies
- ✅ Separated sensitive password handling from webhook

**Database Enhancements:**
- ✅ Added `PaymentIntentData` model for cart data storage
- ✅ Added `session_id` to Cart and SlotHold for guest support
- ✅ Added `tutorEarningsCad` to OrderItem for dual rate tracking
- ✅ Added `endDatetime` to OrderItem for session duration

**Key Files Created/Modified:**
- NEW: `app/api/checkout/confirm-payment-with-password/route.ts`
- NEW: `lib/utils/session.ts`
- UPDATED: `app/api/webhooks/stripe/route.ts` (complete rewrite)
- UPDATED: `lib/actions/checkout.ts` (guest support, database storage)
- UPDATED: `lib/actions/cart.ts` (session-based guest carts)
- UPDATED: `components/payment/payment-intent-checkout-form.tsx` (password fields)
- UPDATED: `lib/pricing.ts` (hardened numeric conversions)
- DELETED: `app/paiement/succes/page.tsx` (redirect to dashboard instead)
- DELETED: `app/reservation/success/page.tsx` (obsolete)

**Recent Fixes (January 2025):**
- ✅ Fixed missing appointments in tutor dashboard (database schema mismatch)
- ✅ Added `meeting_link` column to `appointments` table
- ✅ Implemented full meeting link functionality for tutors and students
- ✅ Fixed appointment visibility issues across all dashboards
- ✅ Meeting links work for both tutors (add/edit) and students (view/click)
- ✅ Appointments display normally when meeting links are blank

---

### **🚀 After Phase 0 & 0.5**

Follow this sequence:
1. ✅ **PHASE 0.5: Critical Fixes** - COMPLETED (Checkout & Webhook fixes)
2. **CURRENT: Bug Fixes & Polish** - Small issues to resolve before Phase 1
3. **PHASE 1: Core Booking Flow** (Make.com webhooks, RLS review)
4. **PHASE 2: Student Dashboard Features**
5. **PHASE 3: Tutor Dashboard Features** (Availability CRUD)
6. **PHASE 4: Admin Dashboard Features** (Course CRUD with rate management)
7. Continue with remaining features as outlined in phases below

### **🐛 Known Issues to Fix (Post-Payment Flow)**

**Priority: High**
- [ ] Review RLS policies for new tables (`payment_intent_data`, guest carts/holds)
  - See RLS Review Notes below
- [ ] Test authenticated user payment flow end-to-end
- [ ] Test guest user payment flow with various edge cases
- [ ] Verify all TypeScript errors resolved in production build

**Priority: Medium**
- [ ] Clean up test/debug API routes
- [ ] Add database constraints (CHECK constraints)
- [ ] Inline hold cleanup on cart operations

**Priority: Low**
- [ ] Performance optimization (indexes, caching)
- [ ] Remove recurring sessions code and components (cleanup)

### **🔒 RLS Policy Review Notes (New Tables)**

**Tables Needing RLS Review:**

1. **`payment_intent_data`**
   - **Purpose:** Temporary storage for cart data during payment (bypasses Stripe metadata limit)
   - **Access Pattern:** Created during checkout, read by webhook, deleted after processing
   - **Current Status:** Unknown if RLS policies exist
   - **Recommended Policy:**
     - System/service role can INSERT, SELECT, DELETE
     - Regular users should NOT have direct access
     - Consider row-level TTL or scheduled cleanup for orphaned records

2. **`carts` (with `session_id` added)**
   - **Purpose:** Support guest users via session-based cart
   - **Access Pattern:** Guest users access via `session_id`, authenticated users via `userId`
   - **Current Status:** Existing RLS policies may not cover `session_id` pattern
   - **Recommended Policy:**
     - Allow SELECT/UPDATE/DELETE where `session_id = current_setting('app.cart_session_id')` OR `userId = auth.uid()`
     - Only authenticated users can set `userId` on cart

3. **`slot_holds` (with `session_id` added)**
   - **Purpose:** Temporary slot reservations for guest users
   - **Access Pattern:** Guest users create holds via `session_id`, authenticated users via `userId`
   - **Current Status:** Existing RLS policies may not cover `session_id` pattern
   - **Recommended Policy:**
     - Allow INSERT/SELECT/DELETE where `session_id = current_setting('app.cart_session_id')` OR `userId = auth.uid()`
     - Automatic cleanup of expired holds (TTL > 15 minutes)

4. **`cart_items` (related to guest carts)**
   - **Purpose:** Line items in cart
   - **Access Pattern:** Via parent `cart` relationship
   - **Recommended Policy:**
     - Allow access if user has access to parent cart (via `userId` or `session_id`)

**SQL Script to Check Current Policies:**

```sql
-- Check policies for new/modified tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('payment_intent_data', 'carts', 'slot_holds', 'cart_items')
ORDER BY tablename, policyname;

-- Check if RLS is enabled on these tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('payment_intent_data', 'carts', 'slot_holds', 'cart_items')
  AND schemaname = 'public';
```

**Action Items:**
1. Run the SQL script above to audit current RLS policies
2. Create/update policies for guest session access pattern
3. Ensure `payment_intent_data` is restricted to system/service role only
4. Test guest cart flow with RLS enabled
5. Document session-based authentication pattern for future reference

---

## **PHASE 0: Cleanup & Foundation (DETAILED PLANNING)**

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
**Status:** ✅ Completed

**Tasks:**
- [x] **Add Dual Rate System to Schema:**
  - [x] Add `studentRateCad` (Decimal) to `Course` model
  - [x] Keep `hourlyBaseRateCad` on `Tutor` model (tutor earnings)
  - [x] Update pricing calculations to use course rate for students
  - [x] Update cart/order calculations
  - [x] Migration script to set default course rates
- [x] Added `tutorEarningsCad` field to `OrderItem` model
- [x] Added `endDatetime` field to `OrderItem` model
- [x] Added `session_id` to `Cart` and `SlotHold` models for guest support
- [x] Created `PaymentIntentData` model for storing cart data (bypass Stripe metadata limit)
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

## **PHASE 1: Core Booking Flow (Cart-Based) - AFTER FIXES**

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
**Status:** ✅ Completed (Guest Support Added)

**Location:** `lib/actions/cart.ts`, `components/cart/`, `lib/utils/session.ts` (NEW)

**Completed Tasks:**
- [x] Add to cart creates 15-min hold
- [x] Remove from cart releases hold
- [x] Apply coupon validation (date range, redemption count)
- [x] Cart totals calculation with discount
- [x] **Guest cart support (session-based with cookie)**
- [x] Cart item validation before checkout
- [x] Fixed cart total calculation (numeric conversion bug)
- [x] Created session helper utilities for guest tracking
- [x] Updated cart actions to support both `userId` and `sessionId`
- [ ] **Fix:** Ensure cart works for both single and recurring sessions (pending)
- [ ] **Fix:** Inline hold cleanup on cart operations (pending)

**Acceptance Criteria:**
- [x] Adding slot creates hold and prevents double-booking
- [x] Removing slot releases hold immediately
- [x] Holds expire after 15 minutes (database-level)
- [x] Coupons apply correctly (% or fixed)
- [x] Cart works for logged-in and guest users
- [ ] Recurring sessions properly integrate with cart (pending)

---

### **1.3 Stripe Payment Intent Checkout**
**Status:** ✅ Completed (Full Guest & Authenticated Flow)

**Location:** `app/checkout/page.tsx`, `lib/actions/checkout.ts`, `components/payment/payment-intent-checkout-form.tsx`

**Completed Tasks:**
- [x] **Refactor:** Create single checkout page from cart
- [x] Remove old direct booking checkout
- [x] **Guest checkout form (create account + payment with password fields)**
- [x] Logged-in checkout (use saved card or new card)
- [x] Save payment method option for future use
- [x] Billing address collection
- [x] Payment confirmation handling
- [x] Error handling and retry logic
- [x] **Store cart data in database (PaymentIntentData) to bypass Stripe 500-char metadata limit**
- [x] **Auto sign-in after guest payment**
- [x] **Redirect to student dashboard after successful payment**
- [x] Fixed country code validation (2-character ISO format)
- [x] Password validation for guest users (min 6 chars, match confirmation)

**Acceptance Criteria:**
- [x] Cart items displayed in checkout summary
- [x] Guest can create account and pay in one flow
- [x] Logged-in users can save cards
- [x] Payment succeeds and triggers webhook
- [x] Failed payments release holds
- [x] Guest users redirected to dashboard after account creation

---

### **1.4 Stripe Webhook Handler**
**Status:** ✅ Completed (Dual Rate System Implemented)

**Location:** `app/api/webhooks/stripe/route.ts`, `app/api/checkout/confirm-payment-with-password/route.ts` (NEW)

**Completed Tasks:**
- [x] **Fix:** Handle Payment Intent succeeded (not Checkout Session)
- [x] Idempotent order creation (check `stripePaymentIntentId`)
- [x] Atomic transaction:
  - Create `Order` and `OrderItems` with `tutorEarningsCad`
  - Convert holds to `Appointments`
  - Delete holds
  - Update coupon redemption count
- [x] Conflict check before appointment creation
- [x] Refund on conflict detection
- [x] **Guest account finalization separated to secure endpoint** (`confirm-payment-with-password`)
- [x] **Fetch cart data from `PaymentIntentData` table** (bypasses Stripe metadata limit)
- [x] **Calculate and store both student payment and tutor earnings**
- [x] **Update Stripe customer ID for authenticated users**
- [x] **Save payment method for authenticated users**
- [x] **Create Supabase Auth user and database user for guests**
- [x] **Auto sign-in guest users after account creation**
- [ ] Trigger Make.com booking webhook (Phase 5)
- [x] Log to `webhook_events` table

**Acceptance Criteria:**
- [x] Payment creates order and appointments atomically
- [x] Holds converted to appointments on success
- [x] Conflicts detected and refunded
- [x] Dual rate system working (student payment vs tutor earnings)
- [x] Guest users get account created and auto signed-in
- [x] Authenticated users get Stripe customer linked
- [ ] Make.com webhook sent on success (Phase 5)
- [x] All webhook events logged

---

### **1.5 Core Booking Flow Complete**
**Status:** ✅ Completed (Payment flow working)

**Note:** Make.com webhooks moved to Phase 5 (Cross-Cutting Features) to consolidate all webhook implementations.

---

## **PHASE 2: Student Dashboard Features**

### **2.1 Enhanced Profile Management**
**Status:** ✅ Completed

**Note:** Credit payment system has been implemented and needs testing once database connection issues are resolved. The system includes:
- Credit balance display and management
- Credit payment option in checkout (when user has sufficient credits)
- Mixed payment option (credits + card)
- Credit deduction and transaction tracking
- Integration with existing payment flow

### **2.2 Reservation Management**

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

### ~~**2.4 Payment Methods Management**~~ (DEFERRED TO V2)
**Status:** 🔄 **V2 Deferred**

**Rationale:** 
- Payment methods management moved to V2 to focus on core booking functionality
- Students can still complete payments without saving cards
- Reduces complexity for V1 launch
- Will be re-implemented in V2 with enhanced features

**V1 Approach:**
- Students enter payment details for each transaction
- No card saving functionality
- Payment processing still works via Stripe Payment Intents
- Guest checkout remains fully functional

**V2 Features (Deferred):**
- Save payment methods for future use
- Default payment method selection
- Payment method management interface
- Enhanced security features

---

### ~~**2.5 Recurring Sessions Booking**~~ (REMOVED)
**Status:** ✅ **FEATURE ELIMINATED**

**Rationale:** 
- Cart-based system now supports multiple session selection
- Users can add multiple slots to cart for same effect as recurring sessions
- Eliminates complexity of separate recurring flow
- Reduces maintenance burden and potential bugs

**New Approach:**
- Users browse available slots and add multiple to cart
- Single payment for all selected sessions
- Individual sessions can still be cancelled (credits issued)
- Simpler, more intuitive user experience

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
**Status:** ✅ Completed (Core Features)

**Location:** `components/dashboard/tutor-dashboard.tsx`, `components/dashboard/tutor-appointment-card.tsx`

**Completed Tasks:**
- [x] View all appointments (upcoming/past) in "Rendez-vous" tab
- [x] View appointment details (student info, course, time, status)
- [x] **Add meeting link to appointment (Zoom, Teams, Google Meet)**
- [x] **Edit/update meeting links**
- [x] **Meeting links display for students**
- [x] **Database schema updated with `meeting_link` column**

**Remaining Tasks:**
- [ ] Filter by status (scheduled/cancelled/completed)
- [ ] Cancel appointment (with reason, triggers refund/credit)
- [ ] Download ICS file per appointment
- [ ] Trigger Make.com webhook (Phase 5) on tutor actions

**Database Schema:**
- [x] Added `meeting_link TEXT` column to `appointments` table (nullable)

**Server Actions Implemented:**
- `lib/actions/reservations.ts`:
  - [x] `updateMeetingLink(appointmentId, meetingLink)` - tutors can add/edit links
  - [x] `isValidUrl(string)` - basic URL validation helper

**Acceptance Criteria:**
- [x] Tutors can add/edit meeting links on appointment cards
- [x] Students can view and click meeting links
- [x] Appointments display normally when meeting link is blank
- [x] Meeting links open in new tab for students
- [x] URL validation prevents invalid links
- [ ] Cancellation creates credit for student (pending)
- [ ] Make.com webhook sent on cancellation (Phase 5)
- [ ] All actions logged in modification history (pending)

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
- [ ] Trigger Make.com webhook (Phase 5) on tutor message (Phase 5)

**Note:** Reuse existing `Message` model and components from student side.

**Acceptance Criteria:**
- Tutors can message students
- Conversation view shows full history
- File uploads work
- Make.com webhook sent

---

### **3.5 Tutor Earnings Dashboard**
**Status:** ✅ Completed (Enhanced with Payments Modal)

**Location:** `components/dashboard/tutor-earnings-dashboard.tsx`

**Completed Tasks:**
- [x] Monthly hours worked (from completed appointments)
- [x] Monthly earnings calculation (hours × rate)
- [x] Current month vs completed payments
- [x] Earnings history (past months)
- [x] Payment status per month (pending/paid by admin)
- [x] **Read-only payments modal** - Tutors can view unpaid appointments and payment history
- [x] **Renamed "Gains" to "Honoraires"** throughout tutor dashboard
- [x] Monthly earnings charts (line and bar charts)
- [x] Detailed earnings table with notes functionality
- [ ] Export earnings to CSV (deferred)
- [ ] Tax year summary (deferred)

**Server Actions Implemented:**
- `lib/actions/tutor-earnings.ts`:
  - [x] `getTutorEarnings(tutorId)` - Get all earnings data
  - [x] `getTutorMonthlyEarnings(tutorId)` - Get monthly earnings breakdown
  - [x] `getTutorYearToDateEarnings(tutorId)` - Get year-to-date totals
  - [x] `getTutorOwnUnpaidAppointments(tutorId)` - View own unpaid appointments
  - [x] `getTutorOwnPaymentHistory(tutorId)` - View own payment history
  - [x] `updateTutorNote(orderItemId, note)` - Add/edit notes on earnings

**Components Created:**
- [x] `TutorEarningsDashboard` - Enhanced with payments modal integration
- [x] Integrated `TutorPaymentsModal` in read-only mode

**Acceptance Criteria:**
- [x] Earnings calculated from completed appointments
- [x] Payment status tracked (admin marks as paid)
- [x] Tutors can view their unpaid appointments grouped by month
- [x] Tutors can view their payment history grouped by payment month
- [x] Monthly charts display correctly
- [x] Historical data accessible
- [x] "Honoraires" terminology used consistently
- [ ] Export functionality works (deferred)

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
**Status:** 🚧 Partially Implemented (real data for several cards)

**Location:** `components/dashboard/admin-dashboard.tsx`

**Tasks:**
- [ ] **Replace remaining mock data with real queries:**
  - [ ] Total active courses
  - [ ] Total active tutors
  - [ ] Total active students
  - [ ] This month vs last month revenue
  - [x] Unanswered support tickets (implemented)
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
**Status:** ✅ Completed (Enhanced with Earnings & Payment Management)

**Location:** `components/admin/tutor-management.tsx`

**Completed Tasks:**
- [x] Basic CRUD operations (create, edit, deactivate tutors)
- [x] List all tutors with search and filtering
- [x] Display tutor information (name, contact, courses, availability)
- [x] **Enhanced tutor card UI with "Profil professionnel" section:**
  - [x] Hourly rate display
  - [x] Priority display
  - [x] Appointments count this month
  - [x] Utilization percentage
  - [x] Earnings breakdown (earned vs paid) for current month
  - [x] Cumulative year-to-date earnings
  - [x] Rating placeholder (ready for future implementation)
- [x] **Four action buttons per tutor:**
  - [x] "Voir disponibilités" - Opens availability modal
  - [x] "Honoraires" - Opens payments modal with unpaid appointments and payment history
  - [x] "Modifier" - Edit tutor profile
  - [x] "Désactiver" - Deactivate tutor
- [x] **Tutor Availability Modal (`components/admin/tutor-availability-modal.tsx`):**
  - [x] View recurring availability rules
  - [x] View availability exceptions
  - [x] View time off periods
  - [x] Read-only view for admin
- [x] **Tutor Payments Modal (`components/admin/tutor-payments-modal.tsx`):**
  - [x] Two tabs: "Appointments non payés" and "Historique des paiements"
  - [x] Unpaid appointments grouped by month with expand/collapse
  - [x] Individual and bulk selection with checkboxes
  - [x] "Mark whole month" functionality
  - [x] Sticky footer with selection summary
  - [x] Mark as paid dialog with date picker and optional admin note
  - [x] Payment history tab with expandable details
  - [x] Success/error messages
  - [x] Read-only mode for tutor dashboard integration
- [x] **Tutor Dashboard Integration:**
  - [x] Added read-only payments modal to tutor dashboard
  - [x] Renamed "Gains" to "Honoraires" throughout tutor dashboard
  - [x] Tutor-specific server actions for viewing own payments
- [x] **Server Actions Enhanced (`lib/actions/admin.ts`):**
  - [x] `getTutorEarningsSummary()` - Fixed to filter by appointment completion date, shows earned vs paid
  - [x] `getTutorAvailabilityForAdmin()` - Fetch tutor availability (rules, exceptions, time off)
  - [x] `getTutorUnpaidAppointments()` - Get unpaid appointments grouped by month
  - [x] `getTutorPaymentHistory()` - Get payment history grouped by payment month
  - [x] `markAppointmentsAsPaid()` - Mark selected appointments as paid with date and note
  - [x] `getTutorAppointmentsCountThisMonth()` - Count completed appointments for current month
- [x] **Tutor-Specific Server Actions (`lib/actions/tutor-earnings.ts`):**
  - [x] `getTutorOwnUnpaidAppointments()` - Tutors can view their own unpaid appointments
  - [x] `getTutorOwnPaymentHistory()` - Tutors can view their own payment history

**Server Actions Implemented:**
- `lib/actions/admin.ts`:
  - [x] `getAllTutors()` - Lists all tutors with enhanced data
  - [x] `updateTutorProfile()` - Update tutor information
  - [x] `deactivateTutor()` - Deactivate tutor
  - [x] `getTutorUtilization()` - Calculate availability utilization
  - [x] `getTutorEarningsSummary()` - Fixed earnings calculations (earned vs paid)
  - [x] `getTutorAvailabilityForAdmin()` - View tutor availability
  - [x] `getTutorUnpaidAppointments()` - View unpaid appointments by month
  - [x] `getTutorPaymentHistory()` - View payment history by month
  - [x] `markAppointmentsAsPaid()` - Mark appointments as paid
  - [x] `getTutorAppointmentsCountThisMonth()` - Count appointments this month

**Components Created/Enhanced:**
- [x] `TutorManagement` - Enhanced with earnings display and action buttons
- [x] `TutorAvailabilityModal` - View-only availability display
- [x] `TutorPaymentsModal` - Comprehensive payment management (admin) and view-only (tutor)
- [x] `TutorEarningsDashboard` - Enhanced with payments modal integration

**Acceptance Criteria:**
- [x] Admin can view tutor cards with comprehensive information
- [x] Admin can view tutor availability in modal
- [x] Admin can view and manage tutor payments (unpaid and history)
- [x] Admin can mark appointments as paid with date and note
- [x] Earnings calculations show both "earned" and "paid" amounts correctly
- [x] Tutors can view their own unpaid appointments and payment history (read-only)
- [x] "Honoraires" terminology used consistently in tutor dashboard
- [x] Monthly grouping of unpaid appointments
- [x] Selection and bulk marking functionality works
- [x] Payment marking workflow complete with validation

---

### **4.4 Student Management**
**Status:** ✅ Completed

**Location:** `components/admin/student-management.tsx`

**Completed Tasks:**
- [x] List all students with search/filter (infinite scroll)
- [x] View student details in modal:
  - [x] Profile info
  - [x] Total spent breakdown (with refunds)
  - [x] Appointment counts (upcoming/past/cancelled)
  - [x] Message count
- [x] View student's appointment history with filters
- [x] View student's order history with refund info
- [x] View student's message history (read-only for admin)
- [x] Support tickets placeholder (ready for future implementation)
- [x] Sorting by name, registration date, and total spent
- [x] Search across all fields (name, email, phone)
- [x] Removed payment method features (no longer supported)
- [x] Fixed infinite scroll pagination issues

**Server Actions Implemented:**
- `lib/actions/admin.ts`:
  - [x] `getAllStudents(params)` - paginated with search and sorting
  - [x] `getStudentDetails(studentId)` - full profile with financial breakdown
  - [x] `getStudentAppointments(studentId, params)` - with filters
  - [x] `getStudentOrders(studentId, params)` - with refund info
  - [x] `getStudentMessages(studentId, params)` - all conversations

**Components Created:**
- [x] `StudentDetailsModal` - full-screen modal with tabs
- [x] `StudentAppointmentsList` - filtered appointment history
- [x] `StudentOrdersList` - order history with refund breakdown
- [x] `StudentMessagesList` - message history with timestamps

**Acceptance Criteria:**
- [x] All students listed with key metrics and financial summary
- [x] Infinite scroll with 20 students per page
- [x] Search works across name, email, and phone
- [x] Sorting by name, registration date, and total spent
- [x] Student details modal shows complete profile
- [x] Appointment history with filters (upcoming/past/cancelled/all)
- [x] Order history shows refunds and coupon usage
- [x] Message history shows all conversations (read-only)
- [x] Support tickets placeholder ready for future implementation
- [x] Mobile-responsive full-screen modal

---

### **4.5 Coupon Management (Full CRUD)**
**Status:** ✅ Completed

**Location:** `components/admin/coupon-management.tsx`

**Completed Tasks:**
- [x] List all coupons (active/expired) with search and pagination
- [x] Create coupon form:
  - [x] Code (unique, uppercase)
  - [x] Type (percent/fixed)
  - [x] Value
  - [x] Start/end dates (optional)
  - [x] Max redemptions (optional)
  - [x] Active status
- [x] Edit coupon
- [x] Delete coupon (soft delete if used, hard delete if unused)
- [x] Toggle active status
- [x] View coupon usage:
  - [x] Redemption count
  - [x] Total discount given (placeholder - schema limitation)
  - [x] Recent orders using coupon
- [x] Coupon performance analytics
- [x] Real-time cart integration (coupons apply/remove immediately)
- [x] Guest checkout support for coupons
- [x] Automatic deactivation of expired coupons

**Server Actions Implemented:**
- `lib/actions/admin.ts`:
  - [x] `getAllCoupons(params)` - paginated with search and sorting
  - [x] `getCouponDetails(id)` - single coupon with analytics
  - [x] `createCoupon(data)` - with validation
  - [x] `updateCoupon(id, data)` - with validation
  - [x] `deleteCoupon(id)` - soft delete if used, hard delete if unused
  - [x] `toggleCouponStatus(id)` - toggle active status
- `lib/actions/cart.ts`:
  - [x] `applyCoupon(code)` - for authenticated users
  - [x] `removeCoupon()` - for authenticated users
  - [x] `applyCouponGuest(code, sessionId)` - for guest users
  - [x] `removeCouponGuest(sessionId)` - for guest users

**Components Created:**
- [x] `CouponManagement` - main admin interface with CRUD operations
- [x] Enhanced `CartView` - real-time coupon application/removal
- [x] Coupon forms (create/edit) with validation
- [x] Coupon details modal with usage analytics

**Acceptance Criteria:**
- [x] Admins can create/edit/delete coupons
- [x] Validation prevents duplicate codes
- [x] Usage tracking accurate (redemption count)
- [x] Expired coupons automatically deactivated
- [x] Coupons work for both authenticated and guest users
- [x] Cart updates immediately when coupons are applied/removed
- [x] Real-time deactivation of expired coupons
- [x] Mobile-responsive interface

---

### **4.6 Appointment Management**
**Status:** ✅ Completed

**Location:** `components/admin/appointment-management.tsx`

**Completed Tasks:**
- [x] List all appointments with comprehensive filters:
  - [x] Status (scheduled/cancelled/completed/refunded/all)
  - [x] Date range (start/end dates)
  - [x] Tutor selection with autocomplete
  - [x] Student selection with autocomplete
  - [x] Course selection with autocomplete
  - [x] Search across all fields (name, email, course title)
- [x] View appointment details with full information:
  - [x] General information (status, dates, duration, meeting link)
  - [x] Participant details (student, tutor, course)
  - [x] Financial information (pricing, tutor earnings, order status)
  - [x] Cancellation details (if applicable)
  - [x] Complete modification history with timestamps
- [x] Manual appointment creation (free for students, tutors still paid):
  - [x] Student/tutor/course selection with validation
  - [x] Date and time picker with overlap validation
  - [x] Meeting link and reason fields
  - [x] Proper order/orderItem creation with $0 cost
  - [x] Tutor earnings calculation and tracking
- [x] Appointment status management:
  - [x] All status transitions (scheduled ↔ cancelled ↔ completed ↔ refunded)
  - [x] Status change with reason logging
  - [x] Cancellation with reason prompt
  - [x] Reactivation of cancelled appointments
- [x] Infinite scroll pagination (20 appointments per page)
- [x] Real-time data refresh after changes
- [x] Mobile-responsive design
- [x] Comprehensive error handling

**Server Actions Implemented:**
- `lib/actions/admin.ts`:
  - [x] `getAllAppointments(params)` - with filters and infinite scroll
  - [x] `getAppointmentDetails(id)` - full details with modification history
  - [x] `createManualAppointment(data)` - free appointments with tutor payment
  - [x] `updateAppointmentStatus(id, status, reason)` - status changes with logging
  - [x] `cancelAppointmentAdmin(id, reason)` - admin cancellation
  - [x] `getTutorsForAutocomplete(search)` - tutor search for filters
  - [x] `getStudentsForAutocomplete(search)` - student search for filters
  - [x] `getCoursesForAutocomplete(search)` - course search for filters

**Components Created:**
- [x] `AppointmentManagement` - main interface with table view and infinite scroll
- [x] Manual appointment creation form with validation
- [x] Appointment details modal with comprehensive information display
- [x] Status management dropdown menu with contextual actions
- [x] Filter controls with date inputs and autocomplete search
- [x] Responsive card layout for appointment display

**Acceptance Criteria:**
- [x] Admin can create free appointments (students pay $0, tutors still get paid)
- [x] All status transitions work with proper logging
- [x] Comprehensive filtering and search functionality
- [x] Infinite scroll with cursor-based pagination
- [x] Full appointment details with modification history
- [x] Mobile-responsive interface
- [x] Real-time data updates after changes
- [x] Proper validation and error handling

---

### **4.7 Order Management & Refunds**
**Status:** ✅ Completed

**Location:** `components/admin/order-management.tsx`

**Completed Tasks:**
- [x] List all orders with comprehensive filters:
  - [x] Status (created/paid/failed/refunded/partially_refunded/all)
  - [x] Date range (start/end dates)
  - [x] Amount range (min/max amounts)
  - [x] Tutor selection with autocomplete
  - [x] Student selection with autocomplete
  - [x] Course selection with autocomplete
  - [x] Search across all fields (name, email, order ID, payment intent ID)
- [x] View order details with full information:
  - [x] Order items with course and tutor details
  - [x] Payment information and Stripe payment intent ID
  - [x] Associated appointments with status and meeting links
  - [x] Complete refund history with processor details
- [x] Process refunds (full/partial):
  - [x] Stripe refund processing with immediate execution
  - [x] Automatic appointment cancellation when specified
  - [x] Refund tracking with reason and processor logging
  - [x] Order status updates (refunded/partially_refunded)
- [x] Order analytics integrated into admin overview:
  - [x] Total revenue for the year
  - [x] Refund rate (refunded value / total revenue)
  - [x] Average order value
  - [x] Total number of orders for the year
  - [x] Orders per month
  - [x] Revenue per month
  - [x] Top 5 courses (with order numbers)
  - [x] Top 5 tutors (with appointment numbers)
- [x] Infinite scroll pagination (20 orders per page)
- [x] Real-time data refresh after changes
- [x] Mobile-responsive design
- [x] Comprehensive error handling

**Database Changes:**
- [x] Updated `RefundRequest` model to add `stripeRefundId` and `orderId` fields
- [x] Added `partially_refunded` status to `OrderStatus` enum
- [x] Added `refundRequests` relation to `Order` model

**Server Actions Implemented:**
- `lib/actions/admin.ts`:
  - [x] `getAllOrders(params)` - with filters and infinite scroll
  - [x] `getOrderDetails(orderId)` - full order details with refund history
  - [x] `refundOrder(orderId, amount, reason, cancelAppointments)` - Stripe refund processing
  - [x] `getOrderAnalytics(year)` - comprehensive order analytics

**Components Created:**
- [x] `OrderManagement` - main interface with filters and infinite scroll
- [x] Order details modal with comprehensive information display
- [x] Refund processing modal with amount and reason input
- [x] Order analytics cards in admin overview dashboard
- [x] Responsive card layout for order display

**Acceptance Criteria:**
- [x] Refunds process through Stripe with immediate execution
- [x] Appointments cancelled automatically when specified
- [x] Refund tracking complete with processor and reason logging
- [x] Stripe sync accurate with refund ID tracking
- [x] Order analytics provide comprehensive business insights
- [x] Manual orders ($0) display correctly with tutor earnings
- [x] All order types (regular and manual) included in analytics

---

### **4.8 Revenue Analytics Dashboard**
**Status:** ✅ Completed

**Location:** `components/dashboard/admin-dashboard.tsx` (integrated into Overview tab)

**Completed Tasks:**
- [x] Remove Financial tab from admin dashboard
- [x] Integrate all financial data into Overview tab
- [x] Create comprehensive analytics cards:
  - [x] Financial Overview (prominent cards with yearly/monthly breakdown)
  - [x] Operational Metrics (courses, tutors, orders, outstanding payments)
  - [x] Performance Analytics (top courses, tutors, students)
  - [x] System Status (health indicators, support tickets)
- [x] Implement monthly breakdown modal with detailed monthly data
- [x] Add system health indicators (database, Stripe API, error rate, uptime)
- [x] Add support tickets placeholder with count and recent tickets
- [x] Ensure mobile responsiveness with single column layout
- [x] Organize analytics coherently with proper grouping and sections

**Analytics Implemented:**
- [x] Active courses and tutors count
- [x] Total revenue for the year (prominent display)
- [x] Total refund value for the year
- [x] Refund rate (refunded value / total revenue)
- [x] Average order value for the month and year
- [x] Total number of orders for the year
- [x] Orders per month
- [x] Revenue per month (clickable for detailed breakdown)
- [x] Top 5 courses (with order numbers)
- [x] Top 5 tutors (with appointment numbers)
- [x] Top 5 students (based on total order value)
- [x] Unanswered support tickets (placeholder with count)
- [x] System health indicators (4 indicators with color coding)
- [x] Revenue by course (year and month)
- [x] Revenue by tutor (year and month)
- [x] Tutor payment for the year
- [x] Tutor payment per month
- [x] Tutor outstanding amount to be paid
- [x] Monthly and yearly gross margin
- [x] Gross margin percentage

**Server Actions Implemented:**
- `lib/actions/admin.ts`:
  - [x] `getFinancialAnalytics(year?, month?)` - comprehensive financial data
  - [x] `getOperationalMetrics()` - operational metrics and counts
  - [x] `getPerformanceAnalytics(year?)` - top performers analysis
  - [x] `getSystemHealth()` - system health indicators
  - [x] `getSupportTickets()` - support tickets placeholder
  - [x] `getRevenueBreakdown(year?, month?)` - revenue by course/tutor

**UI Features:**
- [x] Prominent financial cards with gradient backgrounds
- [x] Clickable monthly revenue card for detailed breakdown
- [x] Color-coded system health indicators
- [x] Responsive grid layouts for all screen sizes
- [x] Monthly breakdown modal with comprehensive data
- [x] Support tickets card with count and recent list
- [x] Top performers with badges and counts
- [x] Real-time data loading on page refresh

**Acceptance Criteria:**
- [x] All financial data consolidated in Overview tab
- [x] Financial tab removed from navigation
- [x] Analytics cards properly grouped and organized
- [x] Monthly breakdown modal functional
- [x] System health indicators working
- [x] Support tickets placeholder implemented
- [x] Mobile responsive design
- [x] Real-time data on page load
- [x] Prominent display of revenue and margin data

---

### ~~**4.9 Recurring Sessions Management**~~ (REMOVED)
**Status:** ✅ **FEATURE ELIMINATED**

**Rationale:** 
- No longer needed with cart-based multi-session approach
- Admin can view all appointments regardless of how they were booked
- Simpler admin interface without recurring session complexity

**Replacement:**
- Admin appointment management covers all sessions
- No distinction needed between single vs recurring bookings
- All sessions managed uniformly through appointment system

---

## **PHASE 5: Cross-Cutting Features**

### **5.1 Make.com Webhooks (All Events)**
**Status:** ✅ Completed (January 2025)

**Location:** `lib/webhooks/make.ts`

**Completed Tasks:**
- [x] Create centralized webhook utility function
- [x] Implement retry logic (3 attempts with exponential backoff)
- [x] Event types implemented:
  - [x] `signup` (user creation - guest checkout only)
  - [x] `booking.created` (after payment - both guest and logged-in)
  - [x] `booking.cancelled` (student/tutor/admin)
  - [x] `booking.rescheduled` (student reschedule)
  - [x] `appointment.completed` (auto-completion and admin)
  - [x] `order.refunded` (admin refund processing)
  - [x] `message.sent` (student ↔ tutor)
  - [x] `rating.created` / `rating.updated`
  - [x] `ticket.created` / `ticket.status_changed` / `ticket.message_added`
  - [x] Admin operation events (course.*, tutor.*) - not recorded in DB
- [x] Payload formatting standardized
- [x] Error logging (console + database for non-admin events)
- [x] Webhook event recording in DB (excludes admin operations)
- [x] Environment variables for webhook URLs (with fallbacks)
- [x] Coupon code included in booking webhooks
- [x] Guest checkout integration (signup + booking webhooks)
- [x] Multiple appointments bundled in single webhook

**Key Features:**
- Centralized webhook service with retry logic
- Event recording to `webhook_events` table (non-admin events only)
- Standardized payload format with TypeScript types
- Fallback URLs for optional webhook endpoints
- Guest and logged-in user support
- Coupon code tracking in booking webhooks

**Acceptance Criteria:**
- [x] All specified events trigger webhooks
- [x] Retries happen automatically (max 3)
- [x] Failed webhooks logged (console + database)
- [x] Webhook payload matches spec format
- [x] Works for both guest and logged-in users
- [x] Multiple appointments bundled in single webhook
- [x] Coupon codes included in booking webhooks
- [x] Signup webhook only fires during guest checkout (not from /inscription page)

---

### **5.2 Meeting Links System**
**Status:** ✅ Completed

**Database Schema:**
```sql
-- Added to appointments table
ALTER TABLE appointments ADD COLUMN meeting_link TEXT;
```

**Completed Tasks:**
- [x] Add `meeting_link` column to `appointments` table (nullable)
- [x] Tutor can add/edit meeting link on appointment cards
- [x] Student can view meeting link (in appointment details)
- [x] URL validation for meeting links
- [x] Copy link functionality (opens in new tab)
- [x] Appointments display normally when meeting link is blank

**Server Actions Implemented:**
- `lib/actions/reservations.ts`:
  - [x] `updateMeetingLink(appointmentId, meetingLink)` - tutors can add/edit links
  - [x] `isValidUrl(string)` - basic URL validation helper

**Acceptance Criteria:**
- [x] Tutors add meeting links easily
- [x] Students see link on appointment cards
- [x] Platform-agnostic validation (any valid URL)
- [x] Graceful handling of blank meeting links

---

### **5.3 Rating & Review System**
**Status:** ✅ Completed

**Database Schema:**
```prisma
model TutorRating {
  id            String   @id @default(uuid())
  studentId     String   @map("student_id")
  tutorId       String   @map("tutor_id")
  courseId      String   @map("course_id")
  appointmentId String?  @map("appointment_id") @unique
  q1Courtoisie  Int      @map("q1_courtoisie")      // 1-5 stars
  q2Maitrise    Int      @map("q2_maitrise")        // 1-5 stars
  q3Pedagogie   Int      @map("q3_pedagogie")       // 1-5 stars
  q4Dynamisme   Int      @map("q4_dynamisme")       // 1-5 stars
  comment       String?  @db.Text                    // Max 2000 chars
  generalScore  Decimal  @db.Decimal(3, 2) @map("general_score") // Average of 4 questions
  hidden        Boolean  @default(false)            // Admin moderation
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  student User      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  tutor   Tutor     @relation(fields: [tutorId], references: [id], onDelete: Cascade)
  course  Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  appt    Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)

  @@unique([studentId, tutorId, courseId])
  @@index([tutorId, courseId, hidden])
  @@map("tutor_ratings")
}
```

**Completed Tasks:**
- [x] Add rating model with 4 questions (Courtoisie, Maîtrise, Pédagogie, Dynamisme)
- [x] One review per student per tutor per course (editable indefinitely)
- [x] Student submits rating via button on past completed appointments
- [x] Rating dialog with star inputs (replaces boxes)
- [x] Tutor views anonymized ratings in dashboard ("Évaluations" tab)
- [x] Admin views and moderates ratings (hide/restore functionality)
- [x] Per-question averages and general score calculation
- [x] Display general score on tutor card in admin dashboard
- [x] RLS policies for student write, tutor read (anonymized), admin full access
- [x] Make.com webhooks on rating create/update
- [x] Date filters and pagination for tutor and admin dashboards
- [x] Auto-completion of past appointments (status: scheduled → completed)

**Location:**
- `prisma/schema.prisma` - TutorRating model
- `lib/actions/ratings.ts` - Server actions
- `lib/actions/appointments.ts` - Auto-completion function
- `app/api/ratings/*` - API routes
- `components/dashboard/ratings/student-rating-dialog.tsx` - Student rating form
- `components/dashboard/tutor-ratings-tab.tsx` - Tutor dashboard tab
- `components/dashboard/admin/ratings-management.tsx` - Admin management
- `components/admin/tutor-ratings-modal.tsx` - Admin tutor-specific ratings
- `netlify/functions/complete-past-appointments.ts` - Scheduled completion

**Acceptance Criteria:**
- [x] Students can rate completed appointments (one per student-tutor-course)
- [x] Students can edit their ratings indefinitely
- [x] Ratings appear in tutor dashboard (anonymized)
- [x] General score calculates correctly (average of 4 questions)
- [x] Admin can moderate reviews (hide/restore)
- [x] Admin can view ratings per tutor via button in tutor management
- [x] Per-question averages displayed with date filters
- [x] Past appointments auto-complete when date passes

---

### **5.4 Support Ticket System**
**Status:** 🚧 Partially Implemented (V1 Scope)

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
- [x] Add support ticket models (Prisma + migrations)
- [x] Apply RLS policies (students own rows, admins full access)
- [x] Student: Submit support ticket (with attachments)
- [x] Student: View ticket history and status
- [x] Admin: View all tickets with filters (status/priority/category/assignation/search)
- [x] Admin: Assign tickets
- [x] Admin: Respond to tickets (internal notes supported)
- [x] Admin: Change ticket status/priority
- [x] Admin overview card shows live unresolved count and recent tickets
- [x] Supabase Storage integration for ticket attachments
- [ ] Email notifications on ticket updates (V2 or Make.com)
- [ ] Make.com webhook on ticket events (Phase 5.1)

**Acceptance Criteria:**
- [x] Students can submit and track tickets
- [x] Admins can manage and respond
- [x] Status tracking works with transitions and resolvedAt
- [x] Priority system functional (admin-only)
- [x] Attachments upload and signed download links work
- [ ] Notifications/webhooks deferred to Phase 5.1 / V2

---

### **5.5 Notification System**
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

### **7.2 Security Hardening**
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

### **7.3 Error Handling & Logging**
**Status:** 🔲 Not Started

**Tasks:**
- [ ] **Error Boundaries Implementation:**
  - [ ] Create `ErrorBoundary` component with fallback UI
  - [ ] Wrap all dashboard components (student, tutor, admin)
  - [ ] Wrap all booking flow components (cart, checkout, payment)
  - [ ] Wrap all course and tutor listing pages
  - [ ] Add error reporting to Sentry or similar service
- [ ] **Component-Level Error Handling:**
  - [ ] Add try-catch blocks in all async operations
  - [ ] Add loading states for all data fetching
  - [ ] Add retry mechanisms for failed API calls
  - [ ] Add user-friendly error messages (French)
- [ ] **Centralized Error Logging:**
  - [ ] Implement error logging service
  - [ ] Log all client-side errors
  - [ ] Log all server-side errors
  - [ ] Send error notifications to admin
- [ ] **Error Recovery:**
  - [ ] Add retry buttons for failed operations
  - [ ] Add fallback data for critical components
  - [ ] Add offline state handling
  - [ ] Add graceful degradation for non-critical features

**Acceptance Criteria:**
- All components wrapped with error boundaries
- No unhandled errors crash the application
- Users see helpful error messages in French
- Admins notified of critical errors
- Error recovery mechanisms work
- Performance impact minimal

---

## **PHASE 8: Testing & Quality Assurance**

### **8.1 Unit Tests**
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

### **8.2 Integration Tests**
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

### **8.3 Manual Testing Checklist**
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

## **PHASE 9: Deployment & Documentation**

### **9.1 Netlify Deployment**
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

### **9.2 Scheduled Functions**
**Status:** 🔲 Not Started

**Location:** `netlify/functions/`

**Functions Needed:**
- [ ] `cleanup-expired-holds.ts` (runs every minute)
- [ ] `appointment-reminders.ts` (runs daily, sends reminders 24h before)
- [ ] `complete-past-appointments.ts` (runs daily, marks past appointments as completed)

---

### **9.3 Documentation**
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
- ✅ Database schema with **dual rate system** (studentRateCad, tutorEarningsCad)
- 🚧 Database constraints and RLS (pending review for new tables)
- ✅ Slot generation engine
- ✅ **Cart-based booking flow with guest support** (session-based)
- ✅ **Stripe Payment Intent checkout** (guest + authenticated, dual rate pricing)
- ✅ **Stripe webhook handler** (tracks both rates, atomic operations)
- ✅ Make.com webhooks (all events) - Phase 5.1 COMPLETED

### **Student Dashboard:**
- ✅ Profile management
- ✅ Reservation management (cancel/reschedule)
- ✅ Messaging
- 🔄 Payment methods (V2 deferred)
- ✅ Multi-session booking (via cart - recurring sessions removed)
- ✅ Support tickets (create, list, details, reply, close; attachments)

### **Tutor Dashboard:**
- ✅ Overview/stats
- 🔲 Availability CRUD (HIGH PRIORITY)
- ✅ Appointment management (core features + meeting links)
- 🔲 Messaging tab
- ✅ Earnings dashboard (enhanced with payments modal)
- 🔲 Course management
- ✅ Meeting links (fully functional)

### **Admin Dashboard:**
- 🔲 Course CRUD with **student rate management** (HIGH PRIORITY)
- ✅ Tutor management (basic + enhanced with earnings & payment management)
- ✅ Enhanced tutor management (**tutor rate editing, margin analysis, payments**)
- 🔲 Student management
- 🔲 Coupon CRUD
- 🔲 Appointment management
- 🔲 Order/refund management
- 🔲 Revenue analytics (**with margin tracking: student revenue - tutor costs**)
- ✅ Multi-session appointment management (via cart)

### **UI/UX Enhancement:**
- 🔲 TweakCN component library integration (Phase 6)
- 🔲 Homepage redesign
- 🔲 Course pages redesign
- 🔲 Booking flow enhancement
- 🔲 Dashboard modernization
- 🔲 Design system documentation

### **Additional V1 Features:**
- ✅ Meeting links (fully functional)
- ✅ Rating system (fully functional)
- ✅ Support tickets (fully functional)

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
- Payment methods management (save cards, default selection)
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

1. ✅ **PHASE 0:** Cleanup & Foundation + **Dual Rate System** - COMPLETED
   - Database schema hardening
   - Add `studentRateCad` to Course model
   - Add `tutorEarningsCad` to OrderItem model
   - Update pricing calculations
   - Guest cart support with sessions
2. ✅ **PHASE 0.5: Critical Fixes** - COMPLETED (January 2025)
   - ✅ Consolidate checkout flows (Payment Intents only)
   - ✅ Fix Stripe webhook for dual rates
   - ✅ Guest checkout with account creation
   - ✅ Auto sign-in and dashboard redirect
   - ✅ Bypass Stripe metadata limit
   - ✅ Recurring sessions feature removed (cart-based multi-session replaces it)
3. **PHASE 1: Core Booking Flow** (CURRENT - After bug fixes)
   - ✅ Cart system with holds (working)
   - ✅ Payment Intent checkout (working)
   - ✅ Stripe webhook (working)
   - 🔲 RLS policy review for new tables
4. **PHASE 2: Student Dashboard Features**
5. **PHASE 3: Tutor Dashboard Features**
   - Tutor Availability CRUD (HIGH PRIORITY)
6. **PHASE 4: Admin Dashboard Features**
   - Admin Course CRUD (with rate management)
   - Enhanced tutor management
   - Revenue analytics with margin tracking
7. **PHASE 5: Cross-Cutting Features**
   - ✅ **Make.com Webhooks (ALL EVENTS)** - COMPLETED (January 2025)
   - ✅ Meeting Links
   - ✅ Support Tickets
   - ✅ Rating System
8. **PHASE 6: UI/UX Enhancement with TweakCN**
   - Homepage, course pages, booking flow
   - Cart, checkout, dashboards
   - 35-50 hours estimated
9. **PHASE 7: Performance & Security**
10. **PHASE 8: Testing & Quality Assurance**
11. **PHASE 9: Deployment & Documentation**

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
- [ ] Multi-session booking works end-to-end (via cart)

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

**Last Updated:** January 2025 (Phase 5.1 Make.com Webhooks Completed)  
**Document Owner:** Development Team  
**Next Review:** Before each implementation phase

