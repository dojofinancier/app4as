# Rate Limiting Implementation Summary

## ✅ Completed: Step 2.1 - Rate Limiting for API Routes

**Date:** January 2025  
**Approach:** In-memory rate limiting (simple, effective for Netlify serverless)

---

## Implementation

### Created Utility
**File:** `lib/utils/rate-limit.ts`

**Features:**
- In-memory Map-based storage (works for Netlify serverless)
- Automatic cleanup of expired entries (prevents memory leaks)
- Supports both IP-based and user-based rate limiting
- Returns proper HTTP 429 status with Retry-After header
- Rate limit headers included in responses

### Rate Limit Configurations

```typescript
AUTH: 5 requests / minute (per IP)
  - For authentication endpoints (currently via Server Actions, not API routes)

PAYMENT: 10 requests / minute (per user/IP)
  - Payment intent creation
  - Payment confirmation
  - Strict limit to prevent payment abuse

API: 60 requests / minute (per user/IP)
  - General API routes
  - Cart operations
  - Moderate limit for normal usage

PUBLIC: 100 requests / minute (per IP)
  - Public endpoints (course availability, etc.)
  - Lenient limit for read-only operations
```

---

## Routes Protected

### Payment Endpoints (10 requests/min)
1. **`/api/checkout/create-payment-intent`**
   - User-based rate limiting (if authenticated)
   - Falls back to IP-based if not authenticated

2. **`/api/create-payment-intent`**
   - User-based rate limiting (if authenticated)
   - Falls back to IP-based if not authenticated

3. **`/api/checkout/confirm-payment-with-password`**
   - IP-based rate limiting (guest checkout)

### General API Routes (60 requests/min)
4. **`/api/cart/add`**
   - User-based rate limiting (if authenticated)
   - Falls back to IP-based if not authenticated

### Public Endpoints (100 requests/min)
5. **`/api/course-availability`** (GET & POST)
   - IP-based rate limiting
   - Lenient limit for calendar queries

---

## How It Works

### Identifier Selection
1. **User-based** (preferred): Uses `user:${userId}` if user is authenticated
2. **IP-based** (fallback): Uses `ip:${ipAddress}` from `x-forwarded-for` or `x-real-ip` headers

### Rate Limit Check Flow
```
1. Request comes in
2. Extract identifier (user ID or IP)
3. Check current rate limit data
4. If window expired → reset counter
5. If within limit → increment counter and allow
6. If exceeded → return 429 with Retry-After header
```

### Response Headers
When rate limited, response includes:
- `429 Too Many Requests` status
- `Retry-After: <seconds>` header
- `X-RateLimit-Limit: <max>` header
- `X-RateLimit-Remaining: 0` header
- `X-RateLimit-Reset: <timestamp>` header

---

## Example Response

**Rate Limited Request:**
```json
{
  "error": "Trop de requêtes. Veuillez réessayer plus tard.",
  "retryAfter": 45
}
```

**Headers:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
```

---

## Memory Management

- **Automatic Cleanup**: Expired entries cleaned up every 5 minutes
- **Memory Efficient**: Only stores active rate limit data
- **Serverless-Friendly**: Works with Netlify's serverless architecture
- **No External Dependencies**: Pure in-memory solution

---

## Notes

### Authentication Endpoints
- Authentication is handled via Server Actions (not API routes)
- Rate limiting for auth would need to be added to Server Actions if needed
- Supabase Auth may have its own rate limiting

### Webhooks
- **Not rate limited** - Webhooks use signature verification (Stripe)
- Signature verification is sufficient security

### Future Enhancements
- For production at scale, consider upgrading to:
  - Redis-based rate limiting (distributed)
  - Upstash Rate Limit (serverless Redis)
  - Cloudflare Rate Limiting

---

## Files Modified

1. `lib/utils/rate-limit.ts` - Created rate limiting utility
2. `app/api/checkout/create-payment-intent/route.ts` - Added PAYMENT limit
3. `app/api/create-payment-intent/route.ts` - Added PAYMENT limit
4. `app/api/checkout/confirm-payment-with-password/route.ts` - Added PAYMENT limit
5. `app/api/cart/add/route.ts` - Added API limit
6. `app/api/course-availability/route.ts` - Added PUBLIC limit (GET & POST)

---

## Testing

To test rate limiting:
1. Make rapid requests to a protected endpoint
2. After exceeding the limit, you should receive 429 status
3. Wait for the window to reset (check Retry-After header)
4. Requests should work again after reset

---

## Benefits

✅ **Prevents Abuse** - Stops brute force attacks and API abuse  
✅ **Protects Resources** - Prevents server overload  
✅ **User-Friendly** - Clear error messages in French  
✅ **Standards Compliant** - Proper HTTP 429 status and headers  
✅ **Netlify-Compatible** - Works with serverless architecture  
✅ **Memory Efficient** - Automatic cleanup prevents memory leaks  

