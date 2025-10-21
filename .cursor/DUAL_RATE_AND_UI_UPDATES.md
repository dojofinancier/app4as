# Dual Rate System & UI Enhancement - Implementation Guide

## Overview
Two major features have been added to the consolidated roadmap:
1. **Dual Rate System** - Separate tutor earnings from student pricing
2. **UI/UX Enhancement** - Modern redesign using [TweakCN](https://tweakcn.com/)

---

## 1. Dual Rate System

### **Business Logic**

**Problem Solved:**
- Platform needs to charge students more than what tutors earn (revenue margin)
- Different courses may have different pricing strategies
- Tutors shouldn't see what students pay (and vice versa)

**How It Works:**
- **Tutor Rate** (`hourlyBaseRateCad` on `Tutor` model): What tutors earn per hour
  - Example: $30/hour
  - Visible to: Tutor, Admin
  - Used for: Earnings tracking, payout calculations
  
- **Student/Course Rate** (`studentRateCad` on `Course` model): What students pay per hour
  - Example: $45/hour
  - Visible to: Students, Admin
  - Used for: Cart pricing, checkout, revenue

- **Revenue Margin**: Difference between rates
  - Example: $45 - $30 = $15/hour profit margin
  - Margin %: ($15 / $45) × 100 = 33.3%
  - Visible to: Admin only

### **Database Changes**

#### **1. Update Course Model**
```prisma
model Course {
  id            String   @id @default(uuid())
  slug          String   @unique
  titleFr       String   @map("title_fr")
  descriptionFr String   @map("description_fr") @db.Text
  studentRateCad Decimal @map("student_rate_cad") @db.Decimal(10, 2) @default(45.00) // NEW
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  
  // ... relations
}
```

#### **2. Keep Tutor Model As-Is**
```prisma
model Tutor {
  // ... existing fields
  hourlyBaseRateCad  Decimal @map("hourly_base_rate_cad") @db.Decimal(10, 2)
  // This is what tutors earn
}
```

#### **3. Migration Steps**

```sql
-- Add student rate column to courses
ALTER TABLE courses 
  ADD COLUMN student_rate_cad DECIMAL(10, 2) DEFAULT 45.00 NOT NULL;

-- Add constraint
ALTER TABLE courses 
  ADD CONSTRAINT check_student_rate 
  CHECK (student_rate_cad > 0);

-- Update existing courses (set default or calculate from tutor rates)
UPDATE courses 
SET student_rate_cad = 45.00 
WHERE student_rate_cad IS NULL;
```

### **Code Changes Required**

#### **1. Pricing Calculator (`lib/pricing.ts`)**

**Before (Single Rate):**
```typescript
export function calculateSessionPrice(tutorRate: number, duration: number) {
  const multiplier = duration === 60 ? 1 : duration === 90 ? 1.5 : 2
  return tutorRate * multiplier
}
```

**After (Dual Rate):**
```typescript
// For students (what they pay)
export function calculateStudentPrice(courseRate: number, duration: number) {
  const multiplier = duration === 60 ? 1 : duration === 90 ? 1.5 : 2
  return courseRate * multiplier
}

// For tutors (what they earn)
export function calculateTutorEarnings(tutorRate: number, duration: number) {
  const multiplier = duration === 60 ? 1 : duration === 90 ? 1.5 : 2
  return tutorRate * multiplier
}

// For admins (margin analysis)
export function calculateMargin(courseRate: number, tutorRate: number, duration: number) {
  const studentPrice = calculateStudentPrice(courseRate, duration)
  const tutorEarnings = calculateTutorEarnings(tutorRate, duration)
  return {
    studentPrice,
    tutorEarnings,
    margin: studentPrice - tutorEarnings,
    marginPercent: ((studentPrice - tutorEarnings) / studentPrice) * 100
  }
}
```

#### **2. Cart Actions (`lib/actions/cart.ts`)**

Update `addToCart` to use course rate:
```typescript
export async function addToCart(data: AddToCartData) {
  // Fetch course (includes studentRateCad)
  const course = await prisma.course.findUnique({
    where: { id: data.courseId },
    select: { studentRateCad: true }
  })
  
  // Calculate price using COURSE rate (not tutor rate)
  const price = calculateStudentPrice(
    Number(course.studentRateCad),
    data.durationMin
  )
  
  // Create cart item with student-facing price
  await prisma.cartItem.create({
    data: {
      // ...
      unitPriceCad: price,
      lineTotalCad: price
    }
  })
}
```

#### **3. Admin Course Management**

Update course forms to include student rate field:
```typescript
const courseSchema = z.object({
  titleFr: z.string().min(1),
  slug: z.string().min(1),
  descriptionFr: z.string(),
  studentRateCad: z.number().min(1).max(500), // NEW
  active: z.boolean()
})
```

#### **4. Admin Analytics**

Add margin tracking to revenue reports:
```typescript
export async function getRevenueAnalytics() {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          course: { select: { studentRateCad: true } },
          appointment: {
            include: {
              tutor: { select: { hourlyBaseRateCad: true } }
            }
          }
        }
      }
    }
  })
  
  const analytics = {
    totalStudentRevenue: 0,
    totalTutorCosts: 0,
    grossMargin: 0,
    marginPercent: 0
  }
  
  orders.forEach(order => {
    order.items.forEach(item => {
      const studentPrice = Number(item.lineTotalCad)
      const tutorEarnings = calculateTutorEarnings(
        Number(item.appointment.tutor.hourlyBaseRateCad),
        item.durationMin
      )
      
      analytics.totalStudentRevenue += studentPrice
      analytics.totalTutorCosts += tutorEarnings
    })
  })
  
  analytics.grossMargin = analytics.totalStudentRevenue - analytics.totalTutorCosts
  analytics.marginPercent = (analytics.grossMargin / analytics.totalStudentRevenue) * 100
  
  return analytics
}
```

### **UI Changes Required**

#### **Student-Facing Pages**
- Show `course.studentRateCad` (never show tutor rate)
- Cart displays student prices
- Checkout shows student prices
- Students never see margin

#### **Tutor Dashboard**
- Show `tutor.hourlyBaseRateCad` (their earnings rate)
- Earnings dashboard uses tutor rate
- Tutors never see course rate or margin

#### **Admin Dashboard**
- **Course Management:**
  - Form field for `studentRateCad`
  - Display both rates when viewing course details
  - Show margin potential per course
  
- **Tutor Management:**
  - Edit `hourlyBaseRateCad`
  - Show margin analysis (revenue vs costs per tutor)
  
- **Revenue Analytics:**
  - Student revenue (gross)
  - Tutor costs
  - Gross margin
  - Margin percentage
  - Charts showing all three metrics

### **Testing Checklist**

- [ ] Course rate field appears in admin course form
- [ ] Default course rate is $45.00
- [ ] Students see course rate in cart/checkout
- [ ] Tutors see their earnings rate in dashboard
- [ ] Admin sees both rates and margin
- [ ] Pricing calculations use correct rate per context
- [ ] Revenue analytics show margin correctly
- [ ] Margin percentage calculates correctly
- [ ] Cart totals use course rate
- [ ] Tutor earnings track separately

---

## 2. UI/UX Enhancement with TweakCN

### **What is TweakCN?**

[TweakCN](https://tweakcn.com/) is an enhanced version of shadcn/ui that provides:
- More polished components with better styling
- Built-in animations and transitions
- Modern design patterns
- Advanced components (data tables, charts, etc.)
- Better accessibility out of the box

### **When to Implement**

**IMPORTANT:** This is **Phase 6** - implement AFTER core functionality works:
- ✅ Core booking flow working
- ✅ Payment processing stable
- ✅ Dashboards functional
- ✅ All CRUD operations complete
- ✅ Dual rate system implemented

**Timeline:** 35-50 hours estimated

### **Implementation Strategy**

#### **Phase 6.1.1: Planning (2-3 hours)**
1. Audit current pages
2. Map old components to TweakCN components
3. Design color scheme and branding
4. Create component library

#### **Phase 6.1.2: Setup (1-2 hours)**
1. Install TweakCN
2. Configure Tailwind theme
3. Set up design tokens
4. Test components

#### **Phase 6.1.3-6.1.6: Redesign (28-45 hours)**
See detailed breakdown in CONSOLIDATED_ROADMAP.md Phase 6

### **Pages to Redesign**

1. **Homepage** - Hero, features, testimonials
2. **Course Listing** - Card layouts, filters
3. **Course Detail** - Calendar, slot selection
4. **Cart** - Enhanced cart UI
5. **Checkout** - Multi-step form
6. **Student Dashboard** - Modern cards, stats
7. **Tutor Dashboard** - Professional layout
8. **Admin Dashboard** - Data tables, charts

### **TweakCN Components to Use**

Based on [TweakCN documentation](https://tweakcn.com/):

| Component Type | Use Case | Priority |
|---------------|----------|----------|
| **Enhanced Cards** | Course cards, appointment cards | High |
| **Data Tables** | Admin lists, appointment tables | High |
| **Advanced Forms** | Multi-step checkout | High |
| **Charts** | Revenue analytics | High |
| **Calendars** | Availability, booking | High |
| **Modals** | Cancellation, reschedule | Medium |
| **Badges** | Status indicators | Medium |
| **Tooltips** | Help text, info | Low |

### **Design Principles**

1. **Consistency:** All pages use same design language
2. **Responsiveness:** Mobile-first approach
3. **Accessibility:** WCAG 2.1 AA compliance
4. **Performance:** Smooth 60fps animations
5. **French:** All labels remain in French
6. **Dual Rates:** Show appropriate rates per role

### **Before/After Comparison**

Create screenshots of:
- [ ] Homepage (before/after)
- [ ] Course page (before/after)
- [ ] Cart (before/after)
- [ ] Checkout (before/after)
- [ ] Student dashboard (before/after)
- [ ] Tutor dashboard (before/after)
- [ ] Admin dashboard (before/after)

---

## Implementation Priority

### **Immediate (Phase 0)**
1. ✅ Add dual rate system to database
2. ✅ Update pricing calculations
3. ✅ Update consistency rules

### **Phase 1 (Fix Broken Features)**
1. Fix cart to use course rates
2. Fix checkout to use course rates
3. Fix webhook to track both rates

### **Phase 4 (Admin Features)**
1. Course CRUD with rate management
2. Tutor management with rate editing
3. Revenue analytics with margin tracking

### **Phase 6 (UI Enhancement)**
1. After all core features work
2. Install and configure TweakCN
3. Redesign all pages systematically
4. Test and polish

---

## Success Metrics

### **Dual Rate System**
- [x] Schema updated
- [ ] All pricing uses correct rate
- [ ] Students only see course rate
- [ ] Tutors only see their rate
- [ ] Admin sees both + margin
- [ ] Revenue analytics accurate
- [ ] Margin calculations correct

### **UI Enhancement**
- [ ] All pages use TweakCN components
- [ ] Consistent design language
- [ ] Mobile responsive
- [ ] 60fps animations
- [ ] WCAG 2.1 AA compliant
- [ ] French labels maintained
- [ ] Improved user feedback

---

## Questions to Consider

### **Dual Rate System**
1. Should course rates vary by tutor within same course?
   - **Current:** No, one rate per course
   - **Future:** Could add tutor-specific course rates in V2

2. Can students see different rates for different courses?
   - **Current:** Yes, each course has its own rate

3. What happens if course rate is lower than tutor rate?
   - **Prevention:** Admin UI should warn
   - **Constraint:** Consider adding DB constraint

### **UI Enhancement**
1. Should we do a complete redesign or gradual rollout?
   - **Recommended:** Gradual (page by page)
   - **Benefit:** Can test and get feedback

2. What if TweakCN components break existing functionality?
   - **Mitigation:** Keep old components until new ones tested
   - **Testing:** Thorough QA after each page

3. How to maintain French labels during redesign?
   - **Solution:** Keep using `lib/i18n/fr-CA.ts`
   - **Testing:** Verify all text is French

---

## Next Steps

1. **Review and approve** this implementation plan
2. **Update Prisma schema** with studentRateCad
3. **Run migration** to add column
4. **Update pricing calculator** (dual rate functions)
5. **Fix cart/checkout** to use course rates
6. **Implement admin course CRUD** with rate management
7. **Add revenue analytics** with margin tracking
8. **After core features done:** Start TweakCN integration

---

**Last Updated:** January 2025  
**Status:** Planning complete, ready for implementation

