# 🔄 Multi-Host Deployment Guide: Vercel + Cloudflare

## Problem Explained

Running one GitHub repo on TWO different hosts creates conflicts:

| Issue | Problem | Solution |
|-------|---------|----------|
| **Build Outputs** | Different locations expected | Use `dist/` for both |
| **Environment Variables** | Different variable names | Use consistent `VITE_*` prefix |
| **Redirects** | Different redirect syntax | Set up in each platform separately |
| **API Routes** | Server code vs Functions | Use Vercel for Express server |

## Current Setup Status

✅ **Vercel** - Working (uses Express server in `server.ts`)
❌ **Cloudflare** - Not deploying (needs Pages Functions setup)

## Why Cloudflare is Failing

**Root Cause:** Your project is optimized for Vercel's serverless functions (Express), not Cloudflare Pages Functions.

Cloudflare Pages expects:
- Static site in `dist/`
- Functions in `functions/` folder
- Different API structure

## Solution: Optimize for BOTH

### Option 1: Keep Vercel Primary (Recommended)
- Keep Vercel as your main production
- Use Cloudflare as backup/staging
- Requires minimal changes

### Option 2: Use Cloudflare Pages + Workers
- Use Cloudflare Pages for static files
- Use Cloudflare Workers for API
- More complex but better performance

### Option 3: Single Host Focus (Simplest)
- Deploy only to Vercel
- Remove Cloudflare connection
- Remove complexity

**I recommend Option 1.** Here's how to fix it:

---

## Fix: Make Cloudflare Work with Your Vercel Setup

### Step 1: Update Cloudflare Build Config

In **Cloudflare Pages Dashboard**:

1. Go to your project → Settings
2. Build and Deployments section
3. Set these EXACT values:

   ```
   Framework: Vite
   Build command: npm run build
   Build output directory: dist
   Root directory: (leave blank)
   ```

### Step 2: Set Environment Variables in Cloudflare

**IMPORTANT:** All variable names must start with `VITE_`

Add these in Cloudflare Pages → Settings → Environment Variables:

```
Production Environment:
  VITE_FIREBASE_API_KEY = your_firebase_api_key
  VITE_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID = your_project_id
  VITE_FIREBASE_STORAGE_BUCKET = your-project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
  VITE_FIREBASE_APP_ID = your_app_id
  VITE_GEMINI_API_KEY = your_gemini_api_key
  NODE_ENV = production
```

**Make sure these match your Vercel environment variables!**

### Step 3: Handle API Routes

Your `server.ts` uses Express, but Cloudflare Pages doesn't support Node.js Express directly.

**Two options:**

**Option A: API via Vercel Only (Recommended)**
- Let Vercel handle API calls
- Cloudflare serves only static files + redirects to Vercel for API
- In `CLOUDFLARE-TROUBLESHOOTING.md` under API Routes section

**Option B: Migrate API to Cloudflare Workers**
- Create separate Cloudflare Worker for API
- More complex, better performance

For now, let's use **Option A**.

### Step 4: Update Files for Multi-Host Compatibility

Create a smart configuration that detects the host:

---

## Implementation: Make Both Work

### Update `vite.config.ts`

Your current config is good. Just ensure:

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // ... existing config
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'global': 'globalThis',
    },
    // ... rest of config
  };
});
```

### Create `config/hosts.config.ts`

New file to detect which host is running:

```typescript
// config/hosts.config.ts
export const HOSTS = {
  VERCEL: 'vercel.app',
  CLOUDFLARE: 'pages.dev',
  LOCAL: 'localhost',
};

export function detectHost(): string {
  if (typeof window === 'undefined') return 'server';
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('vercel.app')) return 'VERCEL';
  if (hostname.includes('pages.dev')) return 'CLOUDFLARE';
  if (hostname.includes('localhost')) return 'LOCAL';
  
  return 'CUSTOM';
}

