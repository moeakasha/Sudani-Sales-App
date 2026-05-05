# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sudani Sales App — React 19 + TypeScript + Vite SPA backed by Supabase. It is a sales management dashboard for managing sales agents and customer records, with auth-gated pages for Dashboard, Agents, and Customers.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # Production build to dist/ (tsc is NOT run; vite build only — type errors won't fail the build)
npm run preview      # Serve the built dist/
npm run lint         # ESLint flat config (eslint.config.js); type-aware via typescript-eslint
```

There is no test runner configured — do not invent test commands. To type-check explicitly, run `npx tsc --noEmit -p tsconfig.app.json`.

`tsconfig.app.json` is strict and includes `noUnusedLocals` / `noUnusedParameters` / `erasableSyntaxOnly` / `verbatimModuleSyntax`. Use `import type { … }` for type-only imports — plain `import` for types will fail the build.

## Architecture

The repo follows a Clean Architecture / DDD layout under `src/`. Dependencies point inward: `presentation → application → domain`, with `infrastructure` implementing interfaces from `application`.

```
src/
├── domain/            entities (User, LoginCredentials) and use-cases (LoginUseCase)
├── application/       interfaces — currently just IAuthRepository
├── infrastructure/    Supabase client, AuthContext, AuthRepository, i18n/, storage/
└── presentation/      pages/, components/, styles/
```

Key flow to understand before changing auth or data fetching:

- **Single Supabase client** lives at `src/infrastructure/supabase/client.ts`. Auth uses `persistSession: true` with custom `storageKey: 'sudani-sales-auth'` in localStorage. **The URL and anon key are currently hardcoded** in this file (not read from `import.meta.env.VITE_SUPABASE_*` despite what the README and `docs/SECURITY.md` say). Treat this as known tech debt — don't be surprised by it, and don't "fix" it without confirming the user wants the env-var migration.
- **Auth state** is global via `AuthProvider` ([src/infrastructure/auth/AuthContext.tsx](src/infrastructure/auth/AuthContext.tsx)), which wraps the whole app in [src/App.tsx](src/App.tsx) and exposes `useAuth()` returning `{ user, loading, signOut }`. It subscribes to `supabase.auth.onAuthStateChange`.
- **Route guarding** is `<ProtectedRoute>` ([src/presentation/components/ProtectedRoute.tsx](src/presentation/components/ProtectedRoute.tsx)) — it shows a loading view while `loading` is true and redirects to `/` when no user. All non-login routes are wrapped in it.
- **Login uses the layered pattern** (`LoginPage → LoginUseCase → IAuthRepository → AuthRepository → supabase`). Other pages (DashboardContent, AgentsPage, CustomersPage) call the Supabase client **directly** and do not go through a repository — there is no consistent data-access abstraction yet. Match the surrounding style of the file you are editing rather than introducing a new pattern.

## Supabase data model

Pages depend on these Supabase objects — confirm they exist in the project before assuming queries work:

- Tables: `Agent`, `Customer_Data` (column names use spaces and PascalCase, e.g. `'Full Name'`, `'Agent ID'`, `'Customer_Mobile'` — quote them in `.select()` / `.eq()` calls).
- RPC functions called from the UI:
  - `get_dashboard_metrics()` → `{ total_customers, active_agents, avg_customers_per_day }`
  - `get_daily_customer_counts(days_back)` → daily series for charts
  - `get_agents_paginated(p_search, p_status, p_sort_field, p_sort_order, p_page_size, p_page)` — used by the Agents page; client-side pagination calculations elsewhere use `from/to` ranges.
- RLS is enabled and policies allow authenticated users to read/write. If a query returns empty unexpectedly, the session is the most likely cause.

## Routing

Defined in [src/App.tsx](src/App.tsx) using `react-router-dom@7`:

- `/` → `LoginPage` (public)
- `/dashboard`, `/agents`, `/customers` → wrapped in `ProtectedRoute`
- `*` → redirects to `/`

For SPA deploys, the server must rewrite unknown paths to `index.html` (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Coolify/nginx config is documented there). Without that rewrite, refreshing on `/dashboard` 404s in production.

## UI conventions

- Styling is per-component CSS files (`Foo.tsx` + `Foo.css`) plus MUI (`@mui/material`, `@mui/icons-material`) for icons/components. There is no design-token file — colors and spacing are inline or in component CSS.
- Mobile breakpoint is 768px. Pages that include the sidebar (`DashboardPage`, `AgentsPage`, `CustomersPage`) each maintain their own `isSidebarOpen` state seeded from `window.innerWidth > 768` and a resize listener — this is duplicated by design currently; don't extract it without being asked.
- An `<ErrorBoundary>` wraps `<App />` in [src/main.tsx](src/main.tsx).

## Deployment

Target is Coolify (Nixpacks → `npm install && npm run build` → publish `dist/`). Full nginx SPA-rewrite snippet and platform alternatives (Vercel/Netlify) are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Don't add a `vercel.json` / `_redirects` unless the user is switching platforms.
