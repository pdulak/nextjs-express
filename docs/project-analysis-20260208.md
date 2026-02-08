# Project Analysis: Next.js + Express Monorepo

## Overview
This is a full-stack application managed as a monorepo using `pnpm` workspaces. It consists of a React-based frontend (Next.js) and a Node.js backend (Express).

## Repository Structure
- **Root**: Contains workspace configuration (`pnpm-workspace.yaml`), global environment setup, and development scripts.
- **packages/backend**: Express API server with SQLite database.
- **packages/frontend**: Next.js 16 application.

## 🛠 Tech Stack

### Root & DevOps
- **Package Manager**: `pnpm`
- **Monorepo Management**: `pnpm` workspaces
- **Environment**: Single `.env` file at root, shared by packages.

### Backend (`packages/backend`)
- **Framework**: Express.js
- **Language**: TypeScript (executed via `tsx`)
- **Database**: SQLite
- **ORM**: Sequelize
- **Authentication**: Passport.js (Local + Google OAuth) + `express-session`
- **Key Dependencies**:
  - `bcryptjs`: Password hashing
  - `nodemailer`: Email sending (configured for `maildev` in dev)
  - `cors`: Cross-Origin Resource Sharing

### Frontend (`packages/frontend`)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui, Radix UI
- **Icons**: lucide-react
- **State/Data**: Native React hooks + Context (`AuthContext`)

## 🏗 Architecture & Key Features

### Authentication & Authorization
- **Session-based Auth**: Uses HTTP-only cookies (`connect.sid`).
- **Permissions**: RBAC system with `Permission` and `UserPermission` models.
- **Context**: Frontend has an `AuthContext` to manage user state globally.
- **Middleware**: Backend has `isAuthenticated` and `hasPermission` middleware.

### Database Schema (Sequelize)
- **User**: Core user data.
- **Permission**: System permissions (e.g., 'admin').
- **UserPermission**: Join table for Users <-> Permissions.
- **FeatureFlag**: System-wide toggles (registration, forgot password).
- **BloodPressure**: *Undocumented* model found in `src/models`.

### API Structure
- **Global Prefix**: None (routes mounted at root `/auth`, `/users`, etc.)
- **Routes**:
  - `/auth`: Login, logout, status, Google OAuth.
  - `/users`: User management (likely admin/secure).
  - `/feature-flags`: Feature toggles.
  - `/blood-pressure`: *Undocumented* endpoints.
- **Client**: Custom `fetch` wrapper in `frontend/src/lib/api.ts` handles credentials and base URL.

## 🔍 Key Findings & Observations

1.  **Undocumented Features**:
    - There is a `BloodPressure` model and route (`/blood-pressure`) in the backend which is not mentioned in the `README.md` or `CLAUDE.md`.

2.  **No Testing Framework**:
    - As noted in `CLAUDE.md`, there are no tests configured for either frontend or backend.

3.  **Development Environment**:
    - Validated for `maildev` for local email testing.
    - Seeding scripts (`pnpm seed`) exist to bootstrap the database with an admin user.
    - Environment variables are loaded from the root `.env` using `path.resolve` in both packages.

4.  **Modern Frontend**:
    - Uses the very latest Next.js 16 and React 19, along with Tailwind v4, indicating a bleeding-edge setup.

## Recommendations
- **Documentation**: Update `README.md` to include the Blood Pressure feature.
- **Testing**: Consider adding a testing framework (e.g., Vitest for unit tests, Playwright for E2E).
- **Validation**: Ensure `BloodPressure` endpoints are properly secured if they contain sensitive health data.
