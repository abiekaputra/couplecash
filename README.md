# CoupleCash

A shared personal finance tracker built for two — track income and expenses together, manage a savings goal, set up recurring transactions, and view spending stats. Designed as a Progressive Web App (PWA) so it installs on mobile like a native app.

## Features

- **Dashboard** — combined balance overview with each partner's spending summary
- **Add Transactions** — income and expense with 7 categories, notes, and date picker
- **History** — full transaction log with inline edit and delete
- **Savings Goal** — shared savings tracker with deposit/withdrawal support
- **Recurring Transactions** — monthly auto-insert on app open (admin-managed)
- **Stats** — monthly breakdown by category with charts
- **Two-user system** — Admin and Member roles within a shared couple account
- **Dark mode** — system-aware with manual toggle
- **PWA** — installable on Android and iOS, works offline for cached views
- **CSV Export** — download full transaction history

## Tech Stack

- **Framework** — Next.js 16 (App Router, TypeScript)
- **Styling** — Tailwind CSS v4
- **Database & Auth** — Supabase (Postgres + RLS + Auth)
- **UI Components** — shadcn/ui primitives
- **Charts** — Recharts
- **Notifications** — Sonner
- **PWA** — next-pwa

## Getting Started

See [SETUP.md](SETUP.md) for the full step-by-step setup guide (Supabase project, env vars, database schema, dev server).

### Quick start (if Supabase is already configured)

```bash
pnpm install
cp .env.local.example .env.local
# fill in your Supabase credentials in .env.local
pnpm dev
```

Open `http://localhost:3000` and log in with the credentials created by `supabase/seed.sql`.

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated pages: dashboard, add, history, savings, stats, settings
│   ├── api/export/         # CSV export API route
│   └── login/              # Login page & server action
├── components/             # Shared UI components (nav, cards, icons)
├── features/               # Server actions & service layer per domain
│   ├── transactions/
│   ├── savings/
│   ├── recurring/
│   └── stats/
├── lib/supabase/           # Supabase client (browser, server, middleware)
└── types/                  # Database row types
supabase/
├── schema.sql              # Full database schema with RLS policies
└── seed.sql                # Sample couple + user data for local dev
```

## License

MIT
