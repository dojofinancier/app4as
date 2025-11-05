# Phase 7.2 Security Hardening - Implementation Plan

## Current Security Status

### ✅ Already Implemented
1. **Stripe Webhook Signature Verification** - ✅ Working in `app/api/webhooks/stripe/route.ts`
2. **File Upload Validation** - ✅ Basic validation (32MB limit, allowed types) in `lib/actions/file-upload.ts`
3. **File Name Sanitization** - ✅ Basic sanitization for file paths
4. **Zod Form Validation** - ✅ Partial (some forms use zod, not all)
5. **Prisma ORM** - ✅ Prevents SQL injection by default
6. **RLS Policies** - ✅ Consolidated and optimized (Phase 7.1)

### ⚠️ Needs Implementation
1. **Rate Limiting** - ❌ Not implemented
2. **CSRF Protection** - ⚠️ Next.js provides some, but API routes need explicit protection
3. **Input Sanitization** - ⚠️ Partial (some forms, not comprehensive)
4. **XSS Prevention** - ⚠️ Basic (file names), needs comprehensive review
5. **Environment Variable Validation** - ❌ Not implemented
6. **RLS Policy Audit** - ⚠️ Security advisor found issues:
   - RLS disabled on `tutor_course_requests` table
   - Mutable search_path on functions (`get_user_role`, `is_admin`, `is_tutor`)
   - Leaked password protection disabled in Supabase Auth

---

## Implementation Plan

### **Priority 1: Critical Security Issues (4-6 hours)**

#### 1.1 Fix RLS Policy Issues
**Status:** 🔴 CRITICAL - Found by Supabase Security Advisor

**Issues:**
- `tutor_course_requests` table has RLS disabled
- Functions have mutable search_path (security risk)

**Tasks:**
- [ ] Enable RLS on `tutor_course_requests` table
- [ ] Create RLS policies for `tutor_course_requests` (tutors can create, admins can view all)
- [ ] Fix mutable search_path on functions:
  - `get_user_role()` - Set `search_path = ''`
  - `is_admin()` - Set `search_path = ''`
  - `is_tutor()` - Set `search_path = ''`
- [ ] Enable leaked password protection in Supabase Auth settings

**Files to Create/Modify:**
- `prisma/rls-policies-tutor-course-requests.sql` (NEW)
- `prisma/fix-function-search-path.sql` (NEW)

**Migration Name:** `fix_rls_security_issues`

**Acceptance Criteria:**
- All public tables have RLS enabled
- All functions have immutable search_path
- Leaked password protection enabled
- Security advisor shows no RLS errors

---

#### 1.2 Environment Variable Validation
**Status:** 🔴 CRITICAL - Prevents misconfiguration

**Tasks:**
- [ ] Create `lib/utils/env-validation.ts` with Zod schema for all env vars
- [ ] Validate on app startup (Next.js config or root layout)
- [ ] Fail fast with clear error messages if required vars missing
- [ ] Document all required vs optional env vars

**Files to Create:**
- `lib/utils/env-validation.ts` (NEW)

**Environment Variables to Validate:**
```typescript
// Required
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

// Optional (with defaults)
MAKE_SIGNUP_WEBHOOK_URL
MAKE_BOOKING_WEBHOOK_URL
NEXT_PUBLIC_APP_URL
```

**Acceptance Criteria:**
- App fails to start if required env vars missing
- Clear error messages in French
- Validation happens before any routes are accessible

---

### **Priority 2: Rate Limiting (3-4 hours)**

#### 2.1 Implement Rate Limiting for API Routes
**Status:** 🔴 HIGH PRIORITY - Prevents abuse

**Strategy:**
- Use in-memory rate limiting for Netlify (no Redis needed for V1)
- Different limits for different endpoints
- Stricter limits for authentication endpoints
- IP-based and user-based rate limiting

**Tasks:**
- [ ] Install `@upstash/ratelimit` or create simple in-memory rate limiter
- [ ] Create `lib/utils/rate-limit.ts` utility
- [ ] Apply rate limiting to:
  - Authentication endpoints (signup, signin): 5 requests/min per IP
  - Payment endpoints: 10 requests/min per user
  - API routes: 60 requests/min per IP
  - Webhooks: No rate limit (signature verification sufficient)
- [ ] Return 429 status with Retry-After header

**Files to Create:**
- `lib/utils/rate-limit.ts` (NEW)