export const HOST = detectHost();
```

### Update `src/firebase.ts`

Ensure it uses environment variables correctly:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## Comparison: Vercel vs Cloudflare

| Feature | Vercel | Cloudflare |
|---------|--------|-----------|
| Static Files | ✅ | ✅ |
| Node.js API | ✅ (Serverless) | ⚠️ (Workers) |
| Express Support | ✅ | ❌ |
| Build Speed | Fast | Faster |
| CDN | Global | Faster Global |
| Free Tier | 100GB/mo | Unlimited |
| API Support | Full Node.js | Limited |
| Price | $20+/mo | Free-$200/mo |

---

## Step-by-Step Fix

### For Cloudflare to Work:

1. **In Cloudflare Dashboard:**
   - Project Settings
   - Build & Deployments
   - Set: `npm run build` → `dist`

2. **Add Environment Variables:**
   - Settings → Environment Variables
   - Add all `VITE_*` variables
   - Match your Vercel settings

3. **Test Build Locally:**
   ```bash
   npm install
   npm run build
   ls -la dist/  # Should have index.html and assets
   ```

4. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix multi-host configuration"
   git push origin main
   ```

5. **Trigger Cloudflare Rebuild:**
   - Deployments tab
   - Click "Retry build" on latest failed deploy

6. **Check Build Logs:**
   - If still fails, click deployment
   - View build logs at bottom
   - Screenshot errors

### For Vercel (Already Working):

Keep current setup, no changes needed!

---

## API Routes Configuration

### For Vercel (Your Main API Host):

Keep using `server.ts` with Express. ✅ Already working!

### For Cloudflare (Static + Redirect):

API calls redirect to Vercel:

**In `public/_redirects` (for testing):**
```
/api/*  https://your-vercel-url.vercel.app/api/:splat  200
```

Or in code, detect host and route accordingly:

```typescript
// src/services/apiClient.ts
import { detectHost } from '@/config/hosts.config';

export const getApiUrl = () => {
  const host = detectHost();
  
  if (host === 'CLOUDFLARE' || host === 'CUSTOM') {
    // Route to Vercel for API
    return 'https://your-vercel-url.vercel.app';
  }
  
  // Local or Vercel
  return '';
};
```

---

## Troubleshooting Multi-Host Issues

### Issue: "Build works locally but fails on Cloudflare"

**Solution:**
```bash
# Clear and rebuild
npm run clean
npm install --legacy-peer-deps
npm run build

# Check dist folder
ls -la dist/
# Should have: index.html, assets/, manifest.json, etc
```

### Issue: "API calls work on Vercel but fail on Cloudflare"

**Solution:** Add CORS headers in your Express server (`server.ts`):
```typescript
app.use(cors({
  origin: [
    'https://your-vercel-url.vercel.app',
    'https://barbaar.pages.dev',
    'https://yourdomain.com',
    'http://localhost:3000',
  ],
  credentials: true,
}));
```

### Issue: "Different results on Vercel vs Cloudflare"

**Solution:** Check environment variables match:
```bash
# Vercel Dashboard
Settings → Environment Variables → Check all VITE_* vars

# Cloudflare Dashboard
Settings → Environment Variables → Check all VITE_* vars

# Should be identical!
```

---

## Recommended Setup

**Keep things simple:**

```
GitHub (main branch)
    ↓
├─→ Vercel (Primary - API + Static)
│   └─ Full Node.js Express support
│
└─→ Cloudflare Pages (Backup - Static only)
    └─ Redirects API to Vercel for now
```

This way:
- ✅ One codebase
- ✅ Two deployment targets
- ✅ Vercel is backup if Cloudflare fails
- ✅ No complex multi-host logic

---

## Action Items

1. [ ] Set `npm run build` → `dist` in Cloudflare Pages settings
2. [ ] Add all `VITE_*` environment variables in Cloudflare
3. [ ] Run `npm run build` locally to test
4. [ ] Check `dist/` folder has `index.html`
5. [ ] Trigger Cloudflare rebuild
6. [ ] Check build logs if still fails
7. [ ] Keep Vercel as primary (already working)

---

## FAQ

**Q: Can I use the same code for both?**
A: Yes! Your code already supports it. Just need correct build settings.

**Q: Do I need to change my API code?**
A: No, keep `server.ts` as is. Cloudflare will only serve static files.

**Q: Which should be my primary?**
A: Keep Vercel primary since Express API works there natively.

**Q: Should I use Cloudflare Workers for API?**
A: Not needed for now. Keep simple with Vercel handling API.

**Q: Can I use a custom domain on both?**
A: Yes, but point only one primary domain to your "main" host.

---

**Next Step:** Follow "Recommended Setup" section above and let me know if Cloudflare deployment still fails after applying these settings!
