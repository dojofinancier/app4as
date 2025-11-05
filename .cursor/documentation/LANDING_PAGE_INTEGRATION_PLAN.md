# Landing Page to App Integration Plan

## Overview
This plan outlines how to connect the landing page (carredastutorat.com) to the app (app.carredastutorat.com) so that when students submit their information, they are redirected to the appropriate course reservation page if the course is available.

## Architecture

```
Landing Page Flow:
1. Student searches and selects course (by code)
2. Student answers questions and submits email/name
3. Data sent to Make.com webhook (existing)
4. Landing page checks course availability via app API
5. If available: Redirect to app.carredastutorat.com/cours/[slug]/reservation?code=[code]&source=lp
6. If unavailable: Show "no tutors" page on landing page
```

## Database Schema Alignment

### Current State:
- **Landing Page**: Uses `full_name` field (doesn't exist in app)
- **App**: Uses `title_fr` field

### Required Changes:
- **Landing Page**: Update to use `title_fr` instead of `full_name`
- **Course Matching**: Use `code` field only (already unique in both)

## Implementation Steps

### Step 1: Update App - Create Course Availability API

**File**: `app/api/check-course-availability/route.ts` (NEW FILE)

**Purpose**: API endpoint that checks if a course is active and has available tutors

**Functionality**:
- Accepts `courseCode` as query parameter
- Checks if course exists and is `active`
- Checks if course has active tutors (via `tutor_courses` join)
- Returns JSON: `{ available: boolean, slug: string | null, tutorsCount: number }`

**Access**: Public endpoint (no auth required)

---

### Step 2: Update Landing Page - Align Database Schema

**Changes Required**:

1. **Update `types.ts`**:
   - Remove `full_name` from `Course` interface
   - Add `title_fr` and `slug` fields
   - Keep `code`, `institution`, `id`

2. **Update `lib/supabase.ts`**:
   - Change search query from `full_name` to `title_fr`
   - Update select to include `title_fr` and `slug` fields
   - Filter by `active = true` courses only

3. **Update `components/CourseSelection.tsx`**:
   - Change `course.full_name` to `course.title_fr`
   - Store `course.code` in formData (not the full text)
   - Update display to show `title_fr` with code

4. **Update `components/Questionnaire.tsx`**:
   - Store `course.code` instead of full course text
   - After webhook submission, call availability check API
   - Handle redirect logic

5. **Create "No Tutors Available" Page**:
   - New component: `components/CourseUnavailable.tsx`
   - Display message when course has no active tutors
   - Link back to course search

---

### Step 3: Update App - Handle Landing Page Redirects

**File**: `app/cours/[slug]/reservation/page.tsx`

**Changes**:
- Read `code` and `source` from URL searchParams
- If `source=lp`, track this in analytics (optional)
- No pre-filling needed (as requested)

---

## Detailed Implementation Prompts

### Prompt 1: Update Landing Page Types and Database Query

**Target**: AI Developer working on Landing Page

**Prompt**:
```
I need to align the landing page database schema with the main app. Please make the following changes:

1. Update `src/types.ts`:
   - In the `Course` interface, REMOVE `full_name: string`
   - ADD `title_fr: string` (French course title)
   - ADD `slug: string` (course URL slug)
   - Keep: `id`, `code`, `institution`, `created_at`

2. Update `src/lib/supabase.ts`:
   - Change the `searchCourses` function to:
     * Search by `title_fr` and `code` instead of `full_name` and `code`
     * Select fields: `id, code, title_fr, slug, institution, active`
     * Add filter: `.eq('active', true)` to only show active courses
     * Update the query to: `.or(\`title_fr.ilike.%${query}%,code.ilike.%${query}%\`)`

3. Update `src/components/CourseSelection.tsx`:
   - In `handleCourseSelect`:
     * Change `course.full_name` to `course.title_fr`
     * Update display text to show: `${course.title_fr} (${course.code}${course.institution ? ' - ' + course.institution : ''})`
     * When calling `onSelect`, pass the `course.code` instead of the full text string
     * Store the full course object in state (not just text) so we can access `slug` later
```

---

### Prompt 2: Update Questionnaire to Store Course Code and Add Availability Check

**Target**: AI Developer working on Landing Page

**Prompt**:
```
I need to update the questionnaire flow to:
1. Store course code (not full text) in formData
2. After webhook submission, check course availability
3. Redirect to app if available, or show unavailable page if not

Please make these changes:

1. Update `src/types.ts`:
   - In `FormData` interface, change `course: string` to `courseCode: string`
   - Add new field: `courseSlug: string | null` (optional, for redirect)

2. Update `src/components/CourseSelection.tsx`:
   - Modify `handleCourseSelect` to call `onSelect` with an object: `{ code: course.code, slug: course.slug }`
   - Update the `CourseSelectionProps` interface: `onSelect: (course: { code: string, slug: string }) => void`

3. Update `src/components/Questionnaire.tsx`:
   - Change `formData.course` to `formData.courseCode` and `formData.courseSlug`
   - In `CourseSelection` component, update `onSelect` to store: `updateFormData('courseCode', course.code)` and `updateFormData('courseSlug', course.slug)`
   - After successful webhook submission (in `submitForm` function), add availability check:
     * Call: `const availability = await checkCourseAvailability(formData.courseCode)`
     * If `availability.available === true`: redirect to `https://app.carredastutorat.com/cours/${availability.slug}/reservation?code=${formData.courseCode}&source=lp`
     * If `availability.available === false`: set step to 'unavailable' instead of 'thank-you'
   - Update webhook payload to send `courseCode` instead of `course`

4. Create new function in `src/lib/supabase.ts`:
   ```typescript
   export async function checkCourseAvailability(courseCode: string) {
     const response = await fetch(
       `https://app.carredastutorat.com/api/check-course-availability?courseCode=${encodeURIComponent(courseCode)}`
     );
     if (!response.ok) {
       return { available: false, slug: null, tutorsCount: 0 };
     }
     return await response.json();
   }
   ```

5. Update `src/components/Questionnaire.tsx` step handling:
   - Add new step: `'unavailable'` to the `Step` type in `types.ts`
   - Add case in switch statement: `case 'unavailable': return <CourseUnavailable courseCode={formData.courseCode} />;`
```

