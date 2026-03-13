# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

**Money Saathi** — A Bhutan-focused financial health platform with authentication, onboarding, financial data entry, health scoring, dashboard, loan calculator, advisory engine, and monthly reports. Currency displayed in BTN (Bhutanese Ngultrum).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + Recharts + Framer Motion + wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, path /api)
│   ├── money-saathi-v1/    # React+Vite frontend (path /)
│   └── mockup-sandbox/     # Component preview server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Auth Architecture

- **Cookie-based sessions**: HMAC-SHA256 signed session tokens (`session` cookie) via `artifacts/api-server/src/lib/session.ts`; `SESSION_SECRET` env var or random on startup; `secure: true` in production only.
- **Frontend auth**: React Context (`AuthProvider` in `use-auth.tsx`) — NOT React Query for auth state
  - `fetchUser()` calls `/api/auth/me` once on mount
  - `login()`, `register()`, `logout()` update context state directly
  - `refreshUser()` re-fetches `/api/auth/me` (used after profile creation)
- **API middleware**: `requireAuth` reads `req.cookies.userId`
- **Important**: Auth was switched from React Query `useGetMe` to manual Context because React Query's refetch behavior caused infinite 401 loops when unauthenticated

## Database Tables

users, profiles, income_entries, expense_entries, obligations, savings_entries, financial_scores, loan_calculations, reports

## Frontend Pages

- `/login` — Login/Register with split-screen design
- `/onboarding` — Profile type selection (Individual / Small Business)
- `/dashboard` — Verdict Layer (score ring, main risk, next best action), metric cards with granular empty-state hints, income vs expenses chart, top recommendation
- `/data-entry` — Tabbed CRUD for income, expenses, obligations, savings
- `/score` — Health score breakdown (4 components: savings, debt, emergency fund, expenses)
- `/loans` — Loan calculator with EMI, affordability analysis
- `/advisory` — AI-generated financial recommendations
- `/reports` — Monthly financial reports with verdict strip (main risk + next action) and granular metric hints

## Key Patterns

- Currency: BTN displayed as `Nu. X`
- Financial score: 0-100 (4 components, each 0-25)
- Orval mutations require `{ data: bodyPayload }` wrapping
- Delete mutations use `{ id: number }` directly
- `credentials: 'include'` is set in `lib/api-client-react/src/custom-fetch.ts`
- The `calculateScore` and `generateReport` mutations expect empty `{}` argument

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with cookie-parser. Routes at `/api`: auth, profiles, income, expenses, obligations, savings, scores, loans, advisory, reports, dashboard.

### `artifacts/money-saathi-v1` (`@workspace/money-saathi-v1`)

React + Vite frontend. Uses TailwindCSS v4, Recharts for charts, Framer Motion for animations, wouter for routing.

### `lib/db` (`@workspace/db`)

Drizzle ORM with PostgreSQL. 9 tables for the financial platform.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and custom fetch client with `credentials: 'include'`.
