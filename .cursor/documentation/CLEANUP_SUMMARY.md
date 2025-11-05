# Cleanup & Consolidation Summary

## Answers to Your Follow-Up Questions

### **Q1: Supabase Connection Sharing**
**Answer:** No, please **don't share direct credentials** for security reasons. Instead:
- I can provide SQL queries for you to run that will output diagnostics
- We'll create a clean RLS policy script that you can review before applying
- You can share query results (sanitized) if needed for debugging

**Why:** Direct database access could expose sensitive user data and violate security best practices.

---

### **Q2: Database Constraints Needed**

Based on your tutor booking use case, here are the recommended constraints:

#### **Duration Validation**
```sql
-- Ensure only valid durations
ALTER TABLE cart_items ADD CONSTRAINT check_duration 
  CHECK (duration_min IN (60, 90, 120));

ALTER TABLE order_items ADD CONSTRAINT check_duration 
  CHECK (duration_min IN (60, 90, 120));

ALTER TABLE slot_holds ADD CONSTRAINT check_duration 
  CHECK (duration_min IN (60, 90, 120));

ALTER TABLE recurring_sessions ADD CONSTRAINT check_duration 
  CHECK (duration_min IN (60, 90, 120));
```

#### **Time Logic Validation**
```sql
-- Appointments: end must be after start
ALTER TABLE appointments ADD CONSTRAINT check_time_order 
  CHECK (end_datetime > start_datetime);

-- Time off: end must be after start
ALTER TABLE time_off ADD CONSTRAINT check_time_order 
  CHECK (end_datetime > start_datetime);

-- Availability exceptions: end must be after start
ALTER TABLE availability_exceptions ADD CONSTRAINT check_time_order 
  CHECK (end_time > start_time);
```

#### **Price Validations**
```sql
-- Tutor rates must be positive
ALTER TABLE tutors ADD CONSTRAINT check_positive_rate 
  CHECK (hourly_base_rate_cad > 0);

-- Order totals must be non-negative
ALTER TABLE orders ADD CONSTRAINT check_positive_total 
  CHECK (total_cad >= 0);

-- Coupon values must be positive
ALTER TABLE coupons ADD CONSTRAINT check_positive_value 
  CHECK (value > 0);
```

#### **Business Logic Constraints**
```sql
-- Weekday must be 0-6 (Sunday-Saturday)
ALTER TABLE availability_rules ADD CONSTRAINT check_weekday_range 
  CHECK (weekday BETWEEN 0 AND 6);

-- Tutor priority must be positive
ALTER TABLE tutors ADD CONSTRAINT check_priority 
  CHECK (priority >= 1);

-- Coupon redemptions validation
ALTER TABLE coupons ADD CONSTRAINT check_redemption_count 
  CHECK (
    redemption_count >= 0 AND 
    (max_redemptions IS NULL OR redemption_count <= max_redemptions)
  );

-- Recurring session frequency validation
ALTER TABLE recurring_sessions ADD CONSTRAINT check_frequency 
  CHECK (frequency IN ('weekly', 'biweekly'));

-- Recurring session counters
ALTER TABLE recurring_sessions ADD CONSTRAINT check_session_counts 
  CHECK (
    total_sessions > 0 AND
    sessions_created >= 0 AND
    sessions_completed >= 0 AND
    sessions_cancelled >= 0 AND
    sessions_created <= total_sessions
  );
```

#### **Credit Balance Validation**
```sql
-- Credit balance cannot be negative
ALTER TABLE users ADD CONSTRAINT check_credit_balance 
  CHECK (credit_balance >= 0);
```

---

### **Q3: Cart + Checkout vs Direct Booking**

**Decision: Use ONLY Cart + Checkout Flow**

#### **What to Remove:**
1. **Files to delete:**
   - `lib/actions/booking.ts` (direct booking action)
   - Any `/cours/[slug]/reservation` direct booking pages
   - Old checkout components not using cart

2. **API Routes to remove:**
   - `/api/test/*`
   - `/api/debug-*/*`
   - `/api/test-appointment/*`
   - `/api/test-tutor-relationship/*`

3. **Replace with unified flow:**
   ```
   Course Page → Add to Cart → Cart Page → Checkout → Payment → Success
   ```

#### **Benefits:**
- ✅ Single payment path = easier to maintain
- ✅ Supports unlimited slots (per spec)
- ✅ Easier coupon handling across items
- ✅ Recurring sessions fit naturally
- ✅ Guest and logged-in users use same flow
- ✅ Payment method saving works
- ✅ Consistent with original specification

---

## What Was Created

### **1. Consolidated Roadmap** (`CONSOLIDATED_ROADMAP.md`)

A comprehensive, single-source-of-truth document that includes:

- ✅ **Complete V1 Specifications** - All requirements from original prompt
- ✅ **Tech Stack Details** - Confirmed stack based on your answers
- ✅ **Booking Rules** - Lead time, holds, cancellation policies
- ✅ **Implementation Status** - What's done, what's broken, what's missing
- ✅ **Phase-by-Phase Breakdown** - Starting with Phase 0 (Cleanup)
- ✅ **Cross-Cutting Concerns** - Consistency rules to prevent future breaks
- ✅ **Database Schema Plans** - Including new models needed
- ✅ **Server Actions Inventory** - All actions needed per feature
- ✅ **Acceptance Criteria** - Clear definition of "done" for each feature
- ✅ **V1 vs V2 Scope** - What's launch-critical vs future enhancement
- ✅ **Implementation Order** - Recommended order based on dependencies

### **2. Updated Original Roadmap** (`ROADMAP.md`)

