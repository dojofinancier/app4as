# Landing Page Integration - Quick Summary

## Goal
Connect landing page (carredastutorat.com) to app (app.carredastutorat.com) so students are redirected to course reservation after submitting their information.

## Flow
1. Student selects course on landing page
2. Student completes questionnaire and submits
3. Data sent to Make.com webhook (existing)
4. Landing page checks course availability via app API
5. **If available**: Redirect to `app.carredastutorat.com/cours/[slug]/reservation?code=[code]&source=lp`
6. **If unavailable**: Show "no tutors" page on landing page

## Key Changes

### Landing Page (Carre_d_As_New/)
1. Change `full_name` → `title_fr` throughout
2. Store `courseCode` (not full text) in formData
3. After webhook, call app API to check availability
4. Redirect based on availability result
5. Create "unavailable" page component

### App (this codebase)
1. Create API: `/api/check-course-availability?courseCode=XXX`
2. Update reservation page to accept `source=lp` parameter

## Detailed Prompts
See `LANDING_PAGE_INTEGRATION_PLAN.md` for complete implementation prompts.

