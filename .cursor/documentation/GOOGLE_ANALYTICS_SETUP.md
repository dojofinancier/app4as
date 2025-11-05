# Google Analytics Setup Guide

This guide explains how to set up Google Analytics 4 (GA4) for your 4AS Tutor Booking Application.

## Overview

Google Analytics has been integrated into the application using Next.js best practices:
- ✅ Uses `next/script` for optimal loading
- ✅ Only loads when measurement ID is configured
- ✅ Automatically tracks page views
- ✅ Non-blocking (loads after page is interactive)

## Setup Steps

### 1. Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **Admin** (gear icon) → **Create Property**
4. Fill in property details:
   - Property name: "4AS Tutor Booking"
   - Reporting time zone: (your timezone)
   - Currency: CAD
5. Click **Next** → **Create**

### 2. Get Your Measurement ID

1. In Google Analytics, go to **Admin** → **Data Streams**
2. Click on your web stream (or create one if needed)
3. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### 3. Add to Environment Variables

#### Local Development

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Netlify Deployment

1. Go to Netlify Dashboard → Your Site → **Site Settings** → **Environment Variables**
2. Click **Add variable**
3. Add:
   - **Key:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value:** `G-XXXXXXXXXX` (your measurement ID)
4. Click **Save**
5. Redeploy your site for changes to take effect

### 4. Verify Installation

After deployment:

1. Visit your site in a browser
2. Open browser DevTools → **Network** tab
3. Filter by "gtag" or "google-analytics"
4. You should see requests to `googletagmanager.com`
5. In Google Analytics, go to **Reports** → **Realtime**
6. You should see your visit appear within a few seconds

## What Gets Tracked

By default, the following is automatically tracked:

- ✅ **Page views** - Tracked on every page navigation
- ✅ **Page paths** - Full URL paths are tracked
- ✅ **User sessions** - Automatic session tracking

## Custom Events (Optional)

To track custom events (e.g., bookings, signups), you can add event tracking in your components:

```typescript
// Example: Track booking completion
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config',
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

// In your component
const handleBookingComplete = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'booking_completed', {
      event_category: 'booking',
      event_label: 'Course Booking',
      value: orderTotal,
    })
  }
  // ... rest of your booking logic
}
```

## Common Custom Events You Might Want to Track

### Booking Events
```typescript
// When user adds item to cart
window.gtag('event', 'add_to_cart', {
  event_category: 'ecommerce',
  items: [/* cart items */],
})

// When checkout starts
window.gtag('event', 'begin_checkout', {
  event_category: 'ecommerce',
})

// When payment succeeds
window.gtag('event', 'purchase', {
  event_category: 'ecommerce',
  transaction_id: orderId,
  value: orderTotal,
  currency: 'CAD',
})
```

### User Actions
```typescript
// When user signs up
window.gtag('event', 'sign_up', {
  method: 'email', // or 'google', 'microsoft'
})

// When user signs in
window.gtag('event', 'login', {
  method: 'email',
})

// When user views tutor profile
window.gtag('event', 'view_item', {
  event_category: 'tutor',
  item_id: tutorId,
})
```

## Privacy Considerations

### GDPR Compliance

If you have users in the EU, you should:

1. **Add cookie consent banner** - Users must consent before tracking
2. **Conditional loading** - Only load GA after consent
3. **Anonymize IP addresses** - Configure in GA4 settings

### Implementation Example

```typescript
// Only load GA if user has consented
const hasConsent = localStorage.getItem('cookie-consent') === 'true'

if (hasConsent && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
  // Load Google Analytics
}
```

## Troubleshooting

### GA Not Loading

1. **Check environment variable:**
   ```bash
   # Verify it's set
   echo $NEXT_PUBLIC_GA_MEASUREMENT_ID
   ```

2. **Check browser console** for errors

3. **Verify measurement ID format:** Should start with `G-`

4. **Check ad blockers** - Some browsers block GA scripts

### No Data in Google Analytics

1. **Wait 24-48 hours** - Real-time data appears immediately, but reports can take time
2. **Check filters** - Make sure you're not filtering out your own traffic
3. **Verify property** - Ensure you're looking at the correct GA property
4. **Check browser extensions** - Ad blockers or privacy extensions may block tracking

### Testing in Development

To test GA locally:

1. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to `.env.local`
2. Restart your dev server
3. Check browser Network tab for gtag requests
4. Use GA4 Realtime reports to verify events

## Disabling Google Analytics

If you need to temporarily disable GA:

1. **Remove environment variable** from Netlify/local `.env`
2. **Or set to empty string:** `NEXT_PUBLIC_GA_MEASUREMENT_ID=`
3. Redeploy if needed

The component automatically checks for the variable and won't load if it's missing.

## Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Script Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [GA4 Event Tracking](https://developers.google.com/analytics/devguides/collection/ga4/events)

