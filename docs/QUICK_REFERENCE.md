# ⚡ Quick Reference Guide

## 🚀 Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Check code quality

# Troubleshooting
npm install              # Reinstall dependencies
rm -rf node_modules && npm install  # Clean install
```

---

## 📂 Project Structure

```
Sudani-Sales-App/
├── src/
│   ├── domain/              # Business logic
│   ├── application/         # Use cases & interfaces
│   ├── infrastructure/      # External services (Supabase, Auth)
│   └── presentation/        # UI (components & pages)
├── docs/                    # Documentation
│   ├── DEPLOYMENT.md        # How to deploy
│   ├── SECURITY.md          # Security guidelines
│   └── QUICK_REFERENCE.md   # This file
└── public/                  # Static assets
```

---

## 🔐 Quick Fixes

### Clear Browser Cache
```javascript
localStorage.clear();
location.reload();
```

### 404 on Production Refresh
Add to Coolify nginx config:
```nginx
try_files $uri $uri/ /index.html;
```

### Session Issues
1. Check `.env` variables are set
2. Verify Supabase credentials
3. Clear localStorage and re-login

---

## 📱 Responsive Breakpoints

| Device | Width | Behavior |
|--------|-------|----------|
| Desktop | ≥1024px | Sidebar always visible |
| Tablet | 768-1023px | Sidebar toggleable |
| Mobile | ≤767px | Sidebar hidden, hamburger menu |

---

## 🎯 Key Features

- **Authentication:** Persistent until logout
- **Mobile:** Fully responsive with card views
- **Security:** RLS policies enabled
- **Animation:** Lottie footer animation
- **Export:** CSV export functionality

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| White page | Clear localStorage |
| 404 on refresh | Add nginx config |
| Build fails | Clean install dependencies |
| Session lost | Check environment variables |

---

## 📚 Documentation

- **README.md** - Main documentation
- **docs/DEPLOYMENT.md** - Deployment guide
- **docs/SECURITY.md** - Security & compliance
- **docs/QUICK_REFERENCE.md** - This file

---

*Quick reference for Sudani Sales App*





