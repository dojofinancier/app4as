<!-- 0e2a857e-3ab9-48c3-b79a-6bc77924aa6c a8236eca-c8a7-4728-af01-f73cd269821c -->
# Tutor Booking Application - Implementation Plan

## Phase 1: Project Foundation & Database

**1.1 Initialize Next.js Project**

- Create Next.js 14 app with App Router, TypeScript, Tailwind CSS
- Install dependencies: Prisma, Supabase client, Stripe, react-hook-form, zod, shadcn/ui, date-fns
- Configure Netlify adapter and deployment settings
- Set up environment variables structure

**1.2 Database Schema & Migrations**

- Create Prisma schema with all tables: `users`, `courses`, `tutors`, `tutor_courses`, `availability_rules`, `availability_exceptions`, `time_off`, `coupons`, `carts`, `cart_items`, `slot_holds`, `orders`, `order_items`, `appointments`, `webhook_events`
- Add indexes on critical fields (appointments.start_datetime, slot_holds.expires_at, etc.)
- Generate and run initial migration
- Create SQL file for Supabase RLS policies (student/tutor/admin scopes)

**1.3 Authentication Setup**

- Configure Supabase Auth with Email/Password + Google/Microsoft OAuth
- Create auth middleware for role-based access control
- Set up user profile completion flow (first_name, last_name)
- Implement role assignment logic (default: student)

## Phase 2: Core Slot Engine & Booking Logic

**2.1 Slot Generation Utility**

- Build server utility `lib/slots/generator.ts`:
- Fetch tutors assigned to course via `tutor_courses`
- Generate 30-min grid slots from `availability_rules` (recurring weekly)
- Apply `availability_exceptions` and `time_off`
- Subtract existing `appointments` and non-expired `slot_holds`
- Apply lead time constraints (12h min, 60 days max)
- Tag slots with tutor_id, priority, duration options (60/90/120), prices
- Create union merger that prioritizes by time then tutor priority
- Server action: `getAvailableSlots(courseId, fromDate, toDate)`

**2.2 Pricing Calculator**

- Utility `lib/pricing.ts`: linear pricing based on tutor's `hourly_base_rate_cad`
- 60 min → base rate
- 90 min → base × 1.5
- 120 min → base × 2
- Coupon discount calculator (percentage or fixed amount)

**2.3 Slot Holds System**

- Server actions for cart management:
- `addToCart`: validate slot availability, create/update `slot_holds` with 15-min TTL, unique constraint on (tutor_id, start_datetime)
- `removeFromCart`: delete hold record
- `applyCoupon`: validate and calculate discount (in-app only)
- Netlify scheduled function to cleanup expired holds (runs every minute)

## Phase 3: Stripe Payment Integration

**3.1 Checkout Session Creation**

- Server action `createCheckoutSession`:
- Create line items from cart (course + tutor name + date/time in French)
- Apply coupon discount to subtotal before passing to Stripe
- Set mode to 'payment', currency to 'CAD'
- Collect billing address, no tax collection
- Success URL: `/paiement/succes?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/paiement/annule`

**3.2 Stripe Webhook Handler**

- Create `/api/webhooks/stripe` route (Netlify Function)
- Verify Stripe signature
- Handle `checkout.session.completed`:
- Create `orders` and `order_items` from cart snapshot
- Convert `slot_holds` to `appointments` atomically (transaction)
- Perform conflict check; refund if double-booking detected
- Clear cart and holds
- Idempotent by `payment_intent.id`

## Phase 4: Make.com Webhooks

**4.1 Signup Webhook**

- Trigger on user creation (Supabase Auth trigger or server action)
- POST to `MAKE_SIGNUP_WEBHOOK_URL` with user data (id, role, email, first_name, last_name, created_at)

**4.2 Booking Webhook**

- Trigger after successful payment and appointment creation
- POST to `MAKE_BOOKING_WEBHOOK_URL` with order details (order_id, user_id, subtotal, discount, total, items array with appointment details)
- Log all webhook attempts to `webhook_events` table

## Phase 5: Public Pages (French UI)

**5.1 Homepage & Course Listing**

- `/` - Hero with CTA "Réserver un tuteur"
- `/cours` - Course list with search/filter
- `/cours/[slug]` - Course detail page with union calendar view

**5.2 Booking Calendar UI**

- Calendar component showing available slots (union for course)
- Duration selector (60/90/120 min) with live price updates
- Multi-slot selection and cart preview
- Tutor selection per slot (showing priority tutor by default)
- Mobile-responsive, accessible (keyboard navigation, ARIA labels)

**5.3 Tutor Pages**

- `/tuteurs/[id]` - Tutor profile (bio, courses taught, individual calendar)

## Phase 6: Student Dashboard

