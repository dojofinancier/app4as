# Netlify Deployment Guide

This guide covers deploying the 4AS Tutor Booking Application to Netlify.

## Prerequisites

- ✅ GitHub repository connected to Netlify
- ✅ Netlify account with appropriate plan
- ✅ All environment variables configured
- ✅ Supabase project set up
- ✅ Stripe account configured

## Quick Start

Since your GitHub repo is already connected, follow these steps:

### 1. Configure Build Settings

Netlify should auto-detect Next.js, but verify these settings in **Site Settings → Build & Deploy**:

- **Build command:** `npm run build`
- **Publish directory:** (leave empty - handled by adapter)
- **Node version:** 18 (or higher)

### 2. Set Environment Variables

Go to **Site Settings → Environment Variables** and add all required variables:

#### Required Variables

```bash
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe
STRIPE_SECRET_KEY=sk_live_...  # or sk_test_... for staging
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # or pk_test_... for staging
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
MAKE_SIGNUP_WEBHOOK_URL=https://...
MAKE_BOOKING_WEBHOOK_URL=https://...
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Google Analytics 4
```

#### Important Notes

- Use **production keys** (`sk_live_`, `pk_live_`) for production site
- Use **test keys** (`sk_test_`, `pk_test_`) for staging/preview sites
- `DATABASE_URL` should use Supabase connection pooler for better performance
- Never commit these values to Git

### 3. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-site.netlify.app/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Copy the **Signing Secret** and add it as `STRIPE_WEBHOOK_SECRET` in Netlify

### 4. Database Setup

Ensure your Supabase database is ready:

```bash
# Run locally to verify schema is up to date
npm run prisma:generate
npm run prisma:push
```

**Note:** Prisma Client is generated during the Netlify build automatically.

### 5. Deploy

1. Push your latest code to the connected branch (usually `main`)
2. Netlify will automatically trigger a build
3. Monitor the build in **Deploys** tab
4. Once complete, your site will be live at `https://your-site.netlify.app`

## Build Process

Netlify uses the `@netlify/plugin-nextjs` adapter which:

1. **Automatically detects Next.js** and configures the build
2. **Generates Prisma Client** during build (`prisma generate` runs automatically)
3. **Handles routing** - Next.js API routes work automatically
4. **Optimizes images** - Uses Netlify Image CDN
5. **Caches appropriately** - Full Route Cache and Data Cache supported

### Build Configuration

The `netlify.toml` file is already configured:

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"

[build]
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
```

## Scheduled Functions

Your app has 4 scheduled functions configured:

1. **cleanup-holds** - Runs every minute (uses `schedule()` wrapper)
2. **complete-past-appointments** - Runs every hour (uses `schedule()` wrapper)
3. **analyze-database** - Runs weekly (configured in `netlify.toml`)
4. **cleanup-error-logs** - Runs weekly (configured in `netlify.toml`)

These functions are automatically deployed with your site. You can monitor them in:
- **Functions** tab in Netlify dashboard
- **Scheduled Functions** section in Site Settings

## Next.js Features Supported

According to [Netlify's Next.js documentation](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), all major features are supported:

✅ App Router  
✅ Server-Side Rendering (SSR)  
✅ Incremental Static Regeneration (ISR)  
✅ Static Site Generation (SSG)  
✅ React Server Components  
✅ Server Actions  
✅ Route Handlers  
✅ Image Optimization  
✅ Middleware (Edge Functions)  

## Post-Deployment Checklist

After successful deployment:

- [ ] Test authentication (sign up, sign in)
- [ ] Test booking flow (add to cart, checkout)
- [ ] Verify Stripe webhook is receiving events
- [ ] Test scheduled functions (check logs)
- [ ] Verify environment variables are accessible
- [ ] Test mobile responsiveness
- [ ] Check error logs in Netlify dashboard

## Troubleshooting

### Build Fails

**Error: "Prisma Client not generated"**
- Solution: Ensure `prisma` is in `devDependencies` (it is)
- The adapter should run `prisma generate` automatically

**Error: "Missing environment variable"**
- Solution: Check all required variables are set in Netlify
- Verify variable names match exactly (case-sensitive)

**Error: "TypeScript errors"**
- Solution: Run `npm run build` locally first to catch errors
- Ensure all types are properly defined

### Runtime Errors

**Error: "Database connection failed"**
- Solution: Use Supabase connection pooler URL
- Check Supabase project is active and accessible
- Verify `DATABASE_URL` is correct in Netlify

**Error: "Stripe webhook verification failed"**
- Solution: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint URL is correct

**Error: "Scheduled function not running"**
- Solution: Check function logs in Netlify dashboard
- Verify cron schedule syntax is correct
- Ensure functions are properly exported

### Performance Issues

**Slow page loads**
- Check Netlify Analytics for insights
- Verify images are optimized (using `next/image`)
- Check database query performance
- Review function execution times

## Environment-Specific Configuration

### Production Site

- Use `sk_live_` and `pk_live_` Stripe keys
- Use production Supabase project
- Set `NEXT_PUBLIC_APP_URL` to production domain
- Enable all scheduled functions

### Staging/Preview Sites

- Use `sk_test_` and `pk_test_` Stripe keys
- Can use same Supabase project (with different RLS policies) or separate project
- Preview deployments automatically get environment variables from production
- Can disable scheduled functions for preview sites

## Advanced Configuration

### Skew Protection (Recommended)

To prevent issues during deployments when users are active:

1. Add environment variable: `NETLIFY_NEXT_SKEW_PROTECTION=true`
2. This synchronizes client requests with the correct deployment
3. Prevents 404 errors and broken functionality during deploys

### Custom Headers

Add security headers in `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}
```

## Monitoring

### Netlify Analytics

Enable in **Site Settings → Analytics** to track:
- Page views
- Function invocations
- Build times
- Error rates

### Function Logs

View scheduled function logs in:
- **Functions** tab → Select function → View logs
- Check for errors or performance issues

### Build Logs

Monitor builds in:
- **Deploys** tab → Click on deployment → View logs
- Check for warnings or build-time errors

## Support Resources

- [Netlify Next.js Documentation](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Netlify Support](https://www.netlify.com/support/)

