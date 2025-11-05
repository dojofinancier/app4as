# App API CORS Configuration Required

## Issue
The landing page is getting CORS errors when trying to check course availability:
```
Access to fetch at 'https://app.carredastutorat.com/api/check-course-availability' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Root Cause
The app API endpoint at `app.carredastutorat.com/api/check-course-availability` doesn't have CORS headers configured to allow requests from the landing page domain.

## Required Fix (App Side)

The app needs to configure CORS headers on the `/api/check-course-availability` endpoint to allow requests from:

### Development:
- `http://localhost:5173` (or whatever port the landing page dev server uses)

### Production:
- `https://carredastutorat.com` (landing page production domain)
- `http://carredastutorat.com` (if needed)

## Implementation (App Side)

### If using Next.js API Routes:
```typescript
// app/api/check-course-availability/route.ts
export async function GET(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
      ? 'https://carredastutorat.com' 
      : 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Your existing logic...
  const courseCode = request.nextUrl.searchParams.get('courseCode');
  // ... rest of your code

  return Response.json(
    { available: boolean, slug: string | null, tutorsCount: number },
    { headers }
  );
}
```

### If using Express or similar:
```javascript
app.get('/api/check-course-availability', (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://carredastutorat.com',
    'http://localhost:5173',
    // Add other origins as needed
  ];

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  // Your existing logic...
  const courseCode = req.query.courseCode;
  // ... rest of your code
});
```

## Alternative: Environment-Based CORS

For better security, use environment variables:
```env
# .env
ALLOWED_ORIGINS=https://carredastutorat.com,http://localhost:5173
```

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

if (allowedOrigins.includes(origin)) {
  res.header('Access-Control-Allow-Origin', origin);
}
```

## Testing

After implementing CORS:

1. **Development**: Test from `http://localhost:5173`
   - Should work without CORS errors
   - Check browser console for errors

2. **Production**: Test from `https://carredastutorat.com`
   - Should work without CORS errors
   - Verify the redirect works correctly

## Current Behavior (Landing Page)

The landing page currently handles CORS errors gracefully:
- If the API call fails (CORS, network, or 404), it shows the "unavailable" page
- This prevents the app from breaking, but users won't be redirected to available courses

Once CORS is configured, the integration will work as intended:
- Available courses → Redirect to app reservation page
- Unavailable courses → Show unavailable page on landing page

## Notes

- The landing page already handles errors gracefully (shows unavailable page on error)
- The API endpoint should be public (no authentication required)
- CORS is only needed for browser-based requests (the landing page)
- Consider adding rate limiting to prevent abuse