**Files to Modify:**
- `app/api/*/route.ts` - Add rate limiting middleware
- `middleware.ts` - Add rate limiting for API routes

**Rate Limit Configuration:**
```typescript
// Authentication endpoints
AUTH_RATE_LIMIT = 5 requests / minute per IP

// Payment endpoints
PAYMENT_RATE_LIMIT = 10 requests / minute per user

// General API routes
API_RATE_LIMIT = 60 requests / minute per IP

// Public endpoints (course listing, etc.)
PUBLIC_RATE_LIMIT = 100 requests / minute per IP
```

**Acceptance Criteria:**
- Rate limiting prevents abuse
- Legitimate users not affected
- Clear error messages (429 status)
- Retry-After header included

---

### **Priority 3: CSRF Protection (2-3 hours)**

#### 3.1 CSRF Protection for API Routes
**Status:** 🟡 MEDIUM PRIORITY - Next.js Server Actions have built-in CSRF, but API routes need explicit protection

**Tasks:**
- [ ] Verify Next.js CSRF protection for Server Actions (already built-in)
- [ ] Add CSRF token validation for API routes that accept POST/PUT/DELETE
- [ ] Implement CSRF token generation/validation utility
- [ ] Exempt webhook endpoints (use signature verification instead)

**Files to Create:**
- `lib/utils/csrf.ts` (NEW)

**Files to Modify:**
- `app/api/*/route.ts` - Add CSRF validation for state-changing operations
- Exempt: `app/api/webhooks/*` (use signature verification)

**Strategy:**
- Next.js Server Actions already have CSRF protection ✅
- For API routes, add CSRF token check (optional for V1, can defer)
- Webhooks use signature verification (already secure) ✅

**Acceptance Criteria:**
- Server Actions protected (already by Next.js)
- API routes that modify data have CSRF protection
- Webhooks exempted (signature verification sufficient)

---

### **Priority 4: Input Sanitization & XSS Prevention (4-5 hours)**

#### 4.1 Comprehensive Input Validation
**Status:** 🟡 MEDIUM PRIORITY - Some validation exists, needs expansion

**Tasks:**
- [ ] Review all Server Actions for input validation
- [ ] Add Zod schemas to all Server Actions that accept user input
- [ ] Sanitize text inputs (remove HTML tags)
- [ ] Validate URLs (meeting links, file paths)
- [ ] Validate email addresses (already done in forms, verify server-side)
- [ ] Validate phone numbers (already done in forms, verify server-side)

**Files to Create:**
- `lib/utils/sanitization.ts` (NEW) - Text sanitization utilities
- `lib/utils/validation.ts` (NEW) - Reusable validation schemas

**Files to Modify:**
- `lib/actions/*.ts` - Add Zod validation to all actions
- Review all form submissions for proper validation

**Validation Requirements:**
```typescript
// Text fields
- Max length validation
- HTML tag stripping
- Special character validation where needed

// URLs
- Valid URL format
- HTTPS only for external links
- No javascript: or data: protocols

// Email
- Valid email format
- Max length (RFC 5321: 254 characters)

// Phone
- Canadian phone format validation
- Sanitization (remove spaces, dashes)

// File names
- Already sanitized (replace non-alphanumeric)
- Path traversal prevention (already done)
```

**Acceptance Criteria:**
- All user inputs validated with Zod
- Text inputs sanitized (no HTML/script tags)
- URLs validated before storage
- No XSS vulnerabilities in user-generated content

---

#### 4.2 XSS Prevention Review
**Status:** 🟡 MEDIUM PRIORITY - Need comprehensive review

**Tasks:**
- [ ] Audit all places where user input is rendered
- [ ] Ensure React escapes content by default (already does)
- [ ] Review any `dangerouslySetInnerHTML` usage (should be none)
- [ ] Verify file name sanitization in storage paths
- [ ] Review message content rendering
- [ ] Review support ticket content rendering
- [ ] Review rating comments rendering

**Files to Review:**
- `components/messaging/*` - Message rendering
- `components/dashboard/*` - User-generated content display
- `components/admin/*` - Admin content display

**Acceptance Criteria:**
- No `dangerouslySetInnerHTML` usage
- All user content properly escaped
- File paths sanitized
- No XSS vulnerabilities found

---

### **Priority 5: Secure File Upload Enhancement (2-3 hours)**

