# Tutor Management Enhancement - Implementation Plan

## Overview
Enhance the Tutor Management tab (Phase 4.3) with detailed earnings tracking, payment management, and availability viewing.

---

## User Requirements Summary

### Tutor Card Display
- **Name & Status**: Display name, active status badge
- **Contact Info**: Email, phone, registration date
- **Profil professionnel Section**:
  - Tarif horaire (hourlyBaseRateCad)
  - Priorité
  - Appointments this month (count)
  - Utilisation (3 months)
  - Earnings this month (completed appointments, not paid)
  - Cumulative earnings this calendar year (all completed appointments)
- **Courses**: List of assigned courses
- **Rating**: Placeholder for future implementation

### Four Action Buttons
1. **Voir disponibilités** - Opens modal showing availability rules, exceptions, time off
2. **Honoraires** - Opens payment management modal
3. **Modifier** - Edit tutor profile (already implemented)
4. **Désactiver** - Deactivate tutor (already implemented)

---

## Payment Workflow Specifications

### Honoraires Modal Structure

#### Tab 1: "Appointments non payés" (Unpaid Appointments)
- **Filter**: Only show completed appointments with `earningsStatus = 'earned'`
- **Grouping**: By calendar month (YYYY-MM), newest first
- **Month Header**: Shows month name, count, total hours, total amount
- **Actions per Month**: "Marquer tout le mois comme payé" button
- **Individual Selection**: Checkboxes for each appointment
- **Sticky Footer**: Shows selection summary (count, hours, amount) + "Marquer sélection comme payé"
- **Mark as Paid Dialog**:
  - Pre-filled with today's date
  - Optional admin note field
  - Shows summary of selected items
  - Success message on confirmation

#### Tab 2: "Historique des paiements" (Payment History)
- **Grouping**: By calendar month/year of payment date
- **Display**: Payment date, count, hours, amount
- **Expandable**: Click to see individual appointments in payment
- **Ordering**: Newest first

---

## Implementation Tasks

### Phase 1: Server Actions (`lib/actions/admin.ts`)

#### 1.1 Fix `getTutorEarningsSummary()`
**Current Issue**: Filters by `paidAt` date instead of appointment completion date

**Changes Needed**:
- Filter by `appointment.status = 'completed'` instead of `paidAt`
- Calculate:
  - Current month: Completed appointments in current month (regardless of payment status)
  - Year-to-date: All completed appointments this year (regardless of payment status)
  - Separate earned vs paid amounts

**New Return Structure**:
```typescript
{
  currentMonth: {
    earned: number,      // Completed but not paid
    paid: number,        // Completed and paid
    totalHours: number,
    appointmentsCount: number
  },
  yearToDate: {
    earned: number,
    paid: number,
    totalHours: number,
    totalEarnings: number  // earned + paid
  }
}
```

#### 1.2 Create `getTutorAvailabilityForAdmin(tutorId: string)`
**Purpose**: Get tutor availability for admin viewing (read-only)

**Returns**:
- Availability rules (weekday, startTime, endTime)
- Availability exceptions (date ranges)
- Time off periods

**Note**: Reuse existing `getTutorAvailability` from `lib/actions/tutor.ts` but create admin version for permission checks

#### 1.3 Create `getTutorUnpaidAppointments(tutorId: string)`
**Purpose**: Get completed but unpaid appointments, grouped by month

**Returns**:
```typescript
Array<{
  month: string,        // "YYYY-MM"
  monthName: string,    // "Janvier 2025"
  appointments: Array<{
    id: string,
    orderItemId: string,
    startDatetime: Date,
    endDatetime: Date,
    course: { titleFr: string },
    hoursWorked: number | null,
    tutorEarningsCad: number,
    rateAtTime: number | null
  }>,
  totalHours: number,
  totalAmount: number
}>
```

**Filter**: 
- `appointment.status = 'completed'`
- `orderItem.earningsStatus = 'earned'`
- Group by `startDatetime` month

#### 1.4 Create `getTutorPaymentHistory(tutorId: string)`
**Purpose**: Get payment history grouped by payment month

