# 🚀 Sudani Sales App

A modern, full-stack sales management application built with React, TypeScript, Vite, and Supabase.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.87.3-green)

## ✨ Features

- 🔐 **Persistent Authentication** - Stay logged in until explicit logout
- 📊 **Real-time Dashboard** - Track customers, agents, and performance metrics
- 👥 **Agent Management** - View and edit agent information
- 📱 **Customer Management** - Comprehensive customer database
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🎨 **Modern UI** - Clean, professional design with animations
- 🔒 **Secure** - RLS policies, protected routes, and session management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Sudani-Sales-App

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

---

## 📁 Project Structure

```
Sudani-Sales-App/
├── src/
│   ├── application/          # Business logic interfaces
│   ├── domain/               # Domain entities & use cases
│   ├── infrastructure/       # External services (Supabase, Auth)
│   └── presentation/         # UI components & pages
├── public/                   # Static assets
└── dist/                     # Production build
```

**Architecture:** Clean Architecture with Domain-Driven Design

---

## 🔐 Authentication & Security

### Session Management
- ✅ **Persistent sessions** - Stored in localStorage
- ✅ **Auto token refresh** - Seamless experience
- ✅ **Protected routes** - Authentication required
- ✅ **Global auth context** - Single source of truth

### Security Features
- ✅ **RLS Policies** - Database-level security
- ✅ **Protected routes** - Client-side route guards
- ✅ **Session validation** - On every request
- ✅ **Error boundaries** - Graceful error handling

### Environment Variables

**IMPORTANT:** Create a `.env` file:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Never commit `.env` files to git!

---

## 🗄️ Database Setup

### Required Tables

1. **Agent** - Sales agent information
2. **Customer_Data** - Customer records
3. **audit_logs** (optional) - For SOC2 compliance

### RLS Policies Applied

All tables have Row Level Security enabled:

```sql
-- Authenticated users can read
CREATE POLICY "Allow authenticated users to read"
ON table_name FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can write
CREATE POLICY "Allow authenticated users to write"
ON table_name FOR INSERT, UPDATE, DELETE
TO authenticated
WITH CHECK (true);
```

**Status:** ✅ RLS policies active and enforced

---

## 📱 Mobile Responsive Design

### Breakpoints
- **Desktop**: ≥1024px
- **Tablet**: 768px-1023px
- **Mobile**: 480px-767px
- **Small Mobile**: 320px-479px

### Mobile Features
- ✅ Hamburger menu with slide-in sidebar
- ✅ Card view for tables on mobile
- ✅ Touch-optimized tap targets (44px+)
- ✅ Responsive typography and spacing
- ✅ Backdrop overlays for modals/menus

---

## 🚀 Deployment (Coolify)

### Simple Static Site Deployment

**Coolify Configuration:**
```
Build Pack: Nixpacks
Build Command: npm install && npm run build
Publish Directory: dist
Port: 3000
```

### Nginx Configuration for SPA Routing

```nginx
server {
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Important:** Add this nginx config in Coolify to prevent 404 errors on page refresh.

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

### Key Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Supabase** - Backend & authentication
- **React Router** - Client-side routing
- **Lottie** - Animations

---

## 🔧 Troubleshooting

### White Page After Deployment
**Solution:** Clear browser cache
```javascript
localStorage.clear();
location.reload();
```

### 404 on Refresh (Production)
**Solution:** Enable SPA redirect in Coolify or add nginx config above

### Session Lost on Refresh
**Solution:** Check if `.env` variables are set correctly in production

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Features Overview

### Dashboard Page
- Total customers count
- Active agents count
- Average customers per day
- Weekly performance chart
- Monthly performance chart
- Top performing agents list

### Agents Page
- View all agents
- Edit agent information
- Filter by status (active/inactive)
- Export to CSV
- Mobile card view

### Customers Page
- View all customers
- Search by name, ID, phone, or agent
- Sort by multiple fields
- Export to CSV
- Mobile card view

---

## 🎨 UI/UX Features

- ✅ **Animated Footer** - Lottie animation on login
- ✅ **Loading States** - Smooth transitions
- ✅ **Error Handling** - User-friendly messages
- ✅ **Empty States** - Helpful placeholders
- ✅ **Toast Notifications** - Action feedback
- ✅ **Modal Dialogs** - Edit functionality

---

## 🔒 SOC2 Compliance Recommendations

### To Achieve SOC2 Compliance:

1. **Audit Logging** - Track all user actions
2. **Data Encryption** - Encrypt sensitive PII
3. **Access Control** - Implement RBAC
4. **Monitoring** - Add Sentry or similar
5. **Backup Policy** - Regular database backups
6. **Incident Response** - Document procedures

> See inline comments in code for detailed security implementations.

---

## 📝 Environment Variables Reference

```bash
# Required
VITE_SUPABASE_URL=           # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=      # Your Supabase anon/public key

# Optional (for monitoring)
VITE_SENTRY_DSN=             # Sentry error tracking
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 🆘 Support

For issues or questions:
- Check the troubleshooting section above
- Review browser console for errors
- Verify environment variables are set
- Check Supabase dashboard for RLS policies

---

## 🎉 What's New

### Latest Updates
- ✅ **Animated Footer** - Beautiful Lottie animation
- ✅ **Persistent Auth** - No more session timeouts
- ✅ **Mobile Responsive** - Perfect mobile experience
- ✅ **RLS Policies** - Database security enabled
- ✅ **Error Boundaries** - Graceful error handling
- ✅ **Production Ready** - Optimized for deployment

---

**Built with ❤️ using React, TypeScript, and Supabase**

---

## 📚 Additional Notes

### Session Behavior
- Sessions persist in localStorage
- Auto-refresh before token expiry
- Only logout when user clicks logout button
- No unexpected session drops

### Mobile Menu
- Sidebar closed by default on mobile
- Opens with hamburger button
- Backdrop overlay when open
- Auto-closes when route changes

### Performance
- Lazy loading components
- Optimized bundle size
- Image optimization
- Gzip compression enabled

---

*Last Updated: December 2024*
*Version: 1.0.0*