- Now points to the consolidated version
- Preserved for reference but marked as legacy

---

## Recommended Next Steps

### **Immediate (Phase 0): Cleanup**

#### **Step 1: Code Cleanup (Estimated: 1-2 hours)**
```bash
# Delete test/debug routes
rm -rf app/api/test
rm -rf app/api/debug-*
rm -rf app/api/test-appointment
rm -rf app/api/test-tutor-relationship

# Delete direct booking flow
rm lib/actions/booking.ts
# (Review and remove related components)
```

#### **Step 2: Database Hardening (Estimated: 2-3 hours)**

**Create:** `prisma/add-constraints.sql`
```sql
-- Apply all recommended constraints from above
-- Test with existing data first
```

**Create:** `prisma/rls-policies-v1.sql`
```sql
-- Consolidated, clean RLS policies
-- Single source of truth
-- Tested per role
```

#### **Step 3: Update Prisma Schema (Estimated: 1 hour)**

Add models for V1 features:
- `MeetingLink`
- `TutorRating`
- `SupportTicket`, `TicketAttachment`, `TicketMessage`
- `TutorPayment`

Run:
```bash
npm run prisma:generate
npm run prisma:push  # or create migration
```

---

### **Next Priority (Phase 1): Fix Booking Flow**

#### **High Priority Issues:**

1. **Fix Recurring Sessions Breaking Cart** (Estimated: 4-6 hours)
   - Refactor recurring session form to use cart
   - Ensure single bookings still work
   - Test both flows thoroughly

2. **Consolidate Checkout Flow** (Estimated: 6-8 hours)
   - Remove duplicate checkout implementations
   - Single cart-based checkout page
   - Payment Intent flow only
   - Guest + logged-in support

3. **Fix Stripe Webhook** (Estimated: 3-4 hours)
   - Handle Payment Intent (not Checkout Session)
   - Atomic transaction for order + appointments
   - Proper hold cleanup
   - Make.com webhook trigger

---

### **After Booking Flow Fixed**

Follow the implementation order in `CONSOLIDATED_ROADMAP.md`:

1. **Tutor Availability CRUD** - Blocks student booking improvements
2. **Admin Course CRUD** - Needed for full system test
3. **Make.com Webhooks** - All event types
4. **Tutor Messaging Tab** - Complete messaging feature
5. **Meeting Links** - High user value
6. **Support Tickets** - User support system
7. **Rating System** - Trust building
8. **Admin Features** - Coupons, Orders, Revenue Analytics
9. **Testing & QA**
10. **Deployment**

---

## Key Insights from Code Review

### **What's Working Well:**
- ✅ Database schema is comprehensive
- ✅ Student dashboard has solid features
- ✅ Messaging system is well-implemented
- ✅ Slot generation engine is solid
- ✅ Payment method management works

### **What's Broken:**
- ⚠️ Recurring sessions broke the cart flow
- ⚠️ Multiple checkout implementations cause confusion
- ⚠️ RLS policies scattered across multiple files
- ⚠️ Test/debug code mixed with production code

### **What's Missing:**
- 🔲 Tutor availability CRUD (blocks tutor onboarding)
- 🔲 Admin course CRUD (blocks course management)
- 🔲 Make.com webhooks (blocks communications)
- 🔲 Meeting links (needed for sessions)
- 🔲 Support system (needed for launch)
- 🔲 Rating system (trust building)

---

## Consistency Rules to Follow

### **Golden Rule: Before implementing ANY feature:**

1. ✅ Check if it affects the booking flow → ensure it doesn't break existing flow
2. ✅ Check if it involves payment → use cart + Payment Intent flow only
3. ✅ Check if it creates/modifies appointments → validate holds and conflicts
4. ✅ Check if it's user-facing → ensure French labels
5. ✅ Check if it's a mutation → trigger Make.com webhook
6. ✅ Review "Cross-Cutting Concerns" section in roadmap

### **When Adding Features:**

1. Start with database schema (models, constraints, RLS)
2. Create Server Actions with validation
3. Build UI components (server components first)
4. Add client interactivity where needed
5. Test with all user roles
6. Check cross-feature impact
7. Update consolidated roadmap status

---

## Questions for You Before We Proceed

1. **Cleanup Priority:** Should we start with Phase 0 cleanup immediately, or jump to fixing the broken recurring sessions first?

2. **Database Changes:** Do you want me to:
   - Generate the constraint SQL for you to review?
   - Create a clean RLS policy file?
   - Update the Prisma schema with new models?

3. **Broken Flows:** The most critical issues are:
   - Recurring sessions breaking cart
   - Multiple checkout flows
   
   Which should we fix first?

4. **Testing Access:** Can you test changes locally, or should we be extra cautious with each change?

5. **Deployment Timeline:** When are you planning to launch V1? This will help prioritize what's truly essential.

---

## Proposed Work Plan (Next 2 Weeks)

### **Week 1: Cleanup & Core Fixes**
- [ ] Delete test/debug code
- [ ] Add database constraints
- [ ] Consolidate RLS policies
- [ ] Fix recurring sessions + cart integration
- [ ] Consolidate checkout flow
- [ ] Fix Stripe webhook handler

### **Week 2: Critical Missing Features**
- [ ] Tutor availability CRUD
- [ ] Admin course CRUD
- [ ] Make.com webhooks (all events)
- [ ] Meeting links
- [ ] Support tickets (basic)

This gets you to a minimally viable V1.

---

## Your Call

Let me know:
1. Should we proceed with Phase 0 cleanup?
2. Which broken feature to tackle first?
3. Any adjustments to the consolidated roadmap?

I'm ready to start implementing once you confirm the approach! 🚀