**Returns**:
```typescript
Array<{
  paymentMonth: string,   // "YYYY-MM"
  monthName: string,      // "Janvier 2025"
  paidAt: Date,
  appointments: Array<{
    id: string,
    orderItemId: string,
    startDatetime: Date,
    endDatetime: Date,
    course: { titleFr: string },
    hoursWorked: number | null,
    tutorEarningsCad: number,
    paidAt: Date
  }>,
  totalHours: number,
  totalAmount: number
}>
```

**Filter**:
- `orderItem.earningsStatus = 'paid'`
- Group by `paidAt` month
- Order by `paidAt` desc

#### 1.5 Create `markAppointmentsAsPaid(orderItemIds: string[], paidAt: Date, adminNote?: string)`
**Purpose**: Mark multiple appointments as paid

**Validation**:
- All order items must belong to same tutor
- All appointments must be completed
- All must have `earningsStatus = 'earned'`
- `paidAt` cannot be in future
- `paidAt` cannot be before appointment date

**Action**: Update all order items atomically

#### 1.6 Create `getTutorAppointmentsCountThisMonth(tutorId: string)`
**Purpose**: Count completed appointments in current month

**Returns**: Number

---

### Phase 2: Components

#### 2.1 Update `components/admin/tutor-management.tsx`

**Enhanced Tutor Card Structure**:
```tsx
<Card>
  <CardHeader>
    {/* Name, Status, Display Name */}
    {/* Action Buttons: Voir disponibilités, Honoraires, Modifier, Désactiver */}
  </CardHeader>
  <CardContent>
    {/* Contact Info Section */}
    {/* Profil professionnel Section */}
    {/* Courses Section */}
    {/* Rating Placeholder */}
  </CardContent>
</Card>
```

**New Data to Fetch**:
- `getTutorEarningsSummary()` - Fixed version
- `getTutorAppointmentsCountThisMonth()`
- `getTutorUtilization()` - Already exists

**New State**:
- `showAvailabilityModal` - boolean
- `showHonorairesModal` - boolean
- `selectedTutorId` - for modals

#### 2.2 Create `components/admin/tutor-availability-modal.tsx`

**Props**:
```typescript
{
  tutorId: string,
  tutorName: string,
  isOpen: boolean,
  onClose: () => void
}
```

**Display**:
- **Availability Rules Table**:
  - Weekday | Start Time | End Time
  - Weekday names in French
  
- **Availability Exceptions**:
  - Date Range | Status (Available/Unavailable)
  
- **Time Off Periods**:
  - Start Date/Time | End Date/Time

**Note**: Read-only display, no editing

#### 2.3 Create `components/admin/tutor-payments-modal.tsx`

**Props**:
```typescript
{
  tutorId: string,
  tutorName: string,
  isOpen: boolean,
  onClose: () => void,
  onPaymentMarked: () => void  // Refresh parent data
}
```

**State**:
- `activeTab`: 'unpaid' | 'history'
- `selectedAppointments`: Set<string> (orderItemIds)
- `unpaidAppointments`: Grouped by month
- `paymentHistory`: Grouped by payment month
- `loading`: boolean

**Tab 1: Unpaid Appointments**
- Fetch `getTutorUnpaidAppointments(tutorId)`
- Render monthly groups with:
  - Month header with summary
  - "Marquer tout le mois comme payé" button
  - Individual appointment checkboxes
- Sticky footer with selection summary
- "Marquer sélection comme payé" button

**Tab 2: Payment History**
- Fetch `getTutorPaymentHistory(tutorId)`
- Render payment groups
- Expandable details

**Mark as Paid Dialog**:
```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Marquer comme payé</DialogTitle>
  </DialogHeader>
  <DialogContent>
    {/* Summary: Selected count, hours, amount */}
    {/* Date picker: Default to today */}
    {/* Admin note: Optional textarea */}
  </DialogContent>
  <DialogFooter>
    <Button onClick={handleMarkAsPaid}>Confirmer le paiement</Button>
  </DialogFooter>
</Dialog>
```

**Success Handling**:
- Show toast/success message
- Refresh unpaid appointments list
- Refresh payment history
- Call `onPaymentMarked()` to refresh parent

---

### Phase 3: Data Flow

