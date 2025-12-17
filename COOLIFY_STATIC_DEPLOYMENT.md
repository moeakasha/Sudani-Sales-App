# 🚀 Coolify Static Site Deployment - Simple Guide

## ✅ Simple Static Site Deployment (No Docker!)

This guide shows you how to deploy your Vite React app as a **static site** using Nixpacks on Coolify.

---

## 📋 Quick Setup in Coolify

### Step 1: Push Your Code
```bash
git add .
git commit -m "Add static site configuration for Coolify"
git push
```

### Step 2: Configure in Coolify Dashboard

1. **Log in to Coolify**
2. **Go to your application**
3. **Click "General" or "Configuration"**
4. **Set these values:**

   ```
   Build Pack: Nixpacks (or leave as Auto)
   Build Command: npm install && npm run build
   Publish Directory: dist
   Install Command: npm install
   Start Command: (leave empty for static sites)
   Port: 3000 (Coolify will auto-detect)
   ```

5. **Important: Enable "Redirect All Routes to Index"**
   - Look for: **"SPA Redirect"** or **"Redirect 404 to Index"**
   - **Enable it** ✅
   - This is what fixes the 404 on refresh!

6. **Save Changes**

### Step 3: Deploy
1. Click **"Redeploy"** or **"Deploy"**
2. Wait 2-3 minutes for build
3. Done! ✅

---

## 🎯 What This Configuration Does

### Build Process:
1. Coolify runs `npm install` → Installs dependencies
2. Coolify runs `npm run build` → Creates optimized `/dist` folder
3. Coolify serves files from `/dist` directory
4. Coolify redirects all routes to `index.html` (when enabled)

### SPA Redirect (Most Important!):
When enabled, this tells Coolify's web server:
```
/dashboard → serve index.html
/agents → serve index.html
/customers → serve index.html
Any route → serve index.html
```

Then React Router handles the routing! ✅

---

## 🔍 Finding the SPA Redirect Setting

The setting might be named differently depending on Coolify version:

**Look for one of these:**
- ✅ "Redirect All Routes to Index"
- ✅ "SPA Mode"
- ✅ "Single Page Application"
- ✅ "404 Redirect to Index"
- ✅ "Rewrite Routes to Index"

**Location:**
Usually in: **General Settings** or **Advanced Settings** or **Build Configuration**

---

## 🐛 Troubleshooting

### Still getting 404 on refresh?

#### Option 1: Enable SPA Redirect (Recommended)
Make sure the "Redirect to Index" setting is **enabled** in Coolify.

#### Option 2: Custom Redirect Rules
If your Coolify doesn't have the SPA redirect option, add this in **Custom Nginx Config** or **Redirect Rules**:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

#### Option 3: Use public/_redirects
The `public/_redirects` file I created should work automatically on some platforms:
```
/*    /index.html   200
```

### Build failing?

**Check these:**
1. `package.json` has correct scripts:
   ```json
   "scripts": {
     "build": "vite build"
   }
   ```

2. Node version compatibility:
   - Coolify usually auto-detects from `.nvmrc` or `package.json`
   - Your app uses Node 20, which is fine

3. Environment variables:
   - Make sure Supabase credentials are set in Coolify

### App loads but routes don't work?

**Solution:**
1. Go to Coolify dashboard
2. Find the SPA redirect setting
3. **Enable it**
4. Redeploy

---

## ✅ Expected Results

### After Deployment:
```
✅ https://your-domain.com/ → Works
✅ https://your-domain.com/dashboard → Works
✅ https://your-domain.com/agents → Works
✅ Refresh any page → Works (no 404!)
✅ Direct URL access → Works
```

---

## 📊 Coolify Configuration Summary

**Perfect configuration for Vite React apps:**

| Setting | Value |
|---------|-------|
| Build Pack | Nixpacks (or Auto) |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| SPA Redirect | ✅ Enabled |
| Port | Auto-detect (3000) |

---

## 🎨 Additional Optimizations (Optional)

### Enable Gzip Compression
In Coolify advanced settings, enable gzip for faster loading.

### Set Cache Headers
Configure cache headers for static assets (if available in settings).

### Environment Variables
Make sure to set any required env vars in Coolify:
- Supabase URL
- Supabase Anon Key
- Any other API keys

---

## 🚀 Deployment Checklist

- [ ] Code committed and pushed to git
- [ ] Coolify connected to your repository
- [ ] Build Pack set to Nixpacks
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `dist`
- [ ] **SPA Redirect enabled** ✅ (Most important!)
- [ ] Environment variables configured
- [ ] Deploy and test all routes

---

## 💡 Why This is Better Than Docker

**Advantages:**
- ✅ **Simpler** - No Dockerfile needed
- ✅ **Faster builds** - Nixpacks is optimized
- ✅ **Auto-updates** - Nixpacks stays updated
- ✅ **Less configuration** - Just a few settings
- ✅ **Native Coolify support** - Works perfectly

---

## 🆘 Still Having Issues?

1. **Check build logs** in Coolify for errors
2. **Verify SPA redirect is enabled**
3. **Test in incognito** to avoid cache
4. **Check browser console** for errors
5. **Verify Supabase credentials** are correct

---

## 🎉 Success!

Once deployed with SPA redirect enabled:
- No more 404 errors ✅
- All routes work perfectly ✅
- Refresh works everywhere ✅
- Direct URL access works ✅

---

*Simple static site deployment - no Docker required!*