**6.1 Dashboard Layout**

- `/tableau-de-bord` - Main student dashboard
- Navigation: Mes rendez-vous, Réserver, Mes achats

**6.2 Appointments Management**

- List upcoming and past appointments
- Reschedule action (only if ≥ 2h before start): cancel → create credit/new cart item → redirect to calendar
- Cancel action (only if ≥ 2h before start): mark as cancelled
- Download ICS file per appointment

**6.3 Booking & Orders**

- "Réserver plus de séances" - same course calendar flow
- Orders list with Stripe receipt links

## Phase 7: Tutor Dashboard

**7.1 Availability Management**

- `/tuteur` - Tutor dashboard
- Weekly recurring availability editor (`availability_rules`):
- Select weekday, add time ranges (start_time, end_time)
- CRUD interface for weekly template
- One-off exceptions (`availability_exceptions`):
- Add specific date overrides (open/closed blocks)
- Time off manager (`time_off`):
- Add vacation/block periods (start_datetime, end_datetime)

**7.2 Appointments View**

- List of tutor's scheduled appointments (filtered by `appointments.tutor_id`)
- View student details, course, time
- Download ICS per appointment

## Phase 8: Admin Dashboard

**8.1 Course Management**

- `/admin/cours` - CRUD for courses
- Fields: slug, title_fr, description_fr, active status

**8.2 Tutor Management**

- `/admin/tuteurs` - CRUD for tutors
- Fields: display_name, bio_fr, hourly_base_rate_cad, priority (int), active
- Assign/unassign courses via `tutor_courses`

**8.3 Coupon Management**

- `/admin/coupons` - CRUD for coupons
- Fields: code, type (percent|fixed), value, active, starts_at, ends_at, max_redemptions
- Track redemption count

**8.4 Manual Overrides**

- Create appointments manually (bypass payment)
- Cancel appointments with optional refund flag
- View all orders and webhook events

## Phase 9: Security & Polish

**9.1 RLS Policies Implementation**

- Apply SQL policies to all tables (students see only their data, tutors see their availability/appointments, admins bypass)
- Test policies with different role scenarios

**9.2 Server Action Security**

- Add role checks to all admin/tutor actions
- Validate Stripe webhook signatures
- Input validation with Zod schemas

**9.3 French Localization**

- Create `lib/i18n/fr-CA.ts` with all labels, errors, messages
- Ensure consistent fr-CA usage throughout
- Format dates/times for Quebec locale
- Currency formatting (CAD)

**9.4 Dark Mode & Accessibility**

- Implement dark mode toggle with shadcn/ui theming
- ARIA labels on all interactive elements
- Keyboard navigation testing
- Mobile-first responsive design

## Phase 10: Testing & Deployment

**10.1 Core Logic Tests**

- Unit tests for slot generation (overlaps, conflicts, holds)
- Pricing calculator tests
- Coupon validation tests

**10.2 E2E Flow Test**

- Smoke test: Select course → add slots → checkout → webhook → verify appointments created

**10.3 Netlify Configuration**

- Configure build settings and environment variables
- Set up Netlify Functions for API routes and scheduled cleanup
- Configure redirects and headers

**10.4 Documentation**

- Create README with local setup instructions
- Document environment variables
- Basic deployment guide for Netlify + Supabase

### To-dos

- [ ] Initialize Next.js 14 project with TypeScript, Tailwind, Prisma, and all dependencies
- [ ] Create Prisma schema with all tables, indexes, and generate migrations
- [ ] Write and apply Supabase RLS policies for student/tutor/admin roles
- [ ] Configure Supabase Auth with Email/Password + OAuth and role-based middleware
- [ ] Build slot generation engine with availability rules, holds, and conflict detection
- [ ] Implement cart system with slot holds (15-min TTL) and cleanup job
- [ ] Create pricing calculator for linear tutor rates and coupon discounts
- [ ] Implement Stripe Checkout session creation with CAD, address collection, and discount application
- [ ] Build Stripe webhook handler to convert holds to appointments on payment success
- [ ] Implement Make.com webhooks for signup and booking.created events
- [ ] Build public pages: homepage, course list, course detail with calendar, tutor profiles
- [ ] Create student dashboard with appointments, reschedule/cancel, and booking flows
- [ ] Build tutor dashboard for availability management and appointment viewing
- [ ] Create admin dashboard for CRUD operations on courses, tutors, coupons, and manual overrides
- [ ] Implement complete French (Canada) localization across all pages and components
- [ ] Apply security hardening, dark mode, accessibility improvements, and mobile responsiveness
- [ ] Write unit tests for slot engine and E2E test for complete booking flow
- [ ] Configure Netlify deployment, functions, scheduled jobs, and documentation