# 4AS Tutor Booking App - Documentation Index

## 📚 Planning Documents (Start Here)

### 1. **[CONSOLIDATED_ROADMAP.md](./CONSOLIDATED_ROADMAP.md)** ⭐ PRIMARY
**The single source of truth for all planning and implementation.**

Contains:
- Complete V1 specifications
- Implementation phases (0-8)
- Status of all features (✅ 🚧 ⚠️ 🔲 🔄)
- Cross-cutting concerns and consistency rules
- Acceptance criteria for each feature
- V1 vs V2 scope decisions
- Recommended implementation order

**Use this for:** Overall project understanding, feature planning, implementation priorities


### 2. **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** 🚀 ACTION PLAN
**Immediate next steps - Phase 0 cleanup checklist.**

Contains:
- Step-by-step cleanup instructions
- Critical issues to fix first
- Checklists for Phase 0 tasks
- Success metrics
- Progress tracking

**Use this for:** Getting started with cleanup, immediate action items


### 3. **[CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)** 📝 DETAILS
**Detailed answers to your questions and rationale.**

Contains:
- Answers to database constraint questions
- Cart vs Direct booking decision explanation
- Recommended database constraints (detailed)
- Code review insights (what's working, broken, missing)
- Consistency rules to follow
- Proposed 2-week work plan

**Use this for:** Understanding decisions, technical details, rationale

### 3B. **[DUAL_RATE_AND_UI_UPDATES.md](./DUAL_RATE_AND_UI_UPDATES.md)** 🆕 NEW FEATURES
**Implementation guide for dual rate system and UI enhancement.**

Contains:
- Dual rate system business logic and implementation
- Database schema changes for student vs tutor rates
- Code changes required (pricing, cart, admin)
- TweakCN UI enhancement strategy
- Component redesign plan
- Success metrics and testing checklist

**Use this for:** Implementing new dual rate pricing, planning UI redesign


### 4. **[ROADMAP.md](./ROADMAP.md)** 🗂️ LEGACY
**Original roadmap - now archived, points to consolidated version.**

**Status:** Superseded by CONSOLIDATED_ROADMAP.md


### 5. **[plans/prompt.md](./plans/prompt.md)** 📄 ORIGINAL SPEC
**Original project prompt - kept for reference.**

**Use this for:** Verifying original requirements, historical context


### 6. **[plans/tutor-booking-app-0e2a857e.plan.md](./plans/tutor-booking-app-0e2a857e.plan.md)** 📄 ORIGINAL PLAN
**First implementation plan - kept for reference.**

**Use this for:** Historical context, comparing with current state

---

## 🗄️ Database Scripts

### 1. **[prisma/add-constraints.sql](../prisma/add-constraints.sql)**
**Ready-to-run SQL to add CHECK constraints.**

Includes:
- Duration validations (60, 90, 120 only)
- Time logic validations (end > start)
- Price validations (positive values)
- Business logic constraints (weekday, priority, etc.)
- Credit balance validations
- Recurring session validations

**Action:** Review, then run in Supabase SQL Editor


### 2. **[prisma/check-rls-policies.sql](../prisma/check-rls-policies.sql)**
**Diagnostic queries to check current RLS status.**

Includes:
- Query to check if RLS is enabled per table
- Query to list all current policies
- Query to find conflicting policies
- Summary query for policy counts

**Action:** Run in Supabase SQL Editor, save output for review


### 3. **[prisma/rls-policies-v1-clean.sql](../prisma/rls-policies-v1-clean.sql)**
**Clean, consolidated RLS policies for V1.**

Includes:
- Helper functions (get_user_role, is_admin, is_tutor)
- Complete policies for all tables
- Student/Tutor/Admin access controls
- Public read policies where appropriate
- Well-documented and tested

**Action:** Review, backup old policies, then apply

---

## 📊 Quick Reference

### Current Project Status

```
✅ Completed & Working
---------------------------
- Database schema (comprehensive)
- Slot generation engine
- Student profile management
- Reservation management (cancel/reschedule)
- Messaging system (with attachments)
- Payment methods management
- Basic tutor dashboard (stats/overview)
- Basic admin dashboard (overview)
- Tutor management (admin side)

⚠️ Needs Fixing
---------------------------
- Recurring sessions (broke cart flow)
- Duplicate checkout implementations
- Scattered RLS policies
- Test/debug code mixed with production

🆕 New Features Added to Roadmap
---------------------------
- Dual Rate System (tutor rate vs student/course rate)
  - Database schema update (add studentRateCad to Course)
  - Pricing calculator refactor
  - Admin rate management
  - Revenue margin tracking
- UI/UX Enhancement with TweakCN
  - Homepage, course pages, booking flow redesign
  - Dashboard modernization
  - Enhanced components and animations
  - Design system documentation

🔲 Not Started (High Priority)
---------------------------
- Dual rate system implementation
- Tutor availability CRUD
- Admin course CRUD (with rate management)
- Make.com webhooks
- Meeting links
- Support tickets
- Rating system
- Tutor messaging tab
- Tutor earnings dashboard
- Revenue analytics (with margin tracking)

🔄 Deferred to V2
---------------------------
- External calendar integration (Google/Microsoft)
- Advanced analytics & forecasting
- In-app notifications
- Real-time messaging (WebSocket)
- Multi-language/currency support
```

### Key Technical Decisions

| Decision Point | V1 Choice | Rationale |
|----------------|-----------|-----------|
| Payment Flow | Payment Intents | Card saving required |
| Booking Flow | Cart-based only | Spec requirement, flexibility |
| Guest Checkout | Supported | User convenience |
| Hold Cleanup | Inline | Simpler for V1 |
| Cancellation Credits | Default (not refunds) | Admin control |
| Tutor Availability UI | Form-based | Faster to implement |
| External Calendars | V2 | Not critical for launch |
| Messaging Platform | Make.com webhooks | Off-platform easier |
| Notifications | Webhooks only (V2 in-app) | Simpler integration |
| **Pricing Model** | **Dual Rate System** | **Revenue margin tracking needed** |
| **UI Components** | **shadcn/ui + TweakCN** | **Modern, enhanced components** |

### Implementation Priority Order

1. ✅ **Phase 0: Cleanup** ← START HERE
   - Delete test code
   - Add constraints
   - Consolidate RLS
   - Remove direct booking

2. 🔄 **Phase 1: Fix Broken Features**
   - Fix recurring sessions
   - Consolidate checkout
   - Fix Stripe webhook

3. 📋 **Phase 2: Critical Missing Features**
   - Tutor availability CRUD
   - Admin course CRUD
   - Make.com webhooks

4. 📋 **Phase 3: Complete Feature Set**
   - Meeting links
   - Support tickets
   - Rating system
   - Remaining admin features

5. 🧪 **Phase 4: Testing & QA**
6. 🚀 **Phase 5: Deployment**

---

## 🎯 Your Next Steps

### Immediate (Today)
1. ✅ Read CONSOLIDATED_ROADMAP.md (understand full scope)
2. ✅ Read QUICK_START_GUIDE.md (action items)
3. 🔲 Backup current state (`git commit`)
4. 🔲 Run RLS diagnostic queries
5. 🔲 Check for data constraint violations

### This Week
1. 🔲 Complete Phase 0 cleanup
2. 🔲 Fix recurring sessions (Priority 1)
3. 🔲 Consolidate checkout (Priority 2)
4. 🔲 Fix Stripe webhook (Priority 3)

### Next Week
1. 🔲 Tutor availability CRUD
2. 🔲 Admin course CRUD
3. 🔲 Make.com webhooks
4. 🔲 Meeting links

---

## 📞 Communication Approach

When implementing features, ALWAYS:

1. **Check CONSOLIDATED_ROADMAP.md** for cross-cutting concerns
2. **Follow consistency rules** (booking, payment, cancellation, etc.)
3. **Test both flows** (affected feature + existing features)
4. **Update roadmap status** (mark items as complete)
5. **Commit frequently** (after each logical step)

### Preventing "Breaking Changes"

Before implementing ANY feature:

✅ Ask: "Does this affect the booking flow?"  
✅ Ask: "Does this affect payments?"  
✅ Ask: "Does this create/modify appointments?"  
✅ Check: Cross-cutting concerns section in roadmap  
✅ Review: Consistency rules for this feature type  

---

## 📁 File Organization

```
.cursor/
├── CONSOLIDATED_ROADMAP.md       ⭐ Main planning document
├── QUICK_START_GUIDE.md          🚀 Immediate action plan
├── CLEANUP_SUMMARY.md            📝 Detailed answers & rationale
├── DUAL_RATE_AND_UI_UPDATES.md   🆕 New features implementation guide
├── ROADMAP.md                    🗂️ Legacy (archived)
├── INDEX.md                      📚 This file
└── plans/
    ├── prompt.md                 📄 Original spec
    └── tutor-booking-*.md        📄 Original plan

prisma/
├── schema.prisma                 💾 Database schema (add studentRateCad)
├── add-constraints.sql           🔧 Constraints to add
├── check-rls-policies.sql        🔍 Diagnostic queries
└── rls-policies-v1-clean.sql     🔒 Clean RLS policies
```

---

## ✅ Consolidation Complete!

You now have:
- ✅ Single source of truth (CONSOLIDATED_ROADMAP.md)
- ✅ Clear action plan (QUICK_START_GUIDE.md)
- ✅ Detailed rationale (CLEANUP_SUMMARY.md)
- ✅ Database scripts ready to run
- ✅ Clear implementation priorities
- ✅ Consistency rules to prevent breaking changes

**Ready to proceed with Phase 0!** 🎉

---

**Last Updated:** January 2025  
**Status:** Planning consolidation complete, ready for Phase 0 cleanup

