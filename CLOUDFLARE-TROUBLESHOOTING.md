# Cloudflare Deployment Troubleshooting Guide

## Common Issues & Solutions

### 1. **Build Failed: "Deploying to Cloudflare's global network" Hangs**

**Symptoms:**
- Build shows "Deploying..." but never completes
- Stuck at the global network deployment step

**Solutions:**

**A. Check Build Logs**
1. Go to Cloudflare Pages dashboard
2. Click on your deployment
3. Click "View build log"
4. Look for error messages

**B. Common Build Errors**

- **"Cannot find module..."**
  ```
  Solution: 
  - npm install locally and test: npm run build
  - Push fixed code to GitHub
  - Trigger redeploy
  ```

- **"ENOENT: no such file or directory"**
  ```
  Solution:
  - Check file paths are correct
  - Verify output directory exists
  - Rebuild locally first
  ```

- **"Out of memory"**
  ```
  Solution:
  - Cloudflare's build environment has limits
  - Try building smaller/optimized bundles
  - Use rollup externals for large dependencies
  ```

### 2. **Environment Variables Not Set**

**Symptoms:**
- Firebase connection fails
- API key undefined errors
- Blank screens in production

**Solutions:**

1. **Verify Variables in Cloudflare**
   - Cloudflare Pages → Your project
   - Settings → Environment Variables
   - Check all required variables are set:
     ```
     VITE_FIREBASE_API_KEY
     VITE_FIREBASE_AUTH_DOMAIN
     VITE_FIREBASE_PROJECT_ID
     VITE_FIREBASE_STORAGE_BUCKET
     VITE_FIREBASE_MESSAGING_SENDER_ID
     VITE_FIREBASE_APP_ID
     VITE_GEMINI_API_KEY
     ```

2. **Important:** Variable names must start with `VITE_` for client-side access
   - Client can see: `VITE_*` variables
   - Server-only: Regular env vars (in Functions only)

3. **Test Locally:**
   ```bash
   # Create .env file in root
   VITE_FIREBASE_API_KEY=your_key
   # ... other vars
   
   npm run build
   npm run preview
   ```

### 3. **"Global is not defined" Error**

**Already Fixed** in your `vite.config.ts`:
```typescript
define: {
  'global': 'globalThis',
}
```

If still seeing this:
1. Clear Cloudflare cache
2. Force rebuild by pushing empty commit:
   ```bash
   git commit --allow-empty -m "Trigger rebuild"
   git push origin main
   ```

### 4. **White Blank Screen on Deploy**

**Symptoms:**
- Works locally but blank on Cloudflare
- DevTools shows no errors

**Solutions:**

1. **Hard Refresh (IMPORTANT)**
   - Mac: Cmd+Shift+R
   - Windows: Ctrl+Shift+R
   - This bypasses Cloudflare cache

2. **Clear Browser Cache**
   - Chrome/Edge: Settings → Privacy → Clear browsing data
   - Select "All time" and "Cached images and files"
   - Check "Cookies and other site data"

3. **Check CSS Loading**
   - Open DevTools (F12)
   - Go to Network tab
   - Refresh page
   - Look for .css files
   - If 404 errors: CSS build failed
   - If slow load: Cache issue

4. **Check Console for Errors**
   - DevTools → Console tab
   - Look for red error messages
   - Screenshot errors for debugging

5. **Test in Incognito Mode**
   - Open new Incognito/Private window
   - Go to your Cloudflare Pages URL
   - This completely bypasses browser cache

### 5. **Firebase Connection Fails in Production**

**Symptoms:**
- "Firebase: app-check-error"
- Can't authenticate users
- Firestore queries fail

**Solutions:**

1. **Check Firebase Configuration**
   - Go to Firebase Console
   - Project Settings
   - Verify all keys match environment variables

2. **Enable CORS in Firebase**
   - Firestore Rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **Add Cloudflare Domain to Allowed Domains**
   - Firebase Console → Authentication
   - Settings tab
   - Authorized domains
   - Add your Cloudflare Pages domain (barbaar.pages.dev)
   - Add your custom domain if using one

4. **Check App Check (if enabled)**
   - Firebase Console → App Check
   - Add Cloudflare as allowed provider
   - Disable temporarily for testing

### 6. **Deployment Takes Too Long**

**Normal build times:**
- First deployment: 5-10 minutes
- Subsequent builds: 2-5 minutes
- Maximum: 15 minutes before timeout

**If exceeding timeout:**

1. **Optimize Build**
   ```bash
   # Test locally
   npm run clean
   npm run build
   # Check dist size
   du -sh dist/
   ```

2. **If build is large (>50MB):**
   - Remove unused dependencies
   - Check for large assets
   - Use code splitting

3. **Check Network**
   - Cloudflare pages sometimes slow with large uploads
   - Wait and retry if network issue

### 7. **Database Connection Fails**

**Solutions:**

1. **For Supabase:**
   - Check VITE_SUPABASE_URL and VITE_SUPABASE_KEY set
   - Verify project is active in Supabase dashboard
   - Check network requests in DevTools

2. **For Firebase:**
   - Follow Firebase troubleshooting above
   - Check security rules allow your domain

### 8. **API Routes Not Working**

**Solutions:**

1. **Functions Middleware**
   - Check `functions/_middleware.ts` exists
   - Should be at root of project
   - Not inside `src/`

2. **Test API Locally**
   ```bash
   npm run dev
   # Test endpoint: curl http://localhost:3000/api/your-endpoint
   ```

3. **Check Cloudflare Pages Functions**
   - Cloudflare may have size/time limits
   - For complex APIs, use Cloudflare Workers instead

## Debug Checklist

Before opening support ticket, verify:

- [ ] Build logs don't show errors
- [ ] Environment variables all set in Cloudflare
- [ ] Code pushed to GitHub main branch
- [ ] Hard refresh done (Cmd/Ctrl+Shift+R)
- [ ] Tried incognito mode
- [ ] DevTools console checked for errors
- [ ] Network tab shows all resources loading
- [ ] Firebase domain added to authorized list
- [ ] Node version compatible (14+)
- [ ] npm install runs locally without errors

## Getting Help

1. **Cloudflare Support:** https://support.cloudflare.com
2. **Cloudflare Docs:** https://developers.cloudflare.com/pages/
3. **Firebase Support:** https://firebase.google.com/support
4. **GitHub Issues:** Create issue in your repo

## Emergency Rollback

If latest deployment broken:

1. Go to Cloudflare Pages dashboard
2. Click Deployments
3. Find last working deployment (green checkmark)
4. Click ⋮ (three dots)
5. Click "Rollback to this deployment"

This reverts to previous version instantly.

---

**Last Updated:** April 25, 2026
**Status:** Ready for Cloudflare Pages deployment
