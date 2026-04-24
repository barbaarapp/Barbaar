# 🚀 Barbaar Cloudflare Pages Deployment Guide

## Prerequisites

- Cloudflare account (https://dash.cloudflare.com)
- GitHub account with barbaarapp/Barbaar repository
- Domain registered with Cloudflare (or add existing domain)

## Step 1: Connect GitHub to Cloudflare Pages

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Select your account

2. **Navigate to Pages**
   - In the left sidebar, click **Pages**
   - Click **Connect to Git**

3. **Authorize GitHub**
   - Choose **GitHub** as your Git provider
   - Click **Authorize Cloudflare**
   - Grant permissions to access your repositories

4. **Select Repository**
   - Find and select `barbaarapp/Barbaar`
   - Click **Begin setup**

## Step 2: Configure Build Settings

### Basic Configuration

- **Project name:** `barbaar` (or your preference)
- **Branch to deploy:** `main`

### Build Settings

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (leave empty)

### Environment Variables

Add these in the **Environment Variables** section:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
```

## Step 3: Deploy

1. **Click "Save and Deploy"**
   - Cloudflare will build and deploy your site
   - Watch the deployment progress in real-time

2. **Monitor Build**
   - View logs in the **Deployments** tab
   - Expected build time: 2-5 minutes
   - ✅ Green checkmark = Success

3. **Get Your Site URL**
   - After successful deployment
   - Your site will be at: `https://barbaar.pages.dev`

## Step 4: Connect Custom Domain

### If you own a domain with Cloudflare:

1. Go to your domain's DNS settings
2. Create a CNAME record:
   - **Name:** `www` (or your subdomain)
   - **Target:** `barbaar.pages.dev`
   - **Proxy status:** Proxied (orange cloud)

3. In Cloudflare Pages:
   - Go to your project settings
   - **Domain** section
   - **Add custom domain**
   - Enter your domain name
   - Cloudflare will verify and activate

### If domain is elsewhere:

1. Point your domain's nameservers to Cloudflare
2. Add the domain to your Cloudflare account
3. Follow the steps above

## Step 5: Enable SSL/TLS

1. **In Cloudflare Dashboard**
   - Go to your domain
   - Click **SSL/TLS**
   - Set to **Full (strict)** or **Full**

2. **SSL Certificates**
   - Cloudflare automatically provides
   - Renewal is automatic

## Step 6: Configure Redirects (Optional)

Create a `_redirects` file in your `public/` folder if needed:

```
# Redirect all traffic to HTTPS
http://* https://:splat 301

# Redirect www to non-www
http://www.barbaarapp.com/* https://barbaarapp.com/:splat 301
```

## Troubleshooting

### Build Failed: "npm run build" error

**Solution:**
1. Check `package.json` has all dependencies
2. Run locally: `npm install && npm run build`
3. Push changes to GitHub
4. Trigger manual redeploy in Cloudflare

### "Global is not defined" error

**Solution:** This is already fixed in `vite.config.ts`:
```typescript
define: {
  'global': 'globalThis',
}
```

### Firebase connection failed

**Solution:**
1. Verify all environment variables are set
2. Check Firebase security rules allow your domain
3. In Firestore:
   - Go to Rules tab
   - Add your Cloudflare domain to CORS rules

### White blank screen after deployment

**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Check DevTools Console (F12) for errors
3. Check Network tab for failed requests
4. Verify all CSS files loaded (should see .css files in Network)

## Automatic Deployments

Once connected:
- **Any push to `main` branch** → Automatic deployment
- Builds start within seconds
- Rollback available if needed

## Performance Optimization

Cloudflare Pages includes:
- ✅ Global CDN (automatic caching)
- ✅ Automatic image optimization
- ✅ HTTP/2 push
- ✅ Gzip compression

## Useful Links

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/
- **Framework Guides:** https://developers.cloudflare.com/pages/framework-guides/
- **Build Configuration:** https://developers.cloudflare.com/pages/platform/build-configuration/
- **Environment Variables:** https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables

## Deploy Status URLs

- **Production:** https://barbaarapp.pages.dev
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Deployments Tab:** https://dash.cloudflare.com/pages (after setup)

---

**Need Help?**
- Check build logs in Cloudflare dashboard
- Open DevTools (F12) and check Console
- Contact Cloudflare support: https://support.cloudflare.com
