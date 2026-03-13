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

## Dual Financial Mode (Individual vs Small Business)

- **Profile type** stored in `user_profiles.profile_type` (`individual` | `small_business`)
- Auth responses (`/api/auth/me`, login, register) include `profileType` field
- **Individual scoring**: savingsRatio, debtRatio, emergencyFundCoverage, expenseRatio (each 0–25)
- **Business scoring**: profitMargin, debtRatio, cashReserveMonths, revenueStabilityRatio (each 0–25)
  - Revenue stability uses HHI-based income concentration: more diversified sources = higher score
  - Cash reserve target: 3 months (vs 6 months emergency fund for individuals)
- `getProfileType(userId)` in `financialEngine.ts` detects mode
- Dashboard, Scores, Reports routes all detect profile type and use correct engine
- Business score maps to DB columns: savingsRatio→profitMargin, emergencyFundCoverage→cashReserveMonths, expenseRatio→revenueStabilityRatio
- Frontend dashboard: `ModeBadge`, `IndividualMetrics`/`BusinessMetrics` components
- Data entry: `useLabels()` hook relabels tabs per mode; structured dropdown categories defined in `src/lib/categories.ts`
- Score page: different breakdown labels per mode
- Business obligation types use valid backend enums (loan/mortgage/credit_card/other) with relabeled UI text

## Structured Data Entry (categories.ts)

- All 4 modules (Income, Expenses, Obligations, Savings) use structured dropdown categories
- Individual vs Business category sets defined in `artifacts/money-saathi-v1/src/lib/categories.ts`
- **Income**: category dropdown + source name + amount + frequency + date + note
- **Expenses**: category dropdown + amount + frequency + payment mode + date + note
- **Obligations**: category dropdown + lender name + outstanding amount + EMI + interest rate + type + start/end/due dates + priority + note
- **Savings**: category dropdown + savings type + institution + name + amount + monthly contribution + expected return + start/maturity dates + linked goal + note
- Edit flow: pencil icon opens modal pre-filled with existing data
- Payment modes: Cash, Bank Transfer, UPI/Mobile Pay, Credit Card, Debit Card, Cheque, Auto Debit, Other

## Frontend Pages

- `/login` — Login/Register with split-screen design
- `/onboarding` — Profile type selection (Individual / Small Business)
- `/dashboard` — Mode-aware: Verdict Layer, metric cards (Individual: Net Savings/Debt Ratio/Emergency Fund, Business: Net Profit/Debt-to-Revenue/Cash Reserve), Financial Insights Engine (automated insight cards with severity, explanation, action, literacy links), Best Next Options (Recommendation Matching Engine — up to 3 matched bank products or caution card), Income vs Expenses chart, Financial Progress section (4 summary cards with trend indicators, 4 mini charts: Score Trend/Savings or Profit Trend/Debt Trend/Reserve Growth, Financial Milestones timeline), top recommendation
- `/data-entry` — Mode-aware tabbed CRUD (Individual: Income/Expenses/Personal Loans/Savings, Business: Revenue/Operating Expenses/Business Loans/Cash Balance)
- `/score` — Mode-aware health score breakdown (Individual: Savings/Debt/Emergency/Expenses, Business: Profit Margin/Debt-to-Revenue/Cash Reserve/Revenue Stability)
- `/loans` — Loan calculator with EMI, affordability analysis
- `/advisory` — AI-generated financial recommendations + Best Next Options (matched bank products)
- `/reports` — Monthly financial reports with verdict strip (main risk + next action) and granular metric hints
- `/intelligence/banks` — Bank product comparison tables (Savings, FD, Housing/Personal/Education Loans) with Data Transparency Layer (freshness badges, confidence labels, source links per row, transparency footer)
- `/intelligence/literacy` — Financial literacy center (Interest, Debt Ratio, EMI, Emergency Funds, Long-Term Savings)
- `/intelligence/invest` — Investment guide (Stock Market, Dividends, FD vs Equity, Wealth Planning)
- `/intelligence/ask-ai` — AI financial assistant chat (SSE streaming, OpenAI gpt-5.2, Bhutan financial context)
- `/admin/products` — Admin-only CRUD interface for financial products database with data freshness/confidence badges (visible only to admin users)

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

Express 5 API server with cookie-parser. Routes at `/api`: auth, profiles, income, expenses, obligations, savings, scores, loans, advisory, reports, dashboard, timeline, ask-ai, financial-products. Snapshot service auto-updates current month's financial summary on every CRUD operation (atomic upsert). AI chat uses OpenAI integration (lazy-initialized, SSE streaming). Financial products CRUD has admin-only write middleware (`requireAdmin`). Users table has `is_admin` boolean column. Seed script auto-populates financial products on first startup. Recommendation Matching Engine (`recommendationEngine.ts`) matches user financial condition to bank products from DB — returns up to 3 products and optional caution message. Included in both dashboard and advisory API responses as `bestNextOptions`.

### `artifacts/money-saathi-v1` (`@workspace/money-saathi-v1`)

React + Vite frontend. Uses TailwindCSS v4, Recharts for charts, Framer Motion for animations, wouter for routing.

### `lib/db` (`@workspace/db`)

Drizzle ORM with PostgreSQL. 10 tables for the financial platform (includes `financial_snapshots` with monthly data: income, expenses, savings, obligations, debt ratio, score, emergency fund months, profit margin).

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and custom fetch client with `credentials: 'include'`.
