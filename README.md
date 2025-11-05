# 4AS Tutor Booking Application

Full-stack tutor booking application built with Next.js 14, Supabase, Stripe, and deployed on Netlify.

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS, shadcn/ui components
- **Database:** Supabase PostgreSQL with Prisma ORM
- **Auth:** Supabase Auth (Email + OAuth)
- **Payments:** Stripe Payment Intents (CAD only)
- **Deployment:** Netlify with scheduled functions
- **Language:** French (Canada) UI only

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (test mode for development)
- Netlify account (for deployment)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Set up the database:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

### Required Variables

These environment variables are **required** for the application to function:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler or direct) | `postgresql://...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | `eyJhbGc...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` or `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` or `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |

### Optional Variables

These environment variables are optional but recommended:

| Variable | Description | Default |
|----------|-------------|---------|
| `MAKE_SIGNUP_WEBHOOK_URL` | Make.com webhook URL for user signups | None |
| `MAKE_BOOKING_WEBHOOK_URL` | Make.com webhook URL for bookings | None |
| `NEXT_PUBLIC_APP_URL` | App URL for redirects | Netlify URL (auto-detected) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID (e.g., G-XXXXXXXXXX) | None |

### Environment Variable Setup

1. **Local Development:**
   - Create a `.env.local` file in the root directory
   - Add all required variables (see `.env.example` if available)

2. **Netlify Deployment:**
   - Go to Site Settings → Environment Variables
   - Add all required variables
   - For production, use `sk_live_...` and `pk_live_...` for Stripe keys
   - For staging, use `sk_test_...` and `pk_test_...` for Stripe keys

3. **Validation:**
   - Environment variables are automatically validated on app startup
   - Missing required variables will cause the app to fail in production
   - In development, warnings are shown but the app continues

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:studio` - Open Prisma Studio

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── checkout/          # Checkout pages
│   ├── cours/             # Course pages
│   └── tableau-de-bord/   # Dashboard pages
├── components/            # React components
│   ├── admin/             # Admin components
│   ├── auth/              # Authentication components
│   ├── booking/           # Booking components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # shadcn/ui components
├── lib/                   # Business logic and utilities
│   ├── actions/          # Server Actions
│   ├── slots/            # Slot generation engine
│   ├── webhooks/         # Webhook handlers
│   └── utils/            # Utility functions
├── prisma/               # Database schema and migrations
└── scripts/              # Utility scripts
```

## Database

### Prisma Setup

1. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```

2. Push schema changes:
   ```bash
   npm run prisma:push
   ```

3. Open Prisma Studio:
   ```bash
   npm run prisma:studio
   ```

### Database Schema

The application uses PostgreSQL via Supabase. Key tables include:

- `users` - User accounts (students, tutors, admins)
- `courses` - Available courses
- `appointments` - Scheduled tutoring sessions
- `orders` - Payment orders
- `tutors` - Tutor profiles and settings
- `cart_items` - Shopping cart items
- `holds` - Temporary slot holds

## Stripe Integration

### Setup

1. Create a Stripe account
2. Get your API keys from the Stripe Dashboard
3. Set up webhooks in Stripe Dashboard:
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`

### Testing

- Use Stripe test mode keys for development
- Use Stripe test cards for testing payment flows
- Test webhook delivery using Stripe CLI or dashboard

## Deployment

### Netlify Deployment

1. Connect your repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Set environment variables in Netlify dashboard
4. Deploy

### Scheduled Functions

The application uses Netlify scheduled functions for:

- `cleanup-holds` - Cleans up expired slot holds (runs every minute)
- `complete-past-appointments` - Auto-completes past appointments (runs hourly)
- `analyze-database` - Updates database statistics (runs weekly)
- `cleanup-error-logs` - Cleans up old error logs (runs weekly)

## Security

### Row Level Security (RLS)

- All database tables have RLS policies enabled
- Users can only access their own data
- Admins have elevated permissions
- Policies are defined in Supabase dashboard

### Environment Variables

- Never commit `.env` files
- Use Netlify environment variables for production secrets
- Rotate keys regularly
- Use different keys for staging and production

## Troubleshooting

### Common Issues

#### Build Failures
- **Missing environment variables:** Ensure all required variables are set in Netlify
- **Prisma errors:** Run `npm run prisma:generate` before building
- **TypeScript errors:** Check `tsconfig.json` and ensure all types are properly defined

#### Database Connection Issues
- **Connection timeout:** Use Supabase connection pooler URL instead of direct connection
- **RLS policies:** Ensure RLS policies are properly configured in Supabase dashboard
- **Migration errors:** Check migration files in `prisma/` directory

#### Payment Issues
- **Webhook failures:** Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret
- **Payment intent errors:** Check Stripe dashboard for detailed error logs
- **Test mode vs Production:** Ensure you're using matching keys (both test or both live)

#### Theme Flash on Page Load
- Theme is applied via blocking script in `<head>` to prevent flash
- If flash persists, check browser console for JavaScript errors

### Development Tips

1. **Hot Reload:** Next.js supports hot reloading for most changes
2. **Database Changes:** Always run `prisma:generate` after schema changes
3. **Environment Variables:** Use `.env.local` for local development (never commit)
4. **Stripe Testing:** Use Stripe test cards: `4242 4242 4242 4242` (any future date, any CVC)

## API Documentation

### Key API Routes

- **Cart:** `/api/cart/*` - Cart management (add, get, remove items)
- **Checkout:** `/api/checkout/*` - Payment intent creation and confirmation
- **Course Availability:** `/api/course-availability` - Check tutor availability for courses
- **Ratings:** `/api/ratings/*` - Manage tutor ratings
- **Webhooks:** `/api/webhooks/stripe` - Stripe webhook handler

### Server Actions

Most business logic is handled via Next.js Server Actions in `lib/actions/`:
- `auth.ts` - Authentication (sign in, sign up, sign out)
- `cart.ts` - Cart operations
- `checkout.ts` - Checkout and payment processing
- `reservations.ts` - Appointment management
- `tutor.ts` - Tutor operations

## Development Workflow

1. **Making Changes:**
   - Create feature branch from `main`
   - Make changes and test locally
   - Run `npm run lint` before committing
   - Push and create pull request

2. **Database Changes:**
   - Update `prisma/schema.prisma`
   - Run `npm run prisma:generate`
   - Run `npm run prisma:push` (or create migration)
   - Update RLS policies in Supabase if needed

3. **Deploying:**
   - Merge to `main` triggers Netlify deployment
   - Check Netlify build logs for errors
   - Verify environment variables are set
   - Test production deployment

## Support

For issues or questions, please contact the development team.

## License

[Your License Here]

