# 🚀 Deployment Guide

## Coolify Deployment (Recommended)

### Quick Setup

**Coolify Configuration:**
```
Build Pack: Nixpacks
Build Command: npm install && npm run build
Publish Directory: dist
Port: 3000 (auto-detect)
```

### Fix 404 on Refresh

**Add this nginx configuration in Coolify:**

```nginx
server {
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Don't cache index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Cache static assets for 1 year
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Why?** This ensures all routes redirect to `index.html` so React Router can handle routing.

---

## Environment Variables

Set these in Coolify:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Testing Deployment

After deployment, test:
- ✅ Visit homepage
- ✅ Login successfully
- ✅ Navigate to `/dashboard`
- ✅ **Refresh the page** → Should work (no 404)
- ✅ Direct URL access → Should work

---

## Other Platforms

### Vercel
Create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Netlify
Create `public/_redirects`:
```
/*    /index.html   200
```

---

## Build Optimization

The production build includes:
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Minification
- ✅ Asset optimization
- ✅ Gzip compression

**Build size:** ~533KB (160KB gzipped)

---

*For detailed troubleshooting, see main README.md*





