# Make.com Webhook Analysis & Implementation Plan

## Executive Summary

This document provides a comprehensive analysis of all webhook requirements for the 4AS Tutor Booking Application, identifies what's currently implemented, and recommends best practices for managing the webhook system.

---

## Currently Implemented Webhooks

### ✅ 1. Signup Webhook
- **Event Type:** `signup`
- **Location:** `lib/actions/admin.ts` (line 120), `lib/actions/auth.ts` (line 43)
- **Status:** ✅ Fully Implemented
- **Trigger:** Guest checkout account creation, admin-created tutor accounts
- **Function:** `sendSignupWebhook()`

### ✅ 2. Booking Created Webhook
- **Event Type:** `booking.created`
- **Location:** `lib/actions/reservations.ts` (line 121)
- **Status:** ⚠️ **PARTIALLY IMPLEMENTED** - Only for manual reschedules, NOT from Stripe webhook
- **Trigger:** Currently only fires on appointment reschedule (incorrect usage)
- **Function:** `sendBookingWebhook()`
- **Issue:** Stripe webhook has TODO comment (line 294 in `app/api/webhooks/stripe/route.ts`)

### ✅ 3. Message Sent Webhook
- **Event Type:** `message.sent`
- **Location:** `lib/actions/messaging.ts` (line 89)
- **Status:** ✅ Fully Implemented
- **Trigger:** Student sends message to tutor (or vice versa)
- **Function:** `sendMessageWebhook()`

### ✅ 4. Rating Created/Updated Webhook
- **Event Types:** `rating.created`, `rating.updated`
- **Location:** `lib/actions/ratings.ts` (line 96)
- **Status:** ✅ Fully Implemented
- **Trigger:** Student creates or updates rating for tutor
- **Function:** `sendMakeWebhook()` (generic)

### ✅ 5. Support Ticket Webhooks
- **Event Types:** `ticket.created`, `ticket.status_changed`, `ticket.message_added`
- **Location:** `lib/actions/support-tickets.ts`, `lib/actions/admin.ts`
- **Status:** ✅ Fully Implemented
- **Trigger:** 
  - Ticket creation (student)
  - Status changes (admin)
  - Messages added (student/admin)
- **Functions:** `sendTicketCreatedWebhook()`, `sendTicketStatusChangedWebhook()`, `sendTicketMessageWebhook()`

---

## Missing Webhooks (Required Based on Implemented Features)

### 🔴 1. Booking Created (from Stripe Payment Success)
- **Event Type:** `booking.created`
- **Location:** `app/api/webhooks/stripe/route.ts` (line 294 has TODO)
- **Priority:** 🔴 **CRITICAL** - This is the main booking flow
- **Trigger:** After successful payment creates order + appointments
- **Current Status:** ❌ Not implemented
- **Required Data:**
  - Order ID
  - User ID
  - All appointment IDs
  - Course details
  - Tutor details
  - Payment amount
  - Timestamps

### 🔴 2. Booking Cancelled
- **Event Type:** `booking.cancelled`
- **Priority:** 🔴 **HIGH** - Important for notifications
- **Triggers:**
  - Student cancels appointment (`lib/actions/reservations.ts` - needs to be checked)
  - Tutor cancels appointment (tutor actions - needs to be checked)
  - Admin cancels appointment (`lib/actions/admin.ts` - `cancelAppointmentAdmin`, `updateAppointmentStatus`)
- **Current Status:** ❌ Not implemented
- **Required Data:**
  - Appointment ID
  - Cancelled by (student/tutor/admin)
  - Cancellation reason
  - Original booking details
  - Refund/credit information

### 🟡 3. Booking Rescheduled
- **Event Type:** `booking.rescheduled`
- **Location:** `lib/actions/reservations.ts` (line 121)
- **Priority:** 🟡 **MEDIUM**
- **Current Status:** ⚠️ **INCORRECTLY IMPLEMENTED** - Currently sends `booking.created` webhook with wrong type
- **Issue:** Line 122 sends `type: 'appointment_rescheduled'` but should use `booking.rescheduled`
- **Required Data:**
  - Appointment ID
  - Old start/end datetime
  - New start/end datetime
  - Rescheduled by (student/tutor/admin)
  - Reason

