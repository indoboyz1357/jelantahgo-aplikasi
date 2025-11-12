# Vercel Environment Variables Setup

## Critical: JWT_SECRET Configuration

The authentication system requires `JWT_SECRET` to be **exactly the same** in both production and development environments. Token mismatch will cause users to be redirected to login page.

### Setup Instructions

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `jelantahgo-aplikasi`
3. Go to **Settings** → **Environment Variables**
4. Add/Update the following variables:

#### Required Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_75YZHLuodbjJ@ep-fancy-morning-ahkytxc8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://neondb_owner:npg_75YZHLuodbjJ@ep-fancy-morning-ahkytxc8.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require` | Production, Preview, Development |
| `JWT_SECRET` | `jelantahgo-super-secret-jwt-key-production-2024-change-this` | Production, Preview, Development |
| `NEXT_PUBLIC_API_URL` | `https://jelantahgo-aplikasi.vercel.app` | Production |
| `NEXT_PUBLIC_API_URL` | `https://[your-preview-url].vercel.app` | Preview (optional) |
| `NODE_ENV` | `production` | Production |

### Important Notes

⚠️ **CRITICAL**: The `JWT_SECRET` value must be **EXACTLY**:
```
jelantahgo-super-secret-jwt-key-production-2024-change-this
```

- No extra spaces
- No quotes around it in Vercel UI
- Same value for Production, Preview, AND Development environments

### After Adding/Updating Variables

1. **Redeploy** the application:
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Click **Redeploy** button
   - Select "Redeploy with existing Build Cache" or "Redeploy without Cache"

2. **Clear existing user tokens**:
   - All users will need to **logout and login again** to get new tokens
   - Or clear localStorage in browser DevTools

### Verifying JWT Setup

After deployment, check Vercel logs:
1. Go to **Deployments** → Select your deployment
2. Click **View Function Logs**
3. Look for these log messages:
   - ❌ `JWT_SECRET is not configured!` → Variable not set
   - ❌ `JWT verification failed: ...` → Token mismatch or expired
   - ✅ No errors → JWT is working correctly

### Troubleshooting

**Problem**: Users redirected to login when accessing pickups/bills
**Solution**:
1. Verify JWT_SECRET is set correctly in Vercel
2. Check that value matches exactly (no typos)
3. Redeploy after changing
4. Ask users to logout and login again

**Problem**: "Auth check failed: 401" in browser console
**Solution**:
1. Token was generated with different JWT_SECRET
2. User needs to logout and login again with new token

**Problem**: "Auth check failed: 500" in browser console
**Solution**:
1. Check Vercel function logs for detailed error
2. Might be database connection issue
3. AuthContext will use cached user data temporarily

### Security Note

In production, change `JWT_SECRET` to a strong random string:
```bash
# Generate secure random secret (run in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then update in Vercel environment variables AND in your local `.env.local` file.
