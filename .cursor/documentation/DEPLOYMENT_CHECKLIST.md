# Netlify Deployment Checklist

## Pre-Deployment Setup ✅

### 1. Configuration Files
- ✅ `netlify.toml` - Configured with Next.js plugin
- ✅ `package.json` - Has `@netlify/plugin-nextjs` in devDependencies
- ✅ `next.config.js` - Optimized for production
- ✅ Scheduled functions - Properly configured

### 2. Build Verification
- ⚠️ **Build currently has TypeScript errors** - Fix before deploying:
  - Unused imports in API routes (fixing now)
  - Run `npm run build` locally to verify it passes

### 3. Environment Variables (Set in Netlify Dashboard)

**Required:**
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STRIPE_SECRET_KEY=sk_live_...  # or sk_test_... for staging
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Optional:**
```bash
MAKE_SIGNUP_WEBHOOK_URL=https://...
MAKE_BOOKING_WEBHOOK_URL=https://...
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
NETLIFY_NEXT_SKEW_PROTECTION=true  # Recommended
```

### 4. Stripe Webhook Configuration
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-site.netlify.app/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Copy signing secret → Add to Netlify as `STRIPE_WEBHOOK_SECRET`

### 5. Database Setup
- ✅ Prisma schema is up to date
- ✅ Run `npm run prisma:generate` locally to verify
- ✅ Prisma Client will be generated during Netlify build automatically

## Deployment Steps

### Step 1: Fix Build Errors
```bash
# Run locally to check for errors
npm run build

# Fix any TypeScript errors before deploying
```

### Step 2: Commit and Push
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### Step 3: Monitor Build
1. Go to Netlify Dashboard
2. Watch the build in **Deploys** tab
3. Check build logs for any errors

### Step 4: Verify Deployment
- [ ] Site loads at `https://your-site.netlify.app`
- [ ] Authentication works (sign up/in)
- [ ] Booking flow works
- [ ] Stripe webhook receives events
- [ ] Scheduled functions are running

## Post-Deployment Testing

### Critical Paths
1. **Homepage** - Loads correctly
2. **Authentication** - Sign up, sign in, sign out
3. **Course Browsing** - Can view courses
4. **Booking** - Add to cart, checkout, payment
5. **Dashboard** - Student/Tutor/Admin dashboards load

### Function Testing
1. **Scheduled Functions** - Check logs in Netlify dashboard
2. **API Routes** - Test key endpoints
3. **Webhooks** - Verify Stripe webhook logs

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, verify all env vars are set |
| Database errors | Verify `DATABASE_URL` uses pooler connection |
| Stripe errors | Check webhook secret matches, verify keys are correct |
| Functions not running | Check function logs, verify cron syntax |
| 404 errors | Verify `netlify.toml` is correct, check routing |

## Next Steps After Deployment

1. Set up custom domain (if needed)
2. Enable Netlify Analytics
3. Set up error monitoring (Sentry, etc.)
4. Configure backups for database
5. Set up staging environment
6. Enable skew protection (`NETLIFY_NEXT_SKEW_PROTECTION=true`)

