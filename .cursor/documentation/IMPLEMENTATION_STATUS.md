# Landing Page Integration - Implementation Status

## ✅ Completed (App Side)

### 1. Course Availability API Endpoint
**File**: `app/api/check-course-availability/route.ts` ✅ CREATED

- Accepts `courseCode` as query parameter
- Checks if course exists and is active
- Counts active tutors for the course
- Returns: `{ available: boolean, slug: string | null, tutorsCount: number }`
- Public endpoint (no auth required)
- Error handling included

### 2. Reservation Page Updated
**File**: `app/cours/[slug]/reservation/page.tsx` ✅ UPDATED

- Now accepts `source` and `code` parameters from URL
- Logs landing page source for future analytics
- No breaking changes to existing functionality

---

## 📋 Remaining Work (Landing Page Side)

See `LANDING_PAGE_INTEGRATION_PLAN.md` for detailed prompts to give to the AI developer working on the landing page.

### Summary of Landing Page Changes Needed:

1. **Update Database Schema Alignment**
   - Change `full_name` → `title_fr`
   - Update search queries
   - Update course selection component

2. **Update Form Data Structure**
   - Store `courseCode` instead of full course text
   - Add `courseSlug` field

3. **Add Availability Check**
   - Create `checkCourseAvailability()` function
   - Call after webhook submission
   - Redirect based on result

4. **Create Unavailable Page**
   - New component for when no tutors available
   - Allow returning to course search

---

## 🔗 Integration Flow

```
Landing Page                    App
    |                            |
    |--[1] Submit Form-----------|
    |--[2] Send to Make.com      |
    |--[3] Check Availability---->|
    |                            |--[4] Query DB
    |                            |--[5] Return {available, slug, tutorsCount}
    |<--[6] Response-------------|
    |                            |
    |--[7a] If available:        |
    |     Redirect to app        |
    |     /cours/[slug]/reservation?code=XXX&source=lp
    |                            |
    |--[7b] If unavailable:      |
    |     Show unavailable page  |
```

---

## 🧪 Testing Checklist

### App Side (Already Implemented)
- [x] API endpoint created
- [x] API returns correct format
- [x] API handles missing courseCode
- [x] API checks active courses only
- [x] API counts active tutors correctly
- [x] Reservation page accepts source parameter

### Landing Page Side (To Be Implemented)
- [ ] Course search uses `title_fr` instead of `full_name`
- [ ] Form stores `courseCode` instead of full text
- [ ] Availability check function implemented
- [ ] Redirect logic works correctly
- [ ] Unavailable page displays correctly
- [ ] Webhook still receives correct data

### Integration Testing
- [ ] End-to-end flow: Search → Submit → Redirect
- [ ] Available course redirects correctly
- [ ] Unavailable course shows unavailable page
- [ ] URL parameters are passed correctly
- [ ] Source tracking works

---

## 📝 Notes

- The API endpoint is already live and ready to use
- No database changes required
- No environment variables needed
- The reservation page already handles the new parameters gracefully
- All changes are backward compatible

---

## 🚀 Next Steps

1. Share `LANDING_PAGE_INTEGRATION_PLAN.md` with the AI developer working on the landing page
2. They should implement the changes using the provided prompts
3. Test the integration end-to-end
4. Deploy both sites

