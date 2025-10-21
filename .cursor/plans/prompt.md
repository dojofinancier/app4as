# Build a Tutor Booking Web Application (Next.js + Supabase + Stripe) — French (Canada), CAD

## Goal
Create a production-ready web app for **one-on-one tutoring bookings** with 4 steps:  
1) **Course (or Tutor) selection**  
2) **Calendar & multi-slot selection (60/90/120 min)** with **union availability per course**  
3) **Stripe Checkout (CAD, address collected, no taxes)**  
4) **Dashboard** after payment (see/manage appointments, book more).  

V1 includes **Admin dashboard** and **Tutor dashboard**. Database is **Supabase** (Postgres). Payments via **Stripe Checkout**. Deploy to **Netlify**.

**Language**: App UI in **French (Canada)** only.  
**Currency**: CAD only.  
**Timezone**: Single timezone (no conversions required).

---

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui (for accessible components), react-hook-form, zod.
- **State**: Server Actions + React Query (optional) for client fetching.
- **Auth**: Supabase Auth (Email/Password + OAuth Google/Microsoft). No email verification required for browsing; bookings only valid after successful payment.
- **DB**: Supabase (Postgres). Use RLS with policies for student/tutor/admin roles.
- **Scheduling**: Real-time slot generation (no nightly cache). Hold slots for **15 minutes** during checkout. Prevent double booking.
- **External calendars**: Optional **Google/Microsoft Calendar** OAuth for tutors. Treat external calendars as **busy overlays** against in-app availability.
- **Payments**: Stripe Checkout **(CAD, address collected, no taxes)**. Coupons: percentage or fixed amount. No Stripe Connect in V1 (payouts handled off-platform).
- **Webhooks**: 
  - `signup` (on user creation)  
  - `booking.created` (only after successful payment)  
  Send to **Make.com** webhook URL.
- **Hosting**: Netlify (Next.js adapter). Use Netlify Functions for API/webhooks.

---

## Roles & Access
- Roles: `student`, `tutor`, `admin`.  
- **Student**: browse courses/tutors, select slots, pay, see/modify (reschedule/cancel ≥ 2h before start).  
- **Tutor**: manage availability (recurring + exceptions), connect Google/Microsoft Calendar, set courses taught, view bookings.  
- **Admin**: CRUD courses/tutors, assign tutors to courses, set per-tutor linear pricing, set **tutor priority** (used when multiple tutors are available for the same time), manage coupons, manual overrides.

Implement **RLS** policies so that:
- Students can only see their own orders/appointments.
- Tutors can only see/manage their availability and their own appointments.
- Admins can access everything.

---

## Core Booking Logic (Critical)
- **Durations**: 60 / 90 / 120 minutes.  
- **Pricing**: **Per-tutor linear pricing** (e.g., rate per 60 mins; multiply by 1.5 for 90, 2x for 120).  
- **Course calendar = UNION** of free slots from all tutors assigned to that course:  
  - Start from tutor’s in-app availability (weekly recurring templates + one-off exceptions).  
  - Subtract external calendar “busy” blocks (Google/Microsoft), if connected.  
  - Subtract already **booked** or **held** (reserved) slots.  
  - Apply buffers/constraints:  
    - **Lead time min**: 12h (reasonable default)  
    - **Lead time max**: 60 days (reasonable default)  
    - **Change/cancel cutoff**: 2h before start  
    - Optional buffer between sessions: 10–15 min (param).
- **Slot grid**: 30-minute increments (configurable). 60/90/120 must start on grid.
- **Tutor priority**: when a union slot is available for multiple tutors, mark the slot with the **highest-priority tutor** as default; still allow the student to choose another tutor in that exact slot if visible.
- **Concurrency**:  
  - When a student adds a slot to cart, **create a hold** record with TTL **15 minutes**.  
  - Extend/refresh holds when cart updates.  
  - On Checkout session creation, maintain the same holds.  
  - On successful payment → convert holds to **appointments** in a single transaction; remove remaining holds.  
  - On Checkout expiration/cancel/failure → automatically release holds (via webhook or scheduled cleanup).
