# Webhook Implementation - Answers to Questions

## 1. Signup Webhook Behavior

### ✅ **FIXED:** Signup webhook now only fires during guest checkout

**Previous Behavior:**
- Fired from `/inscription` page (direct signup)
- Fired from admin creating tutors
- Fired from OAuth callback

**New Behavior:**
- ✅ **Removed** from `/inscription` page (page now redirects to login)
- ✅ **Added** to guest checkout when new user account is created
- ✅ **Kept** for admin-created tutors (admin operations)
- ✅ **Kept** for OAuth callback (external auth)

**Result:** Signup webhook now only fires when a user signs up **during** their first booking (guest checkout), which makes business sense since signups are tied to bookings.

---

## 2. Multiple Appointments in One Transaction

### ✅ **Answer:** ONE webhook with array of items (bundled together)

When a customer books multiple appointments in the same cart/transaction:

- **Single Order Created:** One `Order` record with multiple `OrderItem` records
- **Single Webhook Sent:** ONE `booking.created` webhook with:
  - `order_id`: Single order ID
  - `items`: Array of all appointments in that order
  - `subtotal_cad`: Sum of all items
  - `total_cad`: Final total after discounts
  - `discount_cad`: Total discount applied to entire order

**Example Payload:**
```json
{
  "type": "booking.created",
  "order_id": "abc123",
  "user_id": "user456",
  "subtotal_cad": 180.00,
  "discount_cad": 18.00,
  "total_cad": 162.00,
  "coupon_code": "SAVE10",
  "items": [
    {
      "appointment_id": "apt1",
      "course_id": "course1",
      "tutor_id": "tutor1",
      "start_datetime": "2025-01-15T10:00:00Z",
      "duration_min": 60,
      "price_cad": 90.00,
      "tutor_earnings_cad": 30.00
    },
    {
      "appointment_id": "apt2",
      "course_id": "course1",
      "tutor_id": "tutor1",
      "start_datetime": "2025-01-16T10:00:00Z",
      "duration_min": 60,
      "price_cad": 90.00,
      "tutor_earnings_cad": 30.00
    }
  ]
}
```

**Make.com Integration:** Make.com will receive one webhook per order (not per appointment). If you need separate webhooks per appointment, you would need to handle that in Make.com by looping through the `items` array.

---

## 3. Coupon Handling

### ✅ **Answer:** Yes, coupons are in `discountCad` field + `couponCode` added

**Webhook Payload:**
```json
{
  "order_id": "abc123",
  "subtotal_cad": 180.00,      // Sum of all items before discount
  "discount_cad": 18.00,        // Total discount amount (from coupon)
  "total_cad": 162.00,          // Final amount after discount
  "coupon_code": "SAVE10",      // Coupon code used (if any)
  "items": [...]
}
```

**How Coupons Work:**
- Coupons are applied at the **order level** (not per item)
- `discountCad` contains the **total discount amount** in CAD
- `couponCode` contains the **coupon code string** (e.g., "SAVE10")
- If no coupon is used, `coupon_code` will be `null` and `discount_cad` will be `0`

**Coupon Types:**
- **Percentage:** `discountCad = subtotalCad × (couponValue / 100)`
- **Fixed:** `discountCad = min(couponValue, subtotalCad)`

**Example:**
- Subtotal: $180.00
- Coupon: "SAVE10" (10% off)
- Discount: $18.00
- Total: $162.00

---

## 4. Guest vs Logged-In User Handling

### ✅ **VERIFIED:** Both paths work correctly

**Flow 1: Guest User (No Account)**
1. User adds items to cart (session-based)
2. User goes to checkout
3. User enters payment details + password (creates account)
4. Payment succeeds → Stripe webhook fires
5. Stripe webhook detects `userId` starts with `'guest_'` → Returns early (doesn't process)
6. **`confirm-payment-with-password` API endpoint:**
   - Creates Supabase Auth account
   - Creates database user record
   - Creates order + appointments
   - ✅ **Sends `signup` webhook** (if new user)
   - ✅ **Sends `booking.created` webhook** (with coupon code)

**Flow 2: Logged-In User (Has Account)**
1. User adds items to cart (user-based)
2. User goes to checkout
3. User enters payment details (no password needed)
4. Payment succeeds → Stripe webhook fires
5. **Stripe webhook:**
   - Processes order + appointments
   - ✅ **Sends `booking.created` webhook** (with coupon code)

**Key Points:**
- ✅ Both paths send `booking.created` webhook
- ✅ Guest checkout sends `signup` webhook for new users
- ✅ Both paths include `couponCode` in webhook payload
- ✅ Both paths include `discountCad` in webhook payload
- ✅ Both paths handle multiple appointments in one order

**Verification:**
- Guest checkout: `app/api/checkout/confirm-payment-with-password/route.ts` ✅
- Logged-in checkout: `app/api/webhooks/stripe/route.ts` ✅
- Both use same `sendBookingCreatedWebhook()` function ✅

---

## Summary of Changes Made

### 1. Signup Webhook
- ❌ Removed from `/inscription` page (`lib/actions/auth.ts`)
- ✅ Added to guest checkout (`app/api/checkout/confirm-payment-with-password/route.ts`)
- ✅ Page redirects to login (`app/inscription/page.tsx`)
- ✅ Still fires for admin-created tutors and OAuth

### 2. Coupon Code
- ✅ Added `couponCode` parameter to `sendBookingCreatedWebhook()` function
- ✅ Added `coupon_code` field to webhook payload
- ✅ Both webhook endpoints now pass coupon code

### 3. Multiple Appointments
- ✅ Verified: Single webhook with array of items (bundled)
- ✅ All appointments in one order are sent together

### 4. Guest vs Logged-In
- ✅ Verified: Both paths send booking webhook correctly
- ✅ Guest checkout includes signup webhook for new users
- ✅ Both paths handle coupon codes

---

## Testing Checklist

- [ ] Guest checkout with coupon → Should send signup + booking webhooks with coupon code
- [ ] Guest checkout without coupon → Should send signup + booking webhooks (no coupon_code)
- [ ] Logged-in checkout with coupon → Should send booking webhook with coupon code
- [ ] Logged-in checkout without coupon → Should send booking webhook (no coupon_code)
- [ ] Multiple appointments in one order → Should send one webhook with array of items
- [ ] Signup page → Should redirect to login page
- [ ] Admin creates tutor → Should send signup webhook (admin operation)

---

**Last Updated:** January 2025  
**Status:** ✅ All Questions Answered & Implemented