### 🟡 4. Appointment Completed
- **Event Type:** `appointment.completed`
- **Priority:** 🟡 **MEDIUM**
- **Triggers:**
  - Auto-completion via scheduled function (`netlify/functions/complete-past-appointments.ts`)
  - Admin marks as completed (`lib/actions/admin.ts` - `updateAppointmentStatus`)
- **Current Status:** ❌ Not implemented
- **Required Data:**
  - Appointment ID
  - Completion timestamp
  - Tutor earnings information

### 🟡 5. Order Refunded
- **Event Type:** `order.refunded`
- **Location:** `lib/actions/admin.ts` (line 3687 - `refundOrder`)
- **Priority:** 🟡 **MEDIUM**
- **Current Status:** ❌ Not implemented
- **Required Data:**
  - Order ID
  - Refund amount
  - Refund reason
  - Stripe refund ID
  - Affected appointments

### 🟢 6. Course Created/Updated
- **Event Types:** `course.created`, `course.updated`, `course.deleted`
- **Location:** `lib/actions/course-management.ts`
- **Priority:** 🟢 **LOW** - Admin operations, less critical
- **Current Status:** ❌ Not implemented
- **Triggers:**
  - Admin creates course (`createCourse`)
  - Admin updates course (`updateCourse`)
  - Admin deletes course (`deleteCourse`)
- **Required Data:**
  - Course ID
  - Course details (title, rate, etc.)
  - Action type (created/updated/deleted)

### 🟢 7. Tutor Created/Updated
- **Event Types:** `tutor.created`, `tutor.updated`, `tutor.rate.updated`
- **Location:** `lib/actions/admin.ts`
- **Priority:** 🟢 **LOW** - Admin operations
- **Current Status:** ❌ Not implemented
- **Triggers:**
  - Admin creates tutor (`createTutorAccount`)
  - Admin updates tutor profile (`updateTutorProfile`)
  - Admin updates tutor rate (`updateTutorProfile` with `hourlyBaseRateCad`)
- **Required Data:**
  - Tutor ID
  - Tutor details
  - Rate changes (if applicable)

### 🟢 8. Tutor Availability Updated
- **Event Type:** `tutor.availability.updated`
- **Priority:** 🟢 **LOW** - Phase 3 feature (not yet implemented)
- **Current Status:** ❌ Not implemented (feature not built yet)
- **Triggers:** (When Phase 3 is implemented)
  - Tutor creates/updates availability rules
  - Tutor creates/updates availability exceptions
  - Tutor creates/updates time off
- **Required Data:**
  - Tutor ID
  - Availability change type
  - New availability details

### 🔴 9. Error Occurred (Error Handling System)
- **Event Type:** `error.occurred`
- **Priority:** 🔴 **CRITICAL** - Part of error handling system
- **Current Status:** ❌ Not implemented (Phase 7.3)
- **Triggers:**
  - All errors (client-side, server-side, API, database)
  - Automatic logging system
- **Required Data:**
  - Error ID
  - Error message
  - Error type (client/server/api/database)
  - Severity (error/warning/critical)
  - User ID (if authenticated)
  - User email (if authenticated)
  - URL (where error occurred)
  - Stack trace (if available)
  - Additional context (request data, etc.)
  - Timestamp
- **Environment Variable:** `MAKE_ERROR_WEBHOOK_URL` (fallback to `MAKE_BOOKING_WEBHOOK_URL`)
- **Note:** All errors trigger webhook for admin notification

---

## Webhook Event Summary Table