- **Unlimited cart**: user can add unlimited slots across courses before paying. Coupon support across the order total.

---

## Database (Supabase) — Tables & Key Columns
*(No migration SQL needed; just implement with Prisma or SQL builder in code.)*

- `users` (mirror from Supabase Auth)
  - `id`, `role` (enum: student/tutor/admin), `first_name`, `last_name`, `email`, `phone`(nullable), `created_at`
- `courses`
  - `id`, `slug`, `title_fr`, `description_fr`, `active`, `created_at`
- `tutors`
  - `id` (FK to users), `display_name`, `bio_fr`, `hourly_base_rate_cad` (for 60-min), `priority` (int; lower number = higher priority), `active`
- `tutor_courses`
  - `id`, `tutor_id`, `course_id`, `active`, unique(tutor_id, course_id)
- `availability_rules` (recurring weekly)
  - `id`, `tutor_id`, `weekday` (0–6), `start_time` (HH:MM), `end_time` (HH:MM)
- `availability_exceptions` (one-off open/closed blocks)
  - `id`, `tutor_id`, `date` (YYYY-MM-DD), `start_time`, `end_time`, `is_open` (bool)
- `time_off` (vacations/blocks)
  - `id`, `tutor_id`, `start_datetime`, `end_datetime`
- `external_calendars`
  - `id`, `tutor_id`, `provider` (google|microsoft), `account_email`, `access_token_encrypted`, `refresh_token_encrypted`, `expires_at`, `active`
- `coupons`
  - `id`, `code`, `type` (percent|fixed), `value`, `active`, `starts_at`, `ends_at`, `max_redemptions`, `redemptions_count`
- `carts`
  - `id`, `user_id`, `coupon_id` (nullable), `created_at`, `updated_at`
- `cart_items`
  - `id`, `cart_id`, `course_id`, `tutor_id`, `start_datetime`, `duration_min` (60|90|120), `unit_price_cad`, `line_total_cad`
- `slot_holds`
  - `id`, `user_id`, `tutor_id`, `course_id`, `start_datetime`, `duration_min`, `expires_at`, unique(tutor_id, start_datetime)  
- `orders`
  - `id`, `user_id`, `subtotal_cad`, `discount_cad`, `total_cad`, `currency` (CAD), `stripe_payment_intent_id`, `stripe_checkout_session_id`, `status` (created|paid|failed|refunded), `created_at`
- `order_items`
  - `id`, `order_id`, `course_id`, `tutor_id`, `start_datetime`, `duration_min`, `unit_price_cad`, `line_total_cad`
- `appointments`
  - `id`, `user_id`, `tutor_id`, `course_id`, `start_datetime`, `end_datetime`, `status` (scheduled|cancelled|completed|refunded), `order_item_id`
- `webhook_events`
  - `id`, `source` (stripe|make|app), `type`, `payload_json`, `processed_at`
- (Optional V2) `messages`

**Indexes**:  
- On `appointments(start_datetime, tutor_id)`  
- On `slot_holds(start_datetime, tutor_id, expires_at)`  
- On `availability_rules(tutor_id, weekday)`  
- On `tutor_courses(course_id)`  
- On `cart_items(cart_id)` and `order_items(order_id)`

**RLS**:
- Students: `appointments.user_id = auth.uid()`, `orders.user_id = auth.uid()`, etc.
- Tutors: `appointments.tutor_id IN (their id)`, availability tables scoped to self.
- Admin: bypass policies.

---

## Slot Engine (Server)
Implement a **server utility** to generate available slots for a given `course_id` and date range:

1) Gather all **tutors** assigned to the course (`tutor_courses` where active).  
2) For each tutor:
   - Compute candidate windows from `availability_rules` for each date in range.
   - Apply `availability_exceptions` (toggle open/closed windows).
   - Subtract `time_off` ranges.
   - Subtract **external busy** events (Google/MS) fetched via API (only if connected).