#### 3.1 Tutor Card Data Loading
```typescript
useEffect(() => {
  // Load tutor list
  // For each tutor:
  //   - getTutorEarningsSummary()
  //   - getTutorAppointmentsCountThisMonth()
  //   - getTutorUtilization()
}, [])
```

#### 3.2 Payment Modal Data Loading
```typescript
useEffect(() => {
  if (isOpen && tutorId) {
    // Load unpaid appointments
    getTutorUnpaidAppointments(tutorId)
    // Load payment history
    getTutorPaymentHistory(tutorId)
  }
}, [isOpen, tutorId])
```

---

## Database Considerations

### Existing Fields (Already in Schema)
- `order_items.tutorEarningsCad` ✅
- `order_items.hoursWorked` ✅
- `order_items.rateAtTime` ✅
- `order_items.earningsStatus` ✅ ('earned' | 'paid')
- `order_items.paidAt` ✅
- `order_items.adminNote` ✅
- `appointments.status` ✅ ('scheduled' | 'completed' | 'cancelled' | 'refunded')

### Queries Needed
1. **Completed unpaid appointments**:
   ```sql
   WHERE appointment.status = 'completed'
   AND orderItem.earningsStatus = 'earned'
   ```

2. **Completed paid appointments**:
   ```sql
   WHERE appointment.status = 'completed'
   AND orderItem.earningsStatus = 'paid'
   ```

---

## UI/UX Specifications

### Sticky Footer
- Position: `fixed bottom-0 left-0 right-0` or `sticky bottom-0`
- Background: White with border-top
- Padding: `p-4`
- Shadow: `shadow-lg`
- Content: 
  - Selection count, hours, amount
  - "Marquer sélection comme payé" button (disabled when empty)

### Month Groups
- Border around each month section
- Header with month name and summary stats
- Expandable/collapsible (default: expanded)
- "Marquer tout le mois comme payé" button in header

### Appointment Rows
- Checkbox on left
- Date/time formatted: "DD MMM YYYY, HH:mm"
- Course name
- Duration (hours)
- Amount (CAD)
- Visual distinction: Unpaid vs paid state

### Payment History
- Each payment as card/section
- Click to expand/collapse appointment list
- Show payment date prominently
- Grouped by month of payment date

---

## Implementation Order

1. **Fix `getTutorEarningsSummary()`** - Critical for correct data
2. **Create new server actions** - Foundation for modals
3. **Create Availability Modal** - Simpler, no complex logic
4. **Create Payments Modal** - More complex, requires careful testing
5. **Update TutorManagement component** - Integrate everything
6. **Testing** - End-to-end payment marking workflow

---

## Testing Checklist

### Tutor Card Display
- [ ] All stats display correctly
- [ ] Earnings show earned vs paid separately
- [ ] Appointments count is accurate
- [ ] Utilization calculates correctly

### Availability Modal
- [ ] Shows all availability rules
- [ ] Shows exceptions and time off
- [ ] Read-only (no edit functionality)

### Payments Modal - Unpaid Tab
- [ ] Only shows completed unpaid appointments
- [ ] Groups correctly by month
- [ ] Month summaries are accurate
- [ ] Individual selection works
- [ ] Month selection works
- [ ] Sticky footer updates correctly
- [ ] Mark as paid dialog works
- [ ] Success message appears
- [ ] Data refreshes after payment

### Payments Modal - History Tab
- [ ] Shows payment history correctly
- [ ] Groups by payment month
- [ ] Expandable details work
- [ ] Accurate totals

### Integration
- [ ] Tutor card refreshes after payment
- [ ] Modal closes properly
- [ ] No data inconsistencies

---

## Notes

- All text in French (Canada)
- Currency: CAD only
- Date format: DD/MM/YYYY or "DD MMM YYYY" for display
- Time format: 24-hour (HH:mm)
- Use existing shadcn/ui components
- Follow existing code patterns in project
- Use `formatCurrency()` and `formatDateTime()` utilities

---

## Success Criteria

✅ Tutor earnings show correctly (earned vs paid)
✅ Payment marking works for individual and bulk selections
✅ Payment history is accurate and complete
✅ Availability modal displays all tutor availability data
✅ All UI follows French localization
✅ No data inconsistencies after payment marking
✅ Smooth user experience with proper loading states