| Event Type | Priority | Current Status | Trigger Location | Notes |
|------------|----------|----------------|-----------------|-------|
| `signup` | 🔴 Critical | ✅ Implemented | `lib/actions/admin.ts`, `lib/actions/auth.ts` | Working |
| `booking.created` | 🔴 Critical | ⚠️ Partial | `lib/actions/reservations.ts` | Only fires on reschedule (wrong!). Missing from Stripe webhook |
| `booking.cancelled` | 🔴 High | ❌ Missing | Multiple locations | Need to add to all cancellation points |
| `booking.rescheduled` | 🟡 Medium | ⚠️ Broken | `lib/actions/reservations.ts` | Sends wrong event type |
| `appointment.completed` | 🟡 Medium | ❌ Missing | Auto-completion, admin actions | Need to add |
| `order.refunded` | 🟡 Medium | ❌ Missing | `lib/actions/admin.ts` | Need to add |
| `message.sent` | 🟡 Medium | ✅ Implemented | `lib/actions/messaging.ts` | Working |
| `rating.created` | 🟡 Medium | ✅ Implemented | `lib/actions/ratings.ts` | Working |
| `rating.updated` | 🟡 Medium | ✅ Implemented | `lib/actions/ratings.ts` | Working |
| `ticket.created` | 🟡 Medium | ✅ Implemented | `lib/actions/support-tickets.ts` | Working |
| `ticket.status_changed` | 🟡 Medium | ✅ Implemented | `lib/actions/admin.ts` | Working |
| `ticket.message_added` | 🟡 Medium | ✅ Implemented | `lib/actions/support-tickets.ts` | Working |
| `course.created` | 🟢 Low | ❌ Missing | `lib/actions/course-management.ts` | Admin operation |
| `course.updated` | 🟢 Low | ❌ Missing | `lib/actions/course-management.ts` | Admin operation |
| `course.deleted` | 🟢 Low | ❌ Missing | `lib/actions/course-management.ts` | Admin operation |
| `tutor.created` | 🟢 Low | ❌ Missing | `lib/actions/admin.ts` | Admin operation |
| `tutor.updated` | 🟢 Low | ❌ Missing | `lib/actions/admin.ts` | Admin operation |
| `tutor.rate.updated` | 🟢 Low | ❌ Missing | `lib/actions/admin.ts` | Admin operation |
| `tutor.availability.updated` | 🟢 Low | ❌ Missing | Phase 3 (not built) | Future feature |
| `error.occurred` | 🔴 Critical | ❌ Missing | Error handling system | Phase 7.3 |

---

## Recommended Implementation Strategy

### Phase 1: Critical Fixes (Immediate)
1. **Fix `booking.created` webhook**
   - Add to Stripe webhook handler (`app/api/webhooks/stripe/route.ts` line 294)
   - Remove incorrect webhook call from `rescheduleAppointment`
   - Fire after successful order/appointment creation

2. **Fix `booking.rescheduled` webhook**
   - Update `lib/actions/reservations.ts` line 122
   - Change `type: 'appointment_rescheduled'` to `type: 'booking.rescheduled'`
   - Ensure payload matches expected format

3. **Add `booking.cancelled` webhook**
   - Add to `lib/actions/reservations.ts` (student cancellation)
   - Add to `lib/actions/tutor.ts` (tutor cancellation) - if exists
   - Add to `lib/actions/admin.ts` (`cancelAppointmentAdmin`, `updateAppointmentStatus`)

### Phase 2: Important Features (Next Sprint)
4. **Add `appointment.completed` webhook**
   - Add to auto-completion function (`netlify/functions/complete-past-appointments.ts`)
   - Add to admin status update (`lib/actions/admin.ts`)

5. **Add `order.refunded` webhook**
   - Add to `lib/actions/admin.ts` (`refundOrder` function)

### Phase 3: Nice-to-Have (Lower Priority)
6. Admin operation webhooks (courses, tutors)
7. Availability update webhooks (when Phase 3 feature is built)

---

## Best Practices for Webhook Management

### 1. Centralized Webhook Service
**Recommendation:** Create a unified webhook service that handles:
- Event type validation
- Payload standardization
- Retry logic
- Error logging
- Event recording to database

**Current State:** ✅ Partially implemented in `lib/webhooks/make.ts`
- Has retry logic (3 attempts with exponential backoff)
- Missing: Event recording to `webhook_events` table
- Missing: Standardized payload format validation

### 2. Event Recording
**Recommendation:** Record all webhook attempts in `webhook_events` table
- Source: `'make'` (distinct from `'stripe'`)
- Type: Event type (e.g., `booking.created`)
- Payload: Full JSON payload
- Status: Success/failure
- Attempt count: Track retries

**Current State:** ⚠️ Only Stripe webhooks are recorded

### 3. Webhook Payload Standardization
**Recommendation:** Create TypeScript interfaces for each webhook payload type to ensure consistency:

```typescript
interface BookingCreatedPayload {
  type: 'booking.created'
  order_id: string
  user_id: string
  currency: string
  subtotal_cad: number
  discount_cad: number
  total_cad: number
  items: Array<{
    appointment_id: string
    course_id: string
    course_title_fr: string
    tutor_id: string
    tutor_name: string
    start_datetime: string
    duration_min: number
    price_cad: number
  }>
  created_at: string
}
```