3) Generate slots on **30-minute grid** for 60/90/120 durations, ensuring end within allowed windows.
4) Remove any slot overlapping existing `appointments` or non-expired `slot_holds`.
5) Tag each slot with:
   - `tutor_id`, `course_id`, `start_datetime`, `duration_min options`, `price_cad per option`, and `priority` from tutor.
6) Union across tutors; **sort by start time, then by tutor priority**.  
7) Return a **normalized structure** the UI can render quickly.

Add a **server action / route**:
- `GET /api/slots?courseId=...&from=...&to=...` → returns union slots + tutor options per slot time.

---

## Cart & Holds (Server)
- `POST /api/cart/add` → body: `{ courseId, tutorId, start, durationMin }`  
  - Validates slot availability by re-running conflict checks.  
  - **Upsert `slot_holds`** (tutorId + start unique), set `expires_at = now() + 15m` for this user.  
  - Returns updated cart, totals.
- `POST /api/cart/remove` → remove item (and **release corresponding hold**).
- `POST /api/cart/apply-coupon` → validate coupon (active, date window, redemption count), compute discount.
- **Cleanup job**: every minute (Netlify Scheduled Function) delete expired holds.

---

## Stripe Checkout (CAD, no taxes)
- **Create Checkout Session** from cart: one line item per `cart_item` (name: `Cours – ${course.title_fr} (tuteur ${tutor.display_name})` + date/time).  
- Use **unit_amount** in cents; apply coupon as **Stripe coupon/promo code** OR compute discount in app and pass a single negative line item (choose one approach and implement end-to-end).  
- Collect **billing address**.  
- **Success URL** → `/paiement/succes?session_id={CHECKOUT_SESSION_ID}`  
- **Cancel URL** → `/paiement/annule`
- On successful payment (Stripe webhook `checkout.session.completed` / `payment_intent.succeeded`), **atomically**:
  - Create `orders` + `order_items` from cart snapshot.
  - Convert corresponding `slot_holds` to `appointments`; enforce **conflict check** within a transaction to avoid race conditions. If conflict, refund and return error (log to `webhook_events`).
  - Clear cart and holds.

---

## Make.com Webhooks
- **On signup** (immediately after first user record creation):
  - POST to `MAKE_SIGNUP_WEBHOOK_URL` with:  
    ```json
    {
      "type": "signup",
      "user_id": "<uuid>",
      "role": "<student|tutor|admin>",
      "email": "…",
      "first_name": "…",
      "last_name": "…",
      "created_at": "ISO"
    }
    ```
- **On booking.created** (after payment + appointments created):
  - POST to `MAKE_BOOKING_WEBHOOK_URL` with:
    ```json
    {
      "type": "booking.created",
      "order_id": "<uuid>",
      "user_id": "<uuid>",
      "currency": "CAD",
      "subtotal_cad": 0,
      "discount_cad": 0,
      "total_cad": 0,
      "items": [
        {
          "appointment_id": "<uuid>",
          "course_id": "<uuid>",
          "course_title_fr": "…",
          "tutor_id": "<uuid>",
          "tutor_name": "…",
          "start_datetime": "ISO",
          "duration_min": 60,
          "price_cad": 0
        }
      ],
      "created_at": "ISO"
    }
    ```

---

## Pages & UX (French UI)
### Public
- `/` — Hero + CTA “Réserver un tuteur”.  
- `/cours` — List of courses, search/filter.  
- `/cours/[slug]` — Course page with **union calendar**. Left: course info; Right: calendar + slot list.  
  - Users can also **“Choisir un tuteur directement”** to jump to tutor page.
- `/tuteurs/[id]` — Tutor profile (bio, cours enseignés, calendrier propre).

### Booking flow
- Step 1: select **Cours** (or Tutor).  
- Step 2: **Calendrier** (union for course). Choose 60/90/120; price shows and updates. Add multiple slots to cart.  
- Step 3: **Paiement (Stripe Checkout)**.  
- Step 4: **Tableau de bord** (confirmation + rdv list).

