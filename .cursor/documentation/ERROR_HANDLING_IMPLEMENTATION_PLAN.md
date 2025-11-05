# Error Handling & Logging - Implementation Plan

## User Preferences Summary

Based on your answers:

1. **Error Boundaries:** Moderate (major sections)
2. **Error Logging:** Database (store errors in DB)
3. **Error Recovery:**
   - Retry buttons: ❌ No
   - Automatic retry: ✅ Yes
   - Fallback data: ❌ No
   - Offline handling: ✅ Yes
4. **Admin Notifications:** Make.com webhook (added to webhook analysis)
5. **Error Messages:** Show contact support email (support@carredastutorat.com)
6. **Critical Notifications:** All errors
7. **Database Logging:** Store message, user ID, stack for 90 days. Log user data.

---

## Implementation Plan

### Phase 1: Database Schema & Error Logging Service

#### 1.1 Add Error Log Model to Prisma Schema
**File:** `prisma/schema.prisma`

**Model:**
```prisma
model ErrorLog {
  id          String   @id @default(uuid())
  message     String   @db.Text
  stack       String?  @db.Text
  userId      String?  @map("user_id")
  errorType   String   @map("error_type") // 'client', 'server', 'api', 'database', etc.
  severity    String   @default("error") // 'error', 'warning', 'critical'
  context     Json?    // Additional context (URL, request data, etc.)
  userAgent   String?  @map("user_agent") @db.Text
  url         String?
  createdAt   DateTime @default(now()) @map("created_at")
  
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([errorType])
  @@index([severity])
  @@index([createdAt])
  @@map("error_logs")
}
```

**Migration:** `add_error_logging_schema`

---

#### 1.2 Create Error Logging Service
**File:** `lib/utils/error-logging.ts` (NEW)

**Features:**
- Log errors to database
- Automatic cleanup (90 days retention)
- Send Make.com webhook for all errors
- Support for client-side and server-side errors
- Context capture (URL, user agent, etc.)

---

#### 1.3 Add Error Webhook to Make.com
**Update:** `lib/webhooks/make.ts`

**New Event Type:** `error.occurred`

**Payload:**
```typescript
{
  error_id: string
  message: string
  error_type: string
  severity: string
  user_id?: string
  user_email?: string
  url?: string
  context?: object
  timestamp: string
}
```

**Environment Variable:** `MAKE_ERROR_WEBHOOK_URL` (fallback to `MAKE_BOOKING_WEBHOOK_URL`)

---

### Phase 2: Error Boundaries (Moderate Approach)

#### 2.1 Create Error Boundary Component
**File:** `components/error-boundary.tsx` (NEW)

**Features:**
- Catch React errors
- Show user-friendly error message in French
- Display support email (support@carredastutorat.com)
- Log error to database
- Reset button (reload page)

---

#### 2.2 Wrap Major Sections

**Sections to Wrap:**
1. **Dashboard Layout** - Wrap student/tutor/admin dashboards
2. **Booking Flow** - Wrap cart, checkout, payment pages
3. **Public Pages** - Wrap course listing, course detail pages
4. **Root Layout** - Global fallback (optional)

**Files to Modify:**
- `app/tableau-de-bord/page.tsx` - Wrap dashboard
- `app/panier/page.tsx` - Wrap cart
- `app/checkout/page.tsx` - Wrap checkout
- `app/cours/page.tsx` - Wrap course listing
- `app/cours/[slug]/page.tsx` - Wrap course detail

---

### Phase 3: Automatic Retry Logic

#### 3.1 Create Retry Utility
**File:** `lib/utils/retry.ts` (NEW)

**Features:**
- Exponential backoff
- Configurable retry attempts
- Different retry strategies per operation type
- Network error detection

---

#### 3.2 Apply to API Calls
**Files to Modify:**
- Components that fetch data
- Server Actions that make external calls
- API route handlers (optional)

---

### Phase 4: Offline Detection

#### 4.1 Create Offline Detection Hook
**File:** `lib/hooks/use-offline.ts` (NEW)

**Features:**
- Detect offline state
- Show offline indicator
- Queue failed requests (optional)
- Retry when back online

---

#### 4.2 Add Offline UI
**Components:**
- Offline banner/indicator
- Show offline state in forms
- Disable actions when offline

---

### Phase 5: Error Message Enhancement

#### 5.1 Update Error Messages
**Changes:**
- Add support email to all error messages
- Include error ID for support tickets
- Categorize errors (network, validation, server, etc.)
- Show generic errors in production, detailed in development

---

### Phase 6: Integration

#### 6.1 Integrate Error Logging
- Update Server Actions to use error logging service
- Update API routes to use error logging service
- Add client-side error logging (global error handler)

---

#### 6.2 Update Webhook Analysis
**File:** `.cursor/WEBHOOK_ANALYSIS.md`

**Add:**
- `error.occurred` webhook documentation
- Environment variable: `MAKE_ERROR_WEBHOOK_URL`
- Payload format

---

## Implementation Order

1. **Database Schema** (15 min)
   - Add ErrorLog model
   - Run migration

2. **Error Logging Service** (1-2 hours)
   - Create service
   - Add cleanup function
   - Add Make.com webhook integration

3. **Error Boundaries** (2-3 hours)
   - Create component
   - Wrap major sections

4. **Automatic Retry** (1-2 hours)
   - Create retry utility
   - Apply to critical operations

5. **Offline Detection** (1 hour)
   - Create hook
   - Add UI indicators

6. **Error Message Enhancement** (1 hour)
   - Update error messages
   - Add support email

7. **Integration** (2-3 hours)
   - Integrate logging into existing code
   - Update webhook analysis

**Total Estimated Time:** 8-12 hours

---

## Files to Create

1. `prisma/schema.prisma` - Add ErrorLog model
2. `lib/utils/error-logging.ts` - Error logging service
3. `lib/utils/retry.ts` - Retry utility
4. `lib/hooks/use-offline.ts` - Offline detection hook
5. `components/error-boundary.tsx` - Error boundary component
6. `components/offline-indicator.tsx` - Offline UI component

---

## Files to Modify

1. `lib/webhooks/make.ts` - Add error webhook function
2. `.cursor/WEBHOOK_ANALYSIS.md` - Add error webhook documentation
3. `app/tableau-de-bord/page.tsx` - Wrap with error boundary
4. `app/panier/page.tsx` - Wrap with error boundary
5. `app/checkout/page.tsx` - Wrap with error boundary
6. `app/cours/page.tsx` - Wrap with error boundary
7. `app/cours/[slug]/page.tsx` - Wrap with error boundary
8. Server Actions - Add error logging
9. API routes - Add error logging

---

## Next Steps

Should I proceed with implementation? I'll start with:
1. Database schema
2. Error logging service
3. Error boundaries
4. Then continue with the rest

