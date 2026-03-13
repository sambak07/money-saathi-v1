# Money Saathi

A Bhutan-focused financial health platform. Track income, expenses, savings, and obligations. Get a health score (0–100), personalized advisory, loan affordability analysis, and AI-powered financial guidance — all tailored to Bhutan's banking ecosystem.

## Features

- **Dual Mode**: Individual and Small Business financial tracking
- **Health Score**: 0–100 score based on savings, debt, emergency fund, and expense ratios
- **Dashboard**: Real-time financial overview with insights, charts, and progress tracking
- **Data Entry**: Categorized income, expenses, obligations, and savings management
- **Loan Calculator**: EMI calculation with affordability analysis and health score impact
- **Advisory Engine**: Personalized recommendations based on your financial data
- **Monthly Reports**: Automated financial summaries with trend analysis
- **Bank Comparison**: Bhutanese bank product comparison (savings, FDs, loans)
- **AI Chat**: OpenAI-powered financial advisor with Bhutan-specific knowledge
- **Financial Vault**: Secure storage for bank accounts, FDs, loans, insurance, investments
- **Feedback System**: Built-in user feedback collection

Currency: BTN (Bhutanese Ngultrum), displayed as `Nu. X`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TailwindCSS v4, Recharts, Framer Motion, wouter |
| Backend | Express 5, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| AI | OpenAI API (optional) |
| Monorepo | pnpm workspaces |

---

## Prerequisites

- **Node.js** 20+ (24 recommended)
- **pnpm** 9+
- **PostgreSQL** 15+ (Supabase, Neon, or local)

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone <repo-url>
cd money-saathi
pnpm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/money_saathi
SESSION_SECRET=generate-a-random-32-char-string-here
OPENAI_API_KEY=sk-...  # Optional, for AI chat feature
```

### 3. Push database schema

```bash
cd lib/db
npx drizzle-kit push --force
cd ../..
```

This creates all tables in your PostgreSQL database. The financial products seed data is auto-loaded on first server start.

### 4. Start development servers

You can either export variables manually or use `.env` files:

**Option A — Export variables manually (any shell):**

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/money_saathi"
export SESSION_SECRET="your-secret"

# Terminal 1: API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2: Frontend (port 5173, proxies /api to port 8080)
pnpm --filter @workspace/money-saathi-v1 run dev
```

**Option B — Use `.env` file (Node 20+):**