---

### Prompt 3: Create Course Unavailable Page

**Target**: AI Developer working on Landing Page

**Prompt**:
```
Create a new component `src/components/CourseUnavailable.tsx` that displays when a course has no available tutors.

Requirements:
- Similar layout to `ThankYou.tsx` (logo, centered content, footer)
- Display message: "Désolé, il n'y a actuellement aucun tuteur disponible pour ce cours."
- Add a button: "Rechercher un autre cours" that navigates back to the course selection (step 'course')
- Accept props: `courseCode: string` and `onBackToSearch: () => void`
- Use the same styling as the rest of the landing page (gray-50 background, green accent color #00746b)
```

---

### Prompt 4: Create App API Endpoint for Course Availability

**Target**: AI Developer working on App (this codebase)

**Prompt**:
```
Create a new API route `app/api/check-course-availability/route.ts` that checks if a course is available for booking.

Requirements:
1. Accept GET request with query parameter: `courseCode` (string)
2. Query the database to:
   - Find course by `code` where `active = true`
   - Count active tutors for this course (join `tutor_courses` where `active = true` and `tutors.active = true`)
3. Return JSON response:
   ```typescript
   {
     available: boolean,  // true if course exists, is active, and has at least 1 active tutor
     slug: string | null,  // course slug if available, null otherwise
     tutorsCount: number  // number of active tutors for this course
   }
   ```
4. Handle errors gracefully (return `{ available: false, slug: null, tutorsCount: 0 }`)
5. No authentication required (public endpoint)

Use Prisma to query. The relevant models are:
- `Course` (has `code`, `slug`, `active`)
- `TutorCourse` (joins tutors to courses, has `active` field)
- `Tutor` (has `active` field)
```

---

### Prompt 5: Update App Reservation Page to Handle Landing Page Source

**Target**: AI Developer working on App (this codebase)

**Prompt**:
```
Update `app/cours/[slug]/reservation/page.tsx` to optionally read `source` parameter from URL.

Changes needed:
1. In `CourseReservationPageProps`, add `searchParams: Promise<{ source?: string, code?: string }>`
2. Extract `source` from searchParams: `const { source, code } = await searchParams`
3. If `source === 'lp'`, you can optionally log this for analytics (but don't change the UI)
4. No pre-filling needed - just read the parameters for potential future use

This is a minimal change - just accept the parameters but don't use them yet.
```

---

## Environment Variables

### Landing Page (.env)
No new variables needed - uses existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### App (.env)
No new variables needed

---

## Testing Checklist

- [ ] Landing page searches courses by `title_fr` and `code`
- [ ] Landing page displays courses with `title_fr` correctly
- [ ] Landing page stores `courseCode` in formData
- [ ] Webhook receives `courseCode` instead of full course text
- [ ] After webhook submission, availability check API is called
- [ ] If course has tutors: redirects to app reservation page with correct URL
- [ ] If course has no tutors: shows unavailable page on landing page
- [ ] App API returns correct availability status
- [ ] App reservation page accepts `source=lp` parameter
- [ ] Unavailable page allows returning to course search

---

## Migration Notes

**Important**: Before deploying:
1. Ensure all courses in database have `title_fr` field populated (not just `full_name`)
2. Test that landing page can query courses successfully with new schema
3. Verify `code` field is unique and populated for all courses
4. Test the full flow: search → submit → availability check → redirect

---

## Rollback Plan

If issues occur:
1. Landing page: Revert to using `full_name` in search query
2. App: API endpoint can be disabled without affecting app functionality
3. No database changes required (only read operations)

---

## Future Enhancements (Optional)

- Pre-fill email/name on reservation page (would require authentication or token system)
- Track landing page conversions in analytics
- Show personalized message on app when arriving from landing page
- Email notifications when tutors become available for unavailable courses

