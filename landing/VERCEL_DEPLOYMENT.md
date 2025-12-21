# Vercel Deployment Guide - SmartCare Landing

## 📋 Prerequisites

- [ ] Vercel account (free tier available at vercel.com)
- [ ] GitHub account with SmartCare-Connect repository
- [ ] AWS Amplify Lambda endpoint (already configured)

---

## 🚀 Step 1: Connect GitHub to Vercel

1. Go to **https://vercel.com**
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Search for **"SmartCare-Connect"** and click **Import**
5. Select branch: **main**

---

## ⚙️ Step 2: Configure Project Settings

### Root Directory
- Set to: `landing`
- This tells Vercel to deploy only the landing site

### Framework
- Framework: **Other** (static site)
- Build Command: Leave empty
- Output Directory: `.` (current directory)

### Environment Variables
Add these variables before deploying:

| Variable | Value | Notes |
|----------|-------|-------|
| `API_ENDPOINT` | `https://zon8maijah.execute-api.us-east-1.amazonaws.com/prod` | AWS Lambda endpoint |
| `NODE_ENV` | `production` | Production mode |

**To add environment variables:**
1. In Vercel project settings, go to **Settings > Environment Variables**
2. Add each variable
3. Select scope: **Production, Preview, Development**
4. Click **Save**

---

## 🔧 Step 3: Deploy

### Option A: Automatic Deploy (Recommended)
- Every `git push` to `main` automatically deploys
- No additional steps needed

### Option B: Manual Deploy
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from landing directory
cd c:\Projects\SmartCare-Connect\landing
vercel --prod
```

**When prompted:**
- Project name: `smartcare-landing` (or your preference)
- Link to existing project: Yes (select your project)
- Vercel scope: Your account
- Root directory: `landing`
- Build command: Leave empty
- Output directory: `.`

---

## 🔐 Step 4: Environment Variables (If Using CLI)

When deploying via CLI, Vercel will use the variables from your project settings on vercel.com.

**Verify deployment used correct variables:**
1. Go to Vercel dashboard
2. Select your project
3. Go to **Deployments**
4. Click latest deployment
5. Go to **Environment Variables** tab
6. Confirm `API_ENDPOINT` is set correctly

---

## 📍 Step 5: Custom Domain (Optional)

1. In Vercel project settings, go to **Domains**
2. Add domain: `landing.smartcare.health` (or your domain)
3. Follow DNS configuration instructions from your registrar
4. Vercel will issue free SSL certificate automatically

---

## 🧪 Step 6: Test Deployment

After deployment completes:

### ✅ Basic Tests
```bash
# Test homepage loads
curl https://your-project.vercel.app

# Test page links
curl https://your-project.vercel.app/company.html
curl https://your-project.vercel.app/solution.html
curl https://your-project.vercel.app/clients.html
curl https://your-project.vercel.app/book.html

# Test CSS loads
curl https://your-project.vercel.app/styles.css