### Dashboards
- **Student** `/tableau-de-bord`
  - “Mes rendez-vous” (upcoming/past), actions: **replanifier**/**annuler** (≥ 2h).  
  - “Réserver plus de séances” (same calendars).  
  - “Mes achats” (orders list, Stripe receipts link).
- **Tutor** `/tuteur`
  - Éditeur de **disponibilités récurrentes** (hebdo) + **exceptions**; connecter Google/Microsoft; lister rendez-vous.  
- **Admin** `/admin`
  - CRUD **Cours**, **Tuteurs** (bio, active), **Assignations** (tutor↔course), **Tarifs par tuteur** (base 60 min), **Priorité** (entier), **Coupons** (%, $), **Manuel**: créer/annuler rendez-vous.

Use **consistent French labels** (fr-CA), mobile-first, accessible (keyboard, ARIA). Provide dark mode.

---

## API Routes (Netlify Functions / Next.js Route Handlers)
- `GET /api/slots` — union availability (params: `courseId`, `from`, `to`).
- `POST /api/cart/add`, `POST /api/cart/remove`, `POST /api/cart/apply-coupon`.
- `POST /api/checkout/create-session`
- `POST /api/webhooks/stripe` — handle success/failure; convert holds → appointments; idempotent by `payment_intent.id`.
- `POST /api/webhooks/make-test` (optional local tool).
- `POST /api/admin/*` — secured via admin role (CRUD entities).
- `POST /api/tutor/*` — for tutor availability, exceptions, calendar connect/disconnect, token refresh.

**Security**: Verify Stripe signatures; verify Make.com secrets; enforce role checks on every handler.

---

## External Calendar Integration (Tutor)
- OAuth connect buttons for **Google** and **Microsoft** in tutor dashboard.  
- Store and refresh tokens (encrypted).  
- Pull **busy events** within query window for slot generation.  
- Do **not** create events externally in V1 (internal appointment only).  
- Offer **ICS download** per appointment for student/tutor.

---

## Cancellations & Reschedules
- Allowed up to **2 hours** before start.  
- Reschedule flow: cancel old appointment → return credit to **user’s cart** (or auto-create new cart item with same value) → user rebooks. Payments/refunds can be skipped in V1 (admin handles off-platform if needed).  
- Ensure appointment/status transitions are consistent and auditable.

---

## Coupons
- Percent or fixed amount; validate window and redemptions.  
- Apply to order subtotal; show discount in cart summary and pass to Stripe consistently.

---

## Testing & Quality
- Implement unit tests for slot engine (overlaps, holds, conflicts).  
- E2E smoke for booking flow (add slots → checkout → webhook → appointments appear).  
- Linting, type-safe server actions, Zod input validation.

---

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `MAKE_SIGNUP_WEBHOOK_URL`, `MAKE_BOOKING_WEBHOOK_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`
- `ENCRYPTION_SECRET` (for tokens at rest)

---

## Deliverables
- Fully working Next.js project configured for **Netlify** deploy.  
- Supabase schema (via SQL/Prisma code, no separate migration file required in this prompt).  
- Implemented RLS with policies for roles.  
- Slot engine + holds + Stripe Checkout + webhooks → appointments.  
- French UI for all pages (Student/Tutor/Admin).  
- Make.com webhook POSTs for `signup` and `booking.created`.  
- Basic documentation: how to set env vars and run locally.

---

## Acceptance Criteria (Summary)
- Users can select a course → see **union** calendar → add multiple 60/90/120 min slots (various tutors) → checkout (Stripe) → after success, appointments are created and visible in dashboard.
- **Holds** prevent double-booking; release after 15 minutes if unpaid.
- Tutor priority applied when multiple tutors share the same slot; student can still pick a different tutor option explicitly.
- Tutors manage availabilities and connect Google/Microsoft; external **busy** times are respected.
- Admin can manage courses, tutors, assignments, prices, priorities, coupons.
- Cancellation/reschedule allowed ≥ 2h before start.
- App in **French**, CAD currency, **no taxes**, address collected.
- Webhooks to
