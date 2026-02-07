# Next.js + Express Monorepo

Full-stack application with authentication and user management.

## Prerequisites

- Node.js 20+
- pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Seed the database with an admin user
pnpm seed

# Start development servers
pnpm dev
```

The frontend runs on http://localhost:3000 and the backend on http://localhost:3001.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start both frontend and backend in dev mode |
| `pnpm seed` | Create initial admin user and permissions |

## Project Structure

```
packages/
  backend/           Express API server
    src/
      config/        Database configuration
      middleware/     Auth middleware (isAuthenticated, hasPermission)
      models/        Sequelize models (User, Permission, UserPermission)
      passport/      Passport strategies (local, Google OAuth)
      routes/        API routes (auth, users)
      scripts/       CLI scripts (seed)
  frontend/          Next.js application
    src/
      app/           Pages (home, login, profile, users)
      components/    UI components and navbar
      context/       React context providers (auth)
      hooks/         Custom hooks (useRequireAuth)
      lib/           Utilities, API client, types
```
