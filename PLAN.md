# CoupleCash — 30-Day Plan

One focused chunk per day, sized to fit a single AI coding session.
Each day has a clear deliverable you can test before moving on.

> **MVP usable from Day 14.** Days 15–30 add savings, stats, recurring, PWA, deploy.

---

## Locked spec (decided 2026-06-02)

| Area | Decision |
|------|----------|
| **Users** | Two hard-coded accounts: `abieka` (admin), `semma` (member). Login by username (mapped to fake email internally). |
| **Admin scope** | `abieka` can: add/withdraw savings (on her own balance OR semma's), set goal target, manage recurring templates. `semma` can: add own income/expense, edit/delete anyone's transactions. |
| **Currency** | IDR. Format: `Rp 1.500.000`. Compact mode `Rp 1.5M` for tight UI. |
| **Categories** | Expense: Food, Shop, Transport, Fun, Bills, Saving. Income: single "Income" category. |
| **Saving logic** | Deposit = expense w/ category=Saving (saldo user ↓, total tabungan ↑). Withdraw = income w/ category=Saving (saldo user ↑, total tabungan ↓). Cannot withdraw > net deposit. Single active goal. Target persists when withdrawn — only progress changes. |
| **Recurring** | Monthly only, day 1–28. Auto-insert on app open if due. Admin-only management. |
| **Branding** | Coral `#FF8B7B` + Sky `#7DB9DE` + Cream `#FFF8F1` (light) / Navy `#1A2238` (dark) + Mint `#A8D8B9` (success). |
| **Stack** | Next.js 16 + TS + Tailwind v4 + Supabase (Auth + Postgres + RLS) + shadcn primitives + Recharts + Sonner + `next-pwa`. |
| **Language** | English UI. |

---

## Week 1 — Foundation (Day 1–7)

- [x] **Day 1 — Project init** (2026-06-02)
  - Scaffold Next.js 16 + TS + Tailwind v4 + ESLint + Turbopack
  - Install Supabase clients, `clsx`/`tailwind-merge`/`cva`, `lucide-react`, `zod`
  - Folder structure: `src/lib`, `src/lib/supabase`, `src/components`, `src/types`
  - `lib/utils.ts` with `cn()` + `formatIDR()`
  - Brand tokens in `globals.css` (light + dark mode via `.dark` class)
  - Landing placeholder with brand palette check
  - `.env.local.example`, `SETUP.md`, `PLAN.md`
  - **Test:** `pnpm dev` → http://localhost:3000 shows CoupleCash placeholder with coral/sky/mint pills

- [x] **Day 2 — Database schema** (2026-06-03)
  - `supabase/schema.sql`: 5 tables + `updated_at` triggers + RLS helper funcs (`auth_couple_id`, `auth_is_admin` w/ SECURITY DEFINER) + per-table RLS policies
  - Insert RLS: saving category requires admin. Goal update: admin only. Recurring: admin only. Transactions: any couple member can insert non-saving, edit/delete any in couple
  - `supabase/seed.sql`: one couple, two `auth.users` + `auth.identities` (raw inserts), two profiles, one goal. Idempotent. FALLBACK section if Supabase auth schema diverges
  - `src/types/database.ts`: Row/Insert/Update types + `Database` for typed client + `EXPENSE_CATEGORIES` const
  - Favicon swapped to logo SVG (`src/app/icon.svg`)
  - **Test:** run both SQL files in Supabase Studio → 2 users in `auth.users`, profiles + goal exist

- [x] **Day 3 — Supabase clients + login** (2026-06-03)
  - `lib/supabase/client.ts` (browser), `server.ts` (server, async cookies), `middleware.ts` (session refresh)
  - `/login` page with `LoginForm` client component, server action `login()` maps `username → username@couplecash.app` → `signInWithPassword`
  - `.env.local` populated with real Supabase keys; `pnpm setup` bootstrap script seeds couple + 2 auth users + profiles + goal
  - **Test:** curl POST signIn returns access_token + correct user.id (verified earlier)

- [x] **Day 4 — Auth protection + logout** (2026-06-03)
  - `src/proxy.ts` protects all routes except `/login` + static assets
  - `lib/auth.ts` → `getCurrentUser()` (server)
  - `src/hooks/use-user.ts` → `useUser()` client hook with `onAuthStateChange` subscription
  - Sidebar: navigation only + user avatar/name/role + logout icon pinned to bottom
  - FAB visible on ALL screen sizes (mobile: above bottom nav, desktop: bottom-right above sidebar offset)
  - Add Transaction removed from sidebar — always accessible via FAB

- [x] **Day 5 — Logo + design tokens** (2026-06-03)
  - Custom SVG logo: two hearts forming a coin, coral→sky gradient
  - Variants: full mark (logo + wordmark), icon-only, monochrome
  - Wire as `<Logo />` component
  - PWA icons stub (192/512 PNG export — final in Day 25)
  - **Test:** logo renders on login + dashboard placeholder, sharp at all sizes

- [x] **Day 6 — App shell** (2026-06-03)
  - `(app)` route group with authenticated layout (auth check in layout, not per-page)
  - Bottom nav mobile (5 tabs, active state, coral highlight)
  - Sidebar desktop (56px offset, logo + nav links + Add Transaction CTA)
  - FAB coral floating button on mobile (hidden on /add page)
  - Sonner toast provider mounted in layout
  - Routes: `/` `/history` `/stats` `/savings` `/settings` `/add` all working

- [x] **Day 7 — UI primitives** (2026-06-03)
  - Button (CVA: default/secondary/outline/ghost/destructive/accent + sm/md/lg/icon)
  - Input (with label, error, hint props)
  - Card / CardHeader / CardTitle / CardValue / CardContent
  - Badge (default/secondary/accent/muted/destructive)
  - Skeleton (animate-pulse)
  - EmptyState, PageHeader, StatCard components
  - Dashboard rebuilt with new primitives (greeting, balance cards, savings progress bar, monthly spend)

---

## Week 2 — Core CRUD (Day 8–14)

- [x] **Day 8 — Transaction service layer** (2026-06-03)
  - `features/transactions/schema.ts` — Zod validation (type/category consistency enforced)
  - `features/transactions/service.ts` — `listTransactions` (with period filter, search, user filter), `createTransaction`, `updateTransaction`, `deleteTransaction`, `getBalances` (dynamic from transactions), `getMonthlySpend` (top category)
  - `features/transactions/actions.ts` — server actions for add/update/delete with auth guard, role checks, `revalidatePath`
  - Sidebar sign out moved to bottom (user avatar + name + logout icon). Mobile logout in Settings page.
  - Dashboard `LogoutButton` removed (was redundant)

- [x] **Day 9 — Add Transaction form** (2026-06-03)
  - Type toggle (Expense/Income) — resets category on switch
  - IDR amount input (`inputMode="numeric"`, live formatting with `Intl.NumberFormat`)
  - Category grid (3-col icon+label pills, filters adminOnly=saving for non-admin)
  - Admin user selector (who is this for — defaults to self)
  - Note + date picker (default today)
  - Submit → `addTransactionAction` → toast success → redirect `/`
  - Error shown inline if validation fails

- [x] **Day 10 — Dashboard live balances** (2026-06-03)
  - All data fetched server-side in `Promise.all` (balances, monthly, today, goal, profiles)
  - Dynamic balance per user computed from transactions (income − expense)
  - Savings progress bar with % + "X to go" / "Goal reached!" indicator
  - Profiles sorted: current user first

- [x] **Day 11 — Dashboard secondary stats** (2026-06-03)
  - Today's spend per user (separate DB query filtered by `transaction_date = today`)
  - This month's spend per user
  - Biggest category this month (name + amount)
  - Quick actions: Add expense + View history

- [x] **Day 12 — History page** (2026-06-03)
  - Timeline grouped by date (Today / Yesterday / "12 Jun 2026")
  - 4 period tabs client-side filtered: Today / Week / Month / All
  - Search input filters by note + category label (client-side, instant)
  - Transaction item: category icon (color-coded), user avatar dot, note/label, +/- amount
  - Amount color: green for income, red for expense

- [x] **Day 13 — Edit + delete** (2026-06-03)
  - `⋯` overflow menu per transaction → Edit / Delete
  - Edit → `EditSheet` (bottom sheet on mobile, side panel on desktop) with pre-filled form
  - Delete → `ConfirmDialog` with destructive button + optimistic remove + rollback on error
  - `Sheet` component: slides from bottom mobile, floats right on desktop
  - `ConfirmDialog` component: centered modal with cancel/confirm

- [x] **Day 14 — Polish pass** (2026-06-03)
  - Empty states (no transactions yet), skeleton loading on dashboard/history
  - Error boundaries, toast on every mutation, mobile sizing pass
  - **Test:** MVP feels usable for daily logging. Start using it for real.

---

## Week 3 — Savings + Stats + Recurring (Day 15–21)

- [x] **Day 15 — Savings page** (2026-06-03)
  - Goal card: title, progress bar, amount saved, remaining, % label
  - Contribution split cards per user (amount + %)
  - Empty state when no movements

- [x] **Day 16 — Savings actions (admin)** (2026-06-03)
  - Deposit sheet: user selector + amount + note + date → expense/saving transaction
  - Withdraw sheet: same form → income/saving transaction
  - Edit goal sheet: title + target amount
  - All admin-only, validated server-side

- [x] **Day 17 — Savings history** (2026-06-03)
  - Savings movements grouped by date (deposits green +, withdrawals red -)
  - Supabase FK hint fix: `profiles!transactions_user_id_fkey` (two FKs on transactions → profiles)
  - loading.tsx skeletons for dashboard/history/savings, error.tsx boundary

- [x] **Day 18-20 — Stats page + charts** (2026-06-03)
  - Period tabs: Week / Month / 6 Months (client-side filter on full dataset)
  - User filter: Both / Abieka / Semma
  - Summary cards per user + combined
  - Donut pie chart: category breakdown with custom tooltip + legend
  - Bar chart: spending trend (daily/weekly/monthly) with per-user bars (coral + sky)
  - Recharts 3.x with ResponsiveContainer, no SSR issues

- [x] **Day 21 — Recurring templates + auto-run** (2026-06-03)
  - `/settings/recurring` (admin only) — list + create + toggle + delete
  - Fields: type, category, user, amount, note, day of month (1-28)
  - `RecurringRunner` client component in layout — fires `runDueRecurringAction()` on first mount per month (sessionStorage guard)
  - Auto-run: inserts transactions for due templates, marks `last_run_date`, toast on success

---

## Week 4 — Polish + PWA + Deploy (Day 22–30)

- [x] **Day 22 — Recurring auto-run** (2026-06-03, done with Day 21)
  - `runDueRecurringAction()` server action: checks `active=true AND day_of_month <= today AND last_run_date < month start`
  - Verified: `runDueRecurringAction` fires on login (seen in dev log)

- [x] **Day 23 — Settings: profile** (2026-06-03)
  - Edit display name (updates profiles table, revalidates dashboard)
  - Change password (Supabase Auth `updateUser`)
  - Both with inline error + toast success

- [x] **Day 24 — Settings: theme** (2026-06-03)
  - Light / Dark / System toggle in Settings
  - `ThemeScript` inline in `<head>` — reads localStorage before hydration, no FOUC
  - Persists to `localStorage` key `cc-theme`

- [x] **Day 25-26 — PWA: manifest + SW** (2026-06-03)
  - `public/manifest.webmanifest` with name, icons, shortcuts (Add, History)
  - SVG icons: 192, 512, maskable (coral background with safe zone)
  - `public/sw.js` — network-first pages, cache-first static, offline fallback to shell
  - `PwaRegister` client component registers SW on mount
  - proxy.ts updated to bypass `manifest.webmanifest`, `sw.js`, `icons/`

- [x] **Day 27 — Export CSV** (2026-06-03)
  - `GET /api/export/transactions` — authenticated route, returns CSV with headers
  - Columns: Date, User, Type, Category, Amount, Note, Created At
  - Settings page → Data section → "Export transactions CSV" download link

- [x] **Day 28 — Bug bash + autotest** (2026-06-03)
  - Fixed 14 bugs: login placeholder ("abieka" → "Enter username"), dark mode abrupt flash (transition class), `window.location.reload()` → `router.refresh()` in history + recurring, unused imports (Wallet, getStatsData), hardcoded profileColors, missing withdrawal validation
  - Dark mode: `.theme-transitioning` CSS class with 0.25s ease on bg/color/border — smooth on toggle
  - Savings withdraw: server-side validates against current netTotal, returns IDR-formatted error
  - Autotest via browser preview (15 flows): all passed
  - Verified: balance math, savings deposit/withdraw, role restrictions, delete optimistic, CSV export, error states

- [x] **Day 29 — Deploy to Vercel** (2026-06-03)
  - Git init + commit (92 files, 10.581 insertions)
  - Push ke GitHub: `github.com/abiekaputra/couplecash` (private)
  - Deploy via Vercel CLI — build pass, 0 TypeScript errors, 36s build time
  - Production: https://couplecash-swart.vercel.app
  - Env vars set: SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, APP_URL

- [ ] **Day 30 — Final polish + docs** *(waiting for user signal)*
  - README rewrite for handover
  - Cleanup: remove unused scaffold files (`next.svg`, etc.)

---

## How we work each day

1. I read the previous day's state (this file + the codebase)
2. Pick the next unchecked Day, mark it `[ ] → [x]` in this file when done
3. Commit at the end (when we set up git)
4. One concrete "Test:" instruction so you know it's working

If a day overflows, we split it. If a day is short, we don't pad.