```bash
# Terminal 1: API server (auto-loads .env from repo root)
pnpm --filter @workspace/api-server run dev:standalone

# Terminal 2: Frontend (port 5173, proxies /api to port 8080)
pnpm --filter @workspace/money-saathi-v1 run dev
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies all `/api/*` requests to the API server on port 8080.

---

## Supabase Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Get your connection string

In your Supabase dashboard: **Settings → Database → Connection string → URI**

Use the **Transaction pooler** connection string (port 6543) for the application:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 3. Configure environment

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SESSION_SECRET=your-random-secret
```

### 4. Push schema

```bash
cd lib/db
npx drizzle-kit push --force
```

---

## Vercel Deployment

Money Saathi can be deployed as two parts:
- **Frontend**: Static site on Vercel
- **API**: Standalone Node.js server (Railway, Render, Fly.io, or any Node hosting)

### Option A: Full-stack on a single host (recommended)

Deploy everything to Railway, Render, or Fly.io. The API server serves both the API and the frontend static files from a single process — no CORS or cookie issues.

1. Build both frontend and API:
   ```bash
   pnpm install
   BASE_PATH=/ pnpm --filter @workspace/money-saathi-v1 run build
   pnpm --filter @workspace/api-server run build
   ```

2. Copy frontend build into the API server's static directory:
   ```bash
   cp -r artifacts/money-saathi-v1/dist/public artifacts/api-server/dist/public
   ```

3. Start: `node artifacts/api-server/dist/index.cjs`

4. Environment variables:
   ```
   DATABASE_URL=your-supabase-url
   SESSION_SECRET=your-secret
   NODE_ENV=production
   PORT=8080
   OPENAI_API_KEY=sk-...  (optional)
   ```

### Option B: Frontend on Vercel + API on a separate host

> **Note:** Since auth uses `sameSite: "lax"` cookies, the frontend and API must be on the same domain (e.g., `app.example.com` for frontend and `api.example.com` for API with shared parent domain), or you must proxy API requests through Vercel rewrites so cookies are same-origin.

#### Deploy the API server

1. Deploy to any Node.js host (Railway, Render, Fly.io)
2. Set environment variables:
   ```
   DATABASE_URL=your-supabase-url
   SESSION_SECRET=your-secret
   NODE_ENV=production
   PORT=8080
   OPENAI_API_KEY=sk-...  (optional)
   ```
3. Build command: `pnpm run build`
4. Start command: `node dist/index.cjs`

#### Deploy the frontend to Vercel

1. Create a new Vercel project pointing to the repo
2. Set build settings:
   - **Root directory**: `artifacts/money-saathi-v1`
   - **Build command**: `cd ../.. && pnpm install && BASE_PATH=/ pnpm --filter @workspace/money-saathi-v1 run build`
   - **Output directory**: `dist/public`
3. Add a `vercel.json` in `artifacts/money-saathi-v1/`:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-api-server.com/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
   The `/api` rewrite proxies API calls through Vercel, keeping cookies on the same origin.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SESSION_SECRET` | Recommended | Random on startup | HMAC-SHA256 session signing key |
| `OPENAI_API_KEY` | No | — | OpenAI API key for AI chat |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | Custom OpenAI-compatible endpoint |
| `PORT` | No | `8080` | API server port |
| `NODE_ENV` | No | `development` | `production` enables secure cookies |
| `CORS_ORIGIN` | No | Reflects request | Comma-separated allowed origins |
| `BASE_PATH` | No | `/` | Frontend base path (for subpath hosting) |

---

## Project Structure

```
money-saathi/
├── artifacts/
│   ├── api-server/          # Express API (port 8080)
│   │   ├── src/
│   │   │   ├── routes/      # API routes (auth, dashboard, scores, etc.)
│   │   │   ├── lib/         # Financial engine, insights, recommendations
│   │   │   └── middlewares/ # Auth, admin middleware
│   │   └── build.ts         # esbuild production bundler
│   └── money-saathi-v1/     # React + Vite frontend
│       ├── src/
│       │   ├── pages/       # All page components
│       │   ├── components/  # Shared UI components
│       │   └── hooks/       # Auth hook, custom hooks
│       └── vite.config.ts
├── lib/
│   ├── db/                  # Drizzle ORM schema + connection
│   ├── api-spec/            # OpenAPI spec + Orval codegen
│   ├── api-client-react/    # Generated React Query hooks
│   └── api-zod/             # Generated Zod validation schemas
├── .env.example             # Environment variable template
├── pnpm-workspace.yaml
└── README.md
```

---

## Database Schema

The application uses 13 PostgreSQL tables:

- `users` — Authentication (email/password with bcrypt)
- `user_profiles` — Profile type (individual/small_business), currency
- `income_entries` — Income sources with categories and frequency
- `expense_entries` — Expenses with categories, payment modes
- `obligations` — Loans, mortgages, credit cards
- `savings_entries` — Savings accounts, FDs, investments
- `financial_scores` — Calculated health scores (0–100)
- `loan_calculations` — Saved loan calculator results
- `reports` — Monthly financial report snapshots
- `financial_snapshots` — Monthly aggregated financial data
- `financial_products` — Bank product database (24 products)
- `vault_*` — 5 vault tables (bank accounts, FDs, loans, insurance, investments)
- `feedback` — User feedback submissions

---

## Admin Access

To make a user an admin (for managing financial products and viewing feedback):

```sql
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

---

## License

MIT