# Test JavaScript loads
curl https://your-project.vercel.app/script.js
```

### ✅ Browser Tests
1. Open **https://your-project.vercel.app** (replace with your actual URL)
2. **Navigation:**
   - [ ] Logo links to home
   - [ ] "Our Solution" → solution.html
   - [ ] "Company" → company.html
   - [ ] "Hospitals We Serve" → clients.html
   - [ ] "Book Demo" → book.html
   - [ ] Mobile menu works

3. **Forms:**
   - [ ] Email signup on homepage
   - [ ] Demo form on book.html
   - [ ] Form validation shows errors
   - [ ] Check Network tab → forms POST to AWS endpoint

4. **Mobile:**
   - [ ] Responsive on iPhone 12 (375px)
   - [ ] Responsive on iPad (768px)
   - [ ] Desktop view on laptop

5. **Performance:**
   - [ ] Lighthouse score > 90
   - [ ] Load time < 2 seconds
   - [ ] No console errors

---

## 🔍 Verify API Connectivity

Test that forms connect to AWS Lambda:

1. Open **https://your-project.vercel.app/book.html**
2. Open **Developer Console** (F12)
3. Go to **Network** tab
4. Fill in demo form and submit
5. Look for POST request to AWS endpoint
6. Check response status: **200** = success

**Expected Response:**
```json
{
  "statusCode": 200,
  "body": "Thank you for booking a demo. We'll be in touch within 24 hours."
}
```

---

## 🚨 Troubleshooting

### "404 on book.html"
- [ ] Check root directory is set to `landing`
- [ ] Verify all HTML files exist in /landing folder
- [ ] Redeploy and clear browser cache (Ctrl+Shift+Del)

### "Forms not submitting"
- [ ] Check API_ENDPOINT environment variable is set
- [ ] Verify AWS Lambda is accessible (no CORS errors)
- [ ] Open DevTools Console → check for error messages
- [ ] Test with `curl`:
  ```bash
  curl -X POST https://zon8maijah.execute-api.us-east-1.amazonaws.com/prod \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}'
  ```

### "Styles not loading"
- [ ] Verify styles.css path is correct
- [ ] Check Network tab → styles.css returns 200
- [ ] Clear browser cache

### "Mobile menu not working"
- [ ] Open DevTools Console → check for JS errors
- [ ] Verify script.js loaded (Network tab)
- [ ] Check mobile viewport is set correctly

---

## 📊 Monitoring Deployment

### Real-time Logs
```bash
vercel logs smartcare-landing --follow
```

### Analytics
1. Vercel Dashboard → Project → Analytics
2. Monitor:
   - Page views
   - API requests
   - Response times
   - Error rates

### Performance Metrics
1. Go to **Vercel Dashboard**
2. Select project
3. Check **Web Vitals** tab
4. Monitor Core Web Vitals (LCP, FID, CLS)

---

## 🔄 Redeploy After Code Changes

### Via Git (Recommended)
```bash
# Make code changes locally
git add .
git commit -m "Update landing pages"
git push origin main

# Vercel automatically deploys
```

### Via CLI
```bash
cd c:\Projects\SmartCare-Connect\landing
vercel --prod
```

---

## 📝 Environment Variables Reference

### Vercel Dashboard Setup
1. Go to Project Settings
2. Environment Variables
3. Add/edit variables:

```
API_ENDPOINT
├─ Value: https://zon8maijah.execute-api.us-east-1.amazonaws.com/prod
├─ Production: ✓
├─ Preview: ✓
└─ Development: ✓

NODE_ENV
├─ Value: production
├─ Production: ✓
├─ Preview: ✓
└─ Development: ✓
```

---

## ✅ Final Verification Checklist

After deployment:

- [ ] Site loads without errors
- [ ] All 5 pages accessible
- [ ] Navigation works on all pages
- [ ] Forms submit to AWS endpoint
- [ ] Mobile responsive (tested on device)
- [ ] HTTPS enabled (default on Vercel)
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking works
- [ ] Email form shows success message
- [ ] Demo form shows success message
- [ ] No 404 errors in logs
- [ ] API responses successful (200 status)

---

## 🆘 Support

**If deployment fails:**

1. Check Vercel deployment logs:
   - Dashboard → Deployments → Failed deployment → View logs
   
2. Common errors:
   - **"No such file or directory"** → Check root directory setting
   - **"CORS error"** → Verify AWS endpoint allows requests
   - **"ENV variable undefined"** → Redeploy after setting variables

3. Contact support:
   - Vercel: https://vercel.com/support
   - AWS: https://aws.amazon.com/support

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Deploy (CLI) | `vercel --prod` |
| View logs | `vercel logs smartcare-landing` |
| List environments | `vercel env` |
| Remove deployment | `vercel remove` |
| Check status | `vercel status` |

---

**Version:** 1.0  
**Last Updated:** December 21, 2025  
**Status:** Ready for Production Deployment