#### 5.1 Enhanced File Upload Security
**Status:** 🟡 MEDIUM PRIORITY - Basic validation exists, needs enhancement

**Current Implementation:**
- ✅ File size validation (32MB max)
- ✅ File type validation (extension + MIME type)
- ✅ File name sanitization

**Enhancements Needed:**
- [ ] Add MIME type verification (not just extension)
- [ ] Scan files for malicious content (basic checks)
- [ ] Virus scanning (optional for V1, can defer)
- [ ] File content validation (verify file matches extension)
- [ ] Rate limiting per user for file uploads (5 files/min)

**Files to Modify:**
- `lib/actions/file-upload.ts`
- `lib/actions/ticket-attachments.ts`
- `components/messaging/file-upload*.tsx`

**Enhancements:**
```typescript
// MIME type verification
- Verify file content matches declared MIME type
- Reject files with mismatched MIME/extensions

// File content validation
- PDF: Verify PDF header
- Images: Verify image headers
- DOCX: Verify ZIP structure (DOCX is a ZIP)

// Rate limiting
- 5 file uploads per minute per user
- Prevent abuse
```

**Acceptance Criteria:**
- Files validated beyond extension
- MIME type matches file content
- Rate limiting prevents abuse
- No malicious files can be uploaded

---

### **Priority 6: Additional Security Hardening (2-3 hours)**

#### 6.1 Security Headers
**Status:** 🟢 LOW PRIORITY - Good practice

**Tasks:**
- [ ] Add security headers in `next.config.js`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (basic)
- [ ] Configure Netlify headers via `netlify.toml`

**Files to Modify:**
- `next.config.js`
- `netlify.toml`

**Acceptance Criteria:**
- Security headers set correctly
- CSP configured (basic policy)
- Headers verified in production

---

#### 6.2 Audit Logging
**Status:** 🟢 LOW PRIORITY - Good practice

**Tasks:**
- [ ] Log security-relevant events:
  - Failed authentication attempts
  - Rate limit violations
  - Invalid CSRF tokens
  - File upload rejections
  - Admin actions (already partially done)
- [ ] Store in database or log service
- [ ] Alert on suspicious patterns (future enhancement)

**Files to Create:**
- `lib/utils/audit-log.ts` (NEW)

**Acceptance Criteria:**
- Security events logged
- Logs accessible for review
- No performance impact

---

## Implementation Order

### Week 1: Critical Issues
1. **Fix RLS Policy Issues** (1.1) - 2 hours
2. **Environment Variable Validation** (1.2) - 2 hours
3. **Rate Limiting** (2.1) - 3-4 hours

### Week 2: Input Security
4. **Input Sanitization** (4.1) - 4-5 hours
5. **XSS Prevention Review** (4.2) - 2-3 hours
6. **Enhanced File Upload Security** (5.1) - 2-3 hours

### Week 3: Additional Hardening
7. **CSRF Protection** (3.1) - 2-3 hours (optional, can defer)
8. **Security Headers** (6.1) - 1 hour
9. **Audit Logging** (6.2) - 2 hours

---

## Security Testing Checklist

After implementation, verify:

- [ ] All RLS policies tested per role (student/tutor/admin)
- [ ] Rate limiting prevents abuse without blocking legitimate users
- [ ] File uploads validated (size, type, content)
- [ ] No XSS vulnerabilities in user-generated content
- [ ] Input validation prevents injection attacks
- [ ] Environment variables validated on startup
- [ ] Security headers configured correctly
- [ ] Webhook signature verification working
- [ ] CSRF protection active (Server Actions)
- [ ] Audit logging functional

---

## Estimated Total Time

**Critical & High Priority:** 10-13 hours
**Medium Priority:** 8-11 hours
**Low Priority:** 5 hours

**Total:** 23-29 hours

---

## Notes

1. **Next.js Server Actions** already have CSRF protection built-in, so explicit CSRF tokens may not be needed for Server Actions
2. **Prisma** prevents SQL injection by default, but always use parameterized queries
3. **React** escapes content by default, preventing most XSS attacks
4. **Supabase Auth** handles password security, but we should enable leaked password protection
5. **Rate limiting** can start simple (in-memory) and upgrade to Redis later if needed
6. **File scanning** (virus scanning) can be deferred to V2 if needed

---

## References

- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Webhook Security](https://stripe.com/docs/webhooks/signatures)

