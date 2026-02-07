# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install all dependencies (root)
pnpm dev              # Start both frontend and backend in parallel
pnpm seed             # Interactive CLI to create initial admin user

# Individual packages
pnpm --filter backend dev     # Backend only (tsx watch, port 3001)
pnpm --filter frontend dev    # Frontend only (Next.js, port 3000)
pnpm --filter backend build   # Compile backend TypeScript
pnpm --filter frontend build  # Build frontend for production
pnpm --filter frontend lint   # ESLint
```

No test framework is configured.

## Architecture

**Monorepo** managed by pnpm workspaces with two packages:

- **`packages/backend`** — Express 4 API server with Sequelize ORM, SQLite, Passport.js auth (local + Google OAuth), session-based authentication
- **`packages/frontend`** — Next.js 16 (App Router) with React 19, Tailwind CSS v4, shadcn/ui components

### Environment variables

Single `.env` at project root, loaded by both packages via `dotenv` with `path.resolve(__dirname, ...)`. Key vars: `PORT` (backend, default 3001), `WEBSITE_URL` (frontend URL for CORS/redirects), `API_URL` (backend URL for frontend API calls), `FRONTEND_PORT` (frontend dev port).

### Frontend-backend communication

Frontend uses a fetch wrapper (`src/lib/api.ts`) that always sends `credentials: "include"` for cookie-based sessions. Backend CORS is configured to allow the frontend origin with credentials. All API responses use `{ message: string }` format for errors.

### Authentication flow

- **AuthContext** (`src/context/auth-context.tsx`) wraps the app, provides `useAuth()` hook with `user`, `loading`, `login()`, `logout()`, `refreshUser()`
- Route protection via `useRequireAuth(permission?)` hook — redirects to `/login` or `/` based on auth/permission state
- Backend uses Passport with local (email/password + bcrypt) and Google OAuth2 strategies
- Sessions stored via express-session (24h cookie)

### Data models (Sequelize)

- **User** — email, bcrypt password (optional for OAuth), is_active, activation_hash, reset_hash
- **Permission** / **UserPermission** — many-to-many permission system; checked via `hasPermission(code)` middleware
- **FeatureFlag** — single-row table toggling `registrationActive` and `forgotPasswordActive`

Associations defined in `packages/backend/src/models/index.ts`. Database auto-syncs on startup (no migrations).

### Frontend patterns

- All interactive pages are `"use client"` components
- `@/*` path alias maps to `./src/*`
- shadcn/ui components live in `src/components/ui/`, configured via `components.json`
- Admin pages (`/admin/*`) require `"admin"` permission
- `next.config.ts` exposes `API_URL` to client code via Next.js `env` config

### Backend patterns

- Entry point: `src/index.ts` — loads env, syncs DB, seeds defaults, starts server
- Routes: `src/routes/auth.ts` (public + authenticated), `src/routes/users.ts` and `src/routes/feature-flags.ts` (admin-only, guarded by `isAuthenticated` + `hasPermission("admin")`)
- Email: Nodemailer with SMTP config from env (default localhost:1025 for maildev)