### 4. Environment Variable Management
**Recommendation:** Use consistent naming pattern:
- `MAKE_SIGNUP_WEBHOOK_URL`
- `MAKE_BOOKING_WEBHOOK_URL`
- `MAKE_CANCELLATION_WEBHOOK_URL`
- `MAKE_RESCHEDULE_WEBHOOK_URL`
- `MAKE_MESSAGE_WEBHOOK_URL`
- `MAKE_RATING_WEBHOOK_URL`
- `MAKE_TICKET_WEBHOOK_URL`
- `MAKE_REFUND_WEBHOOK_URL`
- `MAKE_ADMIN_WEBHOOK_URL` (for admin operations - optional)

**Current State:** ⚠️ Mixed - some use fallbacks, some don't

### 5. Error Handling & Retry Strategy
**Recommendation:** Enhance current retry logic:
- ✅ Already has exponential backoff (good)
- Add: Dead letter queue for permanently failed webhooks
- Add: Admin notification for repeated failures
- Add: Rate limiting to prevent Make.com overload

### 6. Webhook Testing Strategy
**Recommendation:**
- Create a test webhook endpoint that logs all payloads
- Use Make.com webhook testing tools
- Test webhook failures and retries
- Monitor webhook delivery success rate

### 7. Idempotency
**Recommendation:** Ensure webhooks are idempotent:
- Include unique event ID in payload
- Make.com should handle duplicate events gracefully
- Log event IDs to prevent duplicate processing

---

## Implementation Priority

### 🔴 Critical (Fix Immediately)
1. Fix `booking.created` webhook in Stripe handler
2. Fix `booking.rescheduled` webhook type
3. Add `booking.cancelled` webhook to all cancellation points

### 🟡 High Priority (This Sprint)
4. Add `appointment.completed` webhook
5. Add `order.refunded` webhook
6. Enhance webhook service with event recording

### 🟢 Medium Priority (Next Sprint)
7. Standardize webhook payloads with TypeScript interfaces
8. Add admin operation webhooks (courses, tutors)
9. Improve error handling and dead letter queue

### ⚪ Low Priority (Future)
10. Add availability update webhooks (when Phase 3 feature is built)
11. Webhook analytics dashboard
12. Automated webhook testing

---

## Code Locations Summary

### Webhook Functions (`lib/webhooks/make.ts`)
- `sendMakeWebhook()` - Generic webhook sender with retry
- `sendSignupWebhook()` - ✅ Implemented
- `sendMessageWebhook()` - ✅ Implemented
- `sendBookingWebhook()` - ✅ Implemented (but usage incorrect)
- `sendTicketCreatedWebhook()` - ✅ Implemented
- `sendTicketStatusChangedWebhook()` - ✅ Implemented
- `sendTicketMessageWebhook()` - ✅ Implemented

### Trigger Points
- **Signup:** `lib/actions/admin.ts:120`, `lib/actions/auth.ts:43`
- **Booking Created:** `lib/actions/reservations.ts:121` (WRONG - should be in Stripe webhook)
- **Booking Rescheduled:** `lib/actions/reservations.ts:121` (WRONG TYPE)
- **Messages:** `lib/actions/messaging.ts:89`
- **Ratings:** `lib/actions/ratings.ts:96`
- **Tickets:** `lib/actions/support-tickets.ts`, `lib/actions/admin.ts`

### Missing Triggers
- **Stripe Payment Success:** `app/api/webhooks/stripe/route.ts:294` (TODO comment)
- **Cancellations:** Multiple locations need webhook calls
- **Refunds:** `lib/actions/admin.ts:3687` (`refundOrder`)
- **Appointment Completion:** `netlify/functions/complete-past-appointments.ts`, `lib/actions/admin.ts`
- **Admin Operations:** `lib/actions/course-management.ts`, `lib/actions/admin.ts` (tutor management)

---

## Next Steps

1. **Review this document** with team
2. **Prioritize webhook implementation** based on business needs
3. **Create implementation tickets** for each missing webhook
4. **Set up webhook testing environment** in Make.com
5. **Implement centralized webhook service enhancements**
6. **Add webhook event recording** to database
7. **Document webhook payload formats** for Make.com integration

---

## Environment Variables Required

### Required Variables (Minimum Configuration)

