# Pixel Alchemy Deployment Guide

This document will guide you how to Pixel Alchemy Deploy the project to the production environment.

## 1. Preparation

### 1.1 Environmental requirements

- Node.js 18+ 
- npm or yarn
- Git
- Vercel Account (recommended)
- Supabase project
- Replicate API Account
- Stripe Account (optional)

### 1.2 Project preparation

Make sure your project has completed the following steps:

1. ✅ Complete local development and testing
2. ✅ Configure all environment variables
3. ✅ Database migration has been applied
4. ✅ The code has been submitted to Git storehouse

## 2. Supabase Production environment configuration

### 2.1 Create production project

1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new production project
3. Record projects URL and API key

### 2.2 Apply database migration

in Supabase Dashboard of SQL Editor Perform the following migrations in:

```sql
-- Execute migration file contents
-- 1. supabase/migrations/20240101000000_init_core_tables.sql
-- 2. supabase/migrations/20240101000001_rls_policies.sql  
-- 3. supabase/migrations/20240101000002_views_and_functions.sql
```

### 2.3 Configure authentication settings

1. Enter Authentication > Settings
2. set up Site URL for your production domain name
3. Add the redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/login`
   - `https://yourdomain.com/register`

### 2.4 Configuration storage (optional)

If needed, use Supabase Storage:

1. Enter Storage > Policies
2. Create bucket:`images`
3. Configure access policy

## 3. Vercel deploy

### 3.1 connect Git warehouse

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git warehouse
4. Select Next.js frame

### 3.2 Configure environment variables

in Vercel Add the following environment variables to the project settings:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Replicate API Configuration
REPLICATE_API_TOKEN=your_replicate_token
REPLICATE_WEBHOOK_SIGNING_SECRET=your_webhook_secret

# Stripe Configuration (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Application configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3.3 Configure build settings

in Vercel In project settings:

1. **Build Command**: `npm run build`
2. **Output Directory**: `.next`
3. **Install Command**: `npm install`

### 3.4 Configure domain name

1. in Vercel Add a custom domain name in project settings
2. Configuration DNS record points to Vercel
3. enable HTTPS

## 4. Replicate Webhook Configuration

### 4.1 set up Webhook URL

exist Replicate Dashboard Medium:

1. Enter API > Webhooks
2. add new Webhook
3. URL: `https://yourdomain.com/api/webhook/replicate`
4. Select event:`prediction.completed`, `prediction.failed`

### 4.2 verify Webhook

Make sure your Webhook The endpoint is handled correctly Replicate callback.

## 5. Stripe Configuration (optional)

### 5.1 Production environment setup

1. Switch to Stripe production mode
2. Obtain the production environment API key
3. Update environment variables

### 5.2 Webhook Configuration

1. in Stripe Dashboard Add in Webhook
2. URL: `https://yourdomain.com/api/webhook/stripe`
3. Select event:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## 6. Monitoring and logging

### 6.1 Vercel Analytics

1. exist Vercel enabled in Analytics
2. Configure performance monitoring
3. Set up error tracking

### 6.2 Log monitoring

1. Configuration Vercel function log
2. Set error alarms
3. Monitoring API response time

## 7. Performance optimization

### 7.1 Image optimization

1. Configuration CDN
2. Enable image compression
3. Use WebP Format

### 7.2 Database optimization

1. Configure connection pool
2. Optimize query performance
3. Set up appropriate indexes

### 7.3 caching strategy

1. Configuration Redis Caching (optional)
2. Enable browser cache
3. Use CDN cache

## 8. Security configuration

### 8.1 Environment variable security

1. Ensure sensitive information is not exposed on the front end
2. Use Vercel Environment variable encryption
3. Regular rotation API key

### 8.2 content security policy

Configure the CSP in `next.config.js`:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};
```

### 8.3 rate limit

Configuration API Rate limiting to prevent abuse:

```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server';

export function rateLimit(request: NextRequest) {
  // Implement rate limiting logic
}
```

## 9. Backup and restore

### 9.1 Database backup

1. Configuration Supabase Automatic backup
2. Set backup retention policy
3. Test recovery processes regularly

### 9.2 Code backup

1. Use Git version control
2. Configure automatic deployment
3. Keep deployment history

## 10. troubleshooting

### 10.1 FAQ

1. **Environment variable not set**
   - examine Vercel Environment variable configuration
   - Make sure the variable names are correct

2. **Database connection failed**
   - verify Supabase Configuration
   - Check network connection

3. **Webhook fail**
   - verify Webhook URL
   - Check signature verification

4. **Image generation failed**
   - examine Replicate API Quota
   - Verify model configuration

### 10.2 Debugging tools

1. **Vercel function log**
   - View real-time logs
   - Analyze error messages

2. **Supabase log**
   - Monitor database queries
   - Check the authentication log

3. **Browser developer tools**
   - Check network requests
   - Analyze front-end errors

## 11. Maintenance and updates

### 11.1 Regularly updated

1. Update dependency packages
2. Apply security patches
3. Upgrade Next.js Version

### 11.2 Performance monitoring

1. Monitor page load time
2. Tracking API response time
3. Analyze user behavior

### 11.3 capacity planning

1. Monitor resource usage
2. Forecast growth trends
3. Plan expansion plans

## 12. Support resources

- [Vercel document](https://vercel.com/docs)
- [Supabase document](https://supabase.com/docs)
- [Replicate document](https://replicate.com/docs)
- [Stripe document](https://stripe.com/docs)

---

**Notice**: Before deploying to production, fully test all features and put a solid monitoring and backup strategy in place.
