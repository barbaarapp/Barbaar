# 🚀 Barbaar Vercel Deployment Guide

## Migration from Netlify to Vercel

This guide explains how to deploy Barbaar to Vercel and set up continuous deployment from GitHub.

## Prerequisites

- GitHub account with repository access: https://github.com/barbaarapp/Barbaar
- Vercel account: https://vercel.com
- Access to project environment variables

## Step-by-Step Deployment

### Step 1: Connect GitHub Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Paste: `https://github.com/barbaarapp/Barbaar`
5. Click "Continue"

### Step 2: Import Project

1. Select "barbaarapp" as the GitHub organization
2. Select "Barbaar" as the repository
3. Click "Import"

### Step 3: Configure Project Settings

**Project Settings:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Root Directory:** `.` (default, leave as is)

### Step 4: Environment Variables

Add these environment variables in Vercel dashboard:

```
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_key>
GEMINI_API_KEY=<your_gemini_key>
SMTP_USER=barbaaryp@gmail.com
SMTP_PASS=<your_smtp_password>
VITE_APP_URL=https://barbaar-phi.vercel.app
NODE_ENV=production
```

**How to Add Environment Variables:**
1. In Vercel dashboard, go to project settings
2. Click "Environment Variables"
3. Add each variable from above
4. Click "Save"

### Step 5: Deploy

1. Click "Deploy" button
2. Wait for deployment to complete (2-5 minutes)
3. You should see a green checkmark when done

### Step 6: Verify Deployment

1. Visit: https://barbaar-phi.vercel.app/
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Check that:
   - ✅ Auth screen appears (or home if already logged in)
   - ✅ No white blank screen
   - ✅ Text is readable
   - ✅ Colors are visible

## Automatic Deployments

Once connected, the following happens automatically:

| Event | Action |
|-------|--------|
| Push to `main` branch | Auto-deploy to production |
| Push to other branches | Deploy preview to unique URL |
| Pull request | Creates deployment preview |

## Domain Configuration

### Current Domain
- **Production:** https://barbaar-phi.vercel.app/

### To Add Custom Domain
1. In Vercel dashboard, go to project settings
2. Click "Domains"
3. Enter your custom domain (e.g., `app.barbaar.org`)
4. Follow DNS configuration steps
5. Wait for DNS propagation (can take 24-48 hours)

## Project Structure for Vercel

```
barbaar/
├── dist/                  # Build output (created by npm run build)
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── ...
├── public/
│   ├── index.html
│   └── ...
├── vite.config.ts         # Vite configuration
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── tailwind.config.js     # Tailwind configuration
```

## Vercel Configuration Files

### vercel.json
Specifies build and deployment settings:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### .vercelignore
Files to exclude from deployment:
```
.git
.gitignore
README.md
node_modules
.vercel
```

## Troubleshooting

### Build Failed

**Check logs:**
1. Go to Vercel dashboard
2. Click project "Deployments"
3. Click failed deployment
4. View build logs

**Common issues:**
- Missing environment variables
- Dependency installation failed
- Port already in use
- TypeScript errors

### Site Shows Blank/White Screen

1. Hard refresh: Cmd+Shift+R
2. Clear cache: Settings → Privacy → Clear browsing data
3. Check browser console (F12) for errors
4. Verify Vercel deployment logs

### Deployment Stuck

1. Check GitHub Actions (if enabled)
2. Check Vercel deployment status
3. Try manual redeploy from Vercel dashboard
4. Check if build command changed

## Git Workflow

### Deploying Updates

1. Make changes to code
2. Commit changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
3. Push to GitHub:
   ```bash
   git push origin main
   ```
4. Vercel automatically deploys within seconds

### Creating Preview Deployments

1. Create feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```
2. Make changes and push:
   ```bash
   git push origin feature/new-feature
   ```
3. Open pull request on GitHub
4. Vercel creates preview URL automatically
5. Test on preview before merging

## Production Checklist

Before going live:

- [ ] All environment variables set
- [ ] Firebase credentials configured
- [ ] SMTP settings configured
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate enabled (auto with Vercel)
- [ ] Build completes without errors
- [ ] Site loads without white screen
- [ ] Auth works (email/Google sign-in)
- [ ] Home page displays correctly
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] No console errors

## Monitoring & Analytics

### View Deployment Status
- Dashboard: https://vercel.com/dashboard
- Project Settings → Deployments

### View Logs
1. Go to Vercel dashboard
2. Click project
3. Click "Deployments"
4. Click specific deployment
5. View build logs

### Performance Analytics
- Vercel provides analytics on dashboard
- Check page performance metrics
- Monitor API response times

## Performance Optimization

### Built-in Optimizations
- ✅ Automatic image optimization
- ✅ Code splitting (configured in vite.config.ts)
- ✅ Gzip compression
- ✅ CDN caching

### Your Optimizations
- Use lazy loading for images
- Implement route-based code splitting
- Optimize Firebase queries
- Cache frequently accessed data

## Rollback & Recovery

### Rollback to Previous Deployment

1. Go to Vercel dashboard
2. Click project → Deployments
3. Find successful previous deployment
4. Click "..." menu
5. Select "Redeploy"

### Recovery from Failed Deploy

1. Check deployment logs for errors
2. Fix issues in code
3. Push corrected code to GitHub
4. New deployment automatically triggers

## Database & API Configuration

### Firebase Setup
- Credentials stored as environment variables
- No sensitive data in code
- Using Firebase Emulator for local development (optional)

### API Endpoints
- Update API URLs in environment variables
- Use `VITE_APP_URL` for front-end URL
- Configure backend API routes as needed

## Security

### Environment Variables
- Never commit `.env` files
- All secrets stored in Vercel dashboard
- Encrypted at rest and in transit

### SSL/TLS
- Automatically enabled by Vercel
- Free SSL certificates
- HTTPS enforced by default

### CORS Configuration
- Configured in backend/API routes
- Verify allowed origins include Vercel domain
- Update CORS for custom domains

## Support & Resources

| Resource | Link |
|----------|------|
| Vercel Docs | https://vercel.com/docs |
| GitHub Actions | https://github.com/features/actions |
| Vite Docs | https://vitejs.dev |
| React Docs | https://react.dev |
| Firebase Docs | https://firebase.google.com/docs |

## Next Steps

1. ✅ Code pushed to GitHub
2. ⏳ Connect repository to Vercel
3. ⏳ Set environment variables
4. ⏳ Deploy to production
5. ✅ Test on https://barbaar-phi.vercel.app/
6. 📊 Monitor performance
7. 🔄 Set up continuous deployment

---

**Last Updated:** 2026-04-23  
**Repository:** https://github.com/barbaarapp/Barbaar  
**Live Domain:** https://barbaar-phi.vercel.app/  
**Status:** Ready for Vercel Deployment ✅