```bash
# Core Booking Events
MAKE_SIGNUP_WEBHOOK_URL=https://hook.make.com/your-signup-webhook-url
MAKE_BOOKING_WEBHOOK_URL=https://hook.make.com/your-booking-webhook-url
MAKE_CANCELLATION_WEBHOOK_URL=https://hook.make.com/your-cancellation-webhook-url
MAKE_MESSAGE_WEBHOOK_URL=https://hook.make.com/your-message-webhook-url
```

### Optional Variables (Use Fallbacks if Not Set)

```bash
# Additional Booking Events (fallback to MAKE_BOOKING_WEBHOOK_URL)
MAKE_RESCHEDULE_WEBHOOK_URL=https://hook.make.com/your-reschedule-webhook-url
MAKE_COMPLETION_WEBHOOK_URL=https://hook.make.com/your-completion-webhook-url
MAKE_REFUND_WEBHOOK_URL=https://hook.make.com/your-refund-webhook-url

# Reviews & Support (fallback to MAKE_BOOKING_WEBHOOK_URL)
MAKE_RATING_WEBHOOK_URL=https://hook.make.com/your-rating-webhook-url
MAKE_TICKET_WEBHOOK_URL=https://hook.make.com/your-ticket-webhook-url

# Admin Operations (fallback to MAKE_BOOKING_WEBHOOK_URL, not recorded in DB)
MAKE_ADMIN_WEBHOOK_URL=https://hook.make.com/your-admin-webhook-url
```

### Complete List (All Variables)

| Variable Name | Event Types | Fallback | Required |
|--------------|-------------|----------|----------|
| `MAKE_SIGNUP_WEBHOOK_URL` | `signup` | None | ✅ Yes |
| `MAKE_BOOKING_WEBHOOK_URL` | `booking.created` | None | ✅ Yes |
| `MAKE_CANCELLATION_WEBHOOK_URL` | `booking.cancelled` | None | ✅ Yes |
| `MAKE_MESSAGE_WEBHOOK_URL` | `message.sent` | None | ✅ Yes |
| `MAKE_RESCHEDULE_WEBHOOK_URL` | `booking.rescheduled` | `MAKE_BOOKING_WEBHOOK_URL` | ⚪ No |
| `MAKE_COMPLETION_WEBHOOK_URL` | `appointment.completed` | `MAKE_BOOKING_WEBHOOK_URL` | ⚪ No |
| `MAKE_REFUND_WEBHOOK_URL` | `order.refunded` | `MAKE_BOOKING_WEBHOOK_URL` | ⚪ No |
| `MAKE_RATING_WEBHOOK_URL` | `rating.created`, `rating.updated` | `MAKE_BOOKING_WEBHOOK_URL` | ⚪ No |
| `MAKE_TICKET_WEBHOOK_URL` | `ticket.created`, `ticket.status_changed`, `ticket.message_added` | `MAKE_BOOKING_WEBHOOK_URL` | ⚪ No |
| `MAKE_ADMIN_WEBHOOK_URL` | `course.*`, `tutor.*` (admin operations) | `MAKE_BOOKING_WEBHOOK_URL` | ⚪ No |
| `MAKE_ERROR_WEBHOOK_URL` | `error.occurred` | `MAKE_BOOKING_WEBHOOK_URL` | ⚪ No |

**Note:** If optional variables are not set, the system will use `MAKE_BOOKING_WEBHOOK_URL` as fallback. Webhooks will be skipped silently if no URL is configured and no fallback exists.

### Error Webhook Details

**Event Type:** `error.occurred`

**Purpose:** Notify admins of all application errors for monitoring and debugging.

**Payload Format:**
```typescript
{
  type: 'error.occurred',
  payload: {
    error_id: string,           // Unique error ID
    message: string,            // Error message
    error_type: string,         // 'client' | 'server' | 'api' | 'database'
    severity: string,           // 'error' | 'warning' | 'critical'
    user_id?: string,          // User ID if authenticated
    user_email?: string,       // User email if authenticated
    url?: string,              // URL where error occurred
    stack?: string,            // Stack trace (if available)
    context?: object,          // Additional context
    timestamp: string          // ISO timestamp
  },
  event_id: string,
  sent_at: string
}
```

**Triggered By:**
- Client-side errors (React errors, unhandled exceptions)
- Server-side errors (Server Actions, API routes)
- Database errors
- External API failures

**Retention:** Errors logged to database for 90 days, then auto-cleaned up.

---


