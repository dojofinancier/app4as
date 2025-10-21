# Quick Start Guide - Phase 0 Cleanup

## 📋 Summary

We've consolidated three planning documents into one comprehensive roadmap and identified critical issues to fix before proceeding with new features.

## 📁 New Files Created

1. **`.cursor/CONSOLIDATED_ROADMAP.md`** - Single source of truth for all planning
2. **`.cursor/CLEANUP_SUMMARY.md`** - Detailed answers to your questions
3. **`prisma/add-constraints.sql`** - Database constraints to add
4. **`prisma/check-rls-policies.sql`** - Diagnostic queries for RLS
5. **`prisma/rls-policies-v1-clean.sql`** - Clean RLS policy file

## 🎯 Key Decisions Made

| Topic | Decision |
|-------|----------|
| **Payment Flow** | Payment Intents ONLY (remove Checkout Sessions) |
| **Booking Flow** | Cart-based ONLY (remove direct booking) |
| **Guest Checkout** | Keep it (create account on payment) |
| **Hold Cleanup** | Inline (not scheduled function for now) |
| **Hold Duration** | Always 15 min from creation (no extension) |
| **Tutor Messaging** | Yes, implement tab in tutor dashboard |
| **Recurring Payment** | Pay upfront for all sessions |
| **Cancellation** | Credits by default (admin manual refunds) |
| **Reschedule Window** | 24 hours (different from 2h cancellation) |
| **Availability UI** | Form-based for V1 (defer complex grid to V2) |
| **External Calendars** | Defer to V2 |
| **Make.com Webhooks** | All student/tutor events + retry logic |
| **Database Constraints** | Add all recommended constraints |
| **RLS Policies** | Consolidate into single file |

## 🚨 Critical Issues Identified

### 1. **Recurring Sessions Breaking Cart** ⚠️
**Impact:** High - Prevents normal booking
**Priority:** Fix immediately
**Estimated Time:** 4-6 hours

### 2. **Duplicate Checkout Flows** ⚠️
**Impact:** High - Confusion and maintenance burden
**Priority:** Fix before new features
**Estimated Time:** 6-8 hours

### 3. **Scattered RLS Policies** ⚠️
**Impact:** Medium - Security and consistency
**Priority:** Fix in Phase 0
**Estimated Time:** 2-3 hours

### 4. **Test/Debug Code in Production** ⚠️
**Impact:** Low - Code cleanliness
**Priority:** Clean up in Phase 0
**Estimated Time:** 1 hour

## ✅ Phase 0 Checklist (Do This First)

### Step 1: Backup Current State
```bash
# Commit everything first
git add .
git commit -m "Pre-cleanup checkpoint"
git push
```

### Step 2: Run RLS Diagnostic
1. Copy contents of `prisma/check-rls-policies.sql`
2. Run in Supabase SQL Editor
3. Save output for review
4. Identify conflicting policies

### Step 3: Check Data for Constraint Violations
```sql
-- Run these queries in Supabase to check for violations:

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

### Step 4: Delete Test/Debug Code
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

# Verify deletion
git status
```

### Step 5: Apply Database Constraints
1. Fix any data violations found in Step 3
2. Review `prisma/add-constraints.sql`
3. Run in Supabase SQL Editor
4. Test with sample queries

### Step 6: Apply Clean RLS Policies
1. Backup existing policies (from Step 2 output)
2. Review `prisma/rls-policies-v1-clean.sql`
3. Generate DROP statements for old policies
4. Run clean policy file
5. Test with different user roles

### Step 7: Remove Direct Booking Code
```bash
# Delete direct booking action
rm lib/actions/booking.ts

# Review and remove related components
# (Check for imports of booking.ts first)
```

### Step 8: Commit Cleanup
```bash
git add .
git commit -m "Phase 0: Code cleanup, constraints, and RLS policies"
git push
```

## 🔧 Phase 1: Fix Broken Features

### Priority 1: Fix Recurring Sessions (4-6 hours)

**Goal:** Make recurring sessions use the cart flow

**Files to Modify:**
- `components/booking/recurring-session-form.tsx`
- `lib/actions/recurring-sessions.ts`
- `lib/actions/cart.ts`

**Acceptance Criteria:**
- [ ] Recurring session form adds ALL sessions to cart
- [ ] Single bookings still work
- [ ] Holds created for all recurring slots
- [ ] Payment creates all appointments at once
- [ ] Can cancel individual sessions

### Priority 2: Consolidate Checkout (6-8 hours)

**Goal:** Single cart-based Payment Intent checkout

**Files to Create/Modify:**
- `app/checkout/page.tsx` (refactor)
- `lib/actions/checkout.ts` (update)
- Remove old checkout components

**Acceptance Criteria:**
- [ ] Works from cart page
- [ ] Guest flow (account creation + payment)
- [ ] Logged-in flow (saved cards)
- [ ] Billing address collected
- [ ] Payment succeeds → creates order + appointments

### Priority 3: Fix Stripe Webhook (3-4 hours)

**Goal:** Handle Payment Intent webhook correctly

**Files to Modify:**
- `app/api/webhooks/stripe/route.ts`

**Acceptance Criteria:**
- [ ] Listens for `payment_intent.succeeded`
- [ ] Idempotent (check payment_intent_id)
- [ ] Creates order + order_items + appointments atomically
- [ ] Deletes holds
- [ ] Triggers Make.com webhook
- [ ] Logs all events

## 📊 Progress Tracking

Use this checklist to track Phase 0 completion:

- [ ] **Backup created** (git commit)
- [ ] **RLS diagnostic run** (policies reviewed)
- [ ] **Data validated** (no constraint violations)
- [ ] **Test code deleted** (cleaner codebase)
- [ ] **Constraints applied** (business rules enforced)
- [ ] **RLS policies consolidated** (single source of truth)
- [ ] **Direct booking removed** (cart flow only)
- [ ] **Cleanup committed** (changes saved)

## 🎯 Success Metrics

After Phase 0, you should have:

1. ✅ Single roadmap document (CONSOLIDATED_ROADMAP.md)
2. ✅ No test/debug routes in production
3. ✅ Database constraints enforcing business rules
4. ✅ Clean, consolidated RLS policies
5. ✅ Single payment flow (Payment Intents)
6. ✅ Single booking flow (cart-based)
7. ✅ Clear path forward for Phase 1

## 🚀 Next Steps

After completing Phase 0:

1. **Fix recurring sessions** (Priority 1)
2. **Consolidate checkout** (Priority 2)
3. **Fix Stripe webhook** (Priority 3)
4. Then follow CONSOLIDATED_ROADMAP.md for remaining features

## ❓ Need Help?

Refer to:
- **CONSOLIDATED_ROADMAP.md** - Full planning details
- **CLEANUP_SUMMARY.md** - Detailed answers to your questions
- SQL files in `prisma/` - Ready-to-run queries

## 📝 Notes

- **Always test in development first**
- **Commit frequently** (after each step)
- **Review changes before applying** (especially database changes)
- **Keep the consolidated roadmap updated** (mark items as complete)

---

**Ready to start?** Begin with Phase 0 Step 1: Backup Current State! 🎉

